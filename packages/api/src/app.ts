import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { MUNICIPIOS_ALVO } from "../../core/src/municipiosAlvo.js";
import type { Banco } from "../../ingestion/src/db/client.js";
import { resultadosIndicadores } from "../../ingestion/src/db/schema.js";
import { mapearLinha } from "./mapearLinha.js";

export type StatusMunicipio = "com_dados" | "sem_dados";

export function criarApp(db: Banco): Hono {
  const app = new Hono();
  app.use("*", cors());

  app.get("/municipios", (c) => {
    const linhas = db
      .selectDistinct({ codIbge: resultadosIndicadores.codIbge })
      .from(resultadosIndicadores)
      .all();
    const codigosComDados = new Set(linhas.map((linha) => linha.codIbge));

    const municipios = MUNICIPIOS_ALVO.map((municipio) => ({
      ...municipio,
      status: (codigosComDados.has(municipio.codIbge)
        ? "com_dados"
        : "sem_dados") satisfies StatusMunicipio,
    }));

    return c.json({ municipios });
  });

  app.get("/municipios/:ibge/indicadores", (c) => {
    const ibgeParam = c.req.param("ibge");
    const codIbge = Number(ibgeParam);
    if (!Number.isInteger(codIbge)) {
      return c.json({ erro: `cod_ibge inválido: "${ibgeParam}"` }, 400);
    }

    const municipio = MUNICIPIOS_ALVO.find((m) => m.codIbge === codIbge);
    if (municipio === undefined) {
      return c.json(
        {
          erro: `Município com cod_ibge ${codIbge} não é um dos municípios-alvo desta fase.`,
        },
        404,
      );
    }

    const anoParam = c.req.query("ano");
    if (anoParam === undefined) {
      return c.json({ erro: "parâmetro obrigatório ausente: ano" }, 400);
    }
    const ano = Number(anoParam);
    if (!Number.isInteger(ano)) {
      return c.json({ erro: `ano inválido: "${anoParam}"` }, 400);
    }

    const linhas = db
      .select()
      .from(resultadosIndicadores)
      .where(
        and(
          eq(resultadosIndicadores.codIbge, codIbge),
          eq(resultadosIndicadores.exercicio, ano),
        ),
      )
      .all();

    if (linhas.length === 0) {
      return c.json({
        municipio,
        ano,
        status: "sem_dados" satisfies StatusMunicipio,
        indicadores: [],
      });
    }

    const indicadores = linhas.map(mapearLinha);
    return c.json({
      municipio,
      ano,
      status: "com_dados" satisfies StatusMunicipio,
      indicadores,
    });
  });

  return app;
}
