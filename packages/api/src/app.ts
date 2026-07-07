import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  type CriterioVizinhanca,
  encontrarVizinhos,
} from "../../core/src/vizinhanca/index.js";
import type { StatusDadosMunicipio } from "../../core/src/vizinhanca/tipos.js";
import type { Banco } from "../../ingestion/src/db/client.js";
import {
  buscarMunicipioCadastro,
  listarMunicipiosParaVizinhanca,
} from "../../ingestion/src/db/repositorio.js";
import { resultadosIndicadores } from "../../ingestion/src/db/schema.js";
import { mapearLinha } from "./mapearLinha.js";

export type StatusMunicipio = "com_dados" | "sem_dados";

/** Critérios de vizinhança que a API aceita hoje (Tarefa 1.2). "porte" entra aqui quando existir. */
const CRITERIOS_VALIDOS: readonly CriterioVizinhanca[] = ["regional"];

/**
 * Colapsa o status tri-estado da ingestão (completo/parcial/sem_dados) no
 * binário que a UI usa: "publicou algum indicador" vs. "não publicou". Parcial
 * conta como com_dados — há número a mostrar.
 */
function statusBinario(status: StatusDadosMunicipio): StatusMunicipio {
  return status === "sem_dados" ? "sem_dados" : "com_dados";
}

/** Lê e valida o parâmetro obrigatório `ano`; devolve o número ou uma mensagem de erro. */
function lerAno(anoParam: string | undefined): { ano: number } | { erro: string } {
  if (anoParam === undefined) {
    return { erro: "parâmetro obrigatório ausente: ano" };
  }
  const ano = Number(anoParam);
  if (!Number.isInteger(ano)) {
    return { erro: `ano inválido: "${anoParam}"` };
  }
  return { ano };
}

export function criarApp(db: Banco): Hono {
  const app = new Hono();
  app.use("*", cors());

  app.get("/municipios", (c) => {
    const ano = lerAno(c.req.query("ano"));
    if ("erro" in ano) {
      return c.json({ erro: ano.erro }, 400);
    }

    const municipios = listarMunicipiosParaVizinhanca(db, ano.ano)
      .map((m) => ({
        codIbge: m.codIbge,
        nome: m.nome,
        uf: m.uf,
        status: statusBinario(m.status),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return c.json({ municipios });
  });

  app.get("/municipios/:ibge/vizinhos", (c) => {
    const ibgeParam = c.req.param("ibge");
    const codIbge = Number(ibgeParam);
    if (!Number.isInteger(codIbge)) {
      return c.json({ erro: `cod_ibge inválido: "${ibgeParam}"` }, 400);
    }

    const ano = lerAno(c.req.query("ano"));
    if ("erro" in ano) {
      return c.json({ erro: ano.erro }, 400);
    }

    const criterioParam = c.req.query("criterio") ?? "regional";
    if (!CRITERIOS_VALIDOS.includes(criterioParam as CriterioVizinhanca)) {
      return c.json(
        {
          erro: `critério de vizinhança inválido: "${criterioParam}". Válidos: ${CRITERIOS_VALIDOS.join(", ")}.`,
        },
        400,
      );
    }
    const criterio = criterioParam as CriterioVizinhanca;

    const universo = listarMunicipiosParaVizinhanca(db, ano.ano);
    const foco = universo.find((m) => m.codIbge === codIbge);
    if (foco === undefined) {
      return c.json(
        { erro: `Município com cod_ibge ${codIbge} não encontrado no cadastro do RS.` },
        404,
      );
    }

    const vizinhos = encontrarVizinhos(universo, codIbge, criterio).map((m) => ({
      codIbge: m.codIbge,
      nome: m.nome,
      uf: m.uf,
      status: statusBinario(m.status),
    }));

    return c.json({
      foco: {
        codIbge: foco.codIbge,
        nome: foco.nome,
        uf: foco.uf,
        status: statusBinario(foco.status),
      },
      criterio,
      vizinhos,
    });
  });

  app.get("/municipios/:ibge/indicadores", (c) => {
    const ibgeParam = c.req.param("ibge");
    const codIbge = Number(ibgeParam);
    if (!Number.isInteger(codIbge)) {
      return c.json({ erro: `cod_ibge inválido: "${ibgeParam}"` }, 400);
    }

    const municipio = buscarMunicipioCadastro(db, codIbge);
    if (municipio === undefined) {
      return c.json(
        { erro: `Município com cod_ibge ${codIbge} não encontrado no cadastro do RS.` },
        404,
      );
    }

    const ano = lerAno(c.req.query("ano"));
    if ("erro" in ano) {
      return c.json({ erro: ano.erro }, 400);
    }

    const linhas = db
      .select()
      .from(resultadosIndicadores)
      .where(
        and(
          eq(resultadosIndicadores.codIbge, codIbge),
          eq(resultadosIndicadores.exercicio, ano.ano),
        ),
      )
      .all();

    if (linhas.length === 0) {
      return c.json({
        municipio,
        ano: ano.ano,
        status: "sem_dados" satisfies StatusMunicipio,
        indicadores: [],
      });
    }

    const indicadores = linhas.map((linha) => mapearLinha(linha, municipio));
    return c.json({
      municipio,
      ano: ano.ano,
      status: "com_dados" satisfies StatusMunicipio,
      indicadores,
    });
  });

  return app;
}
