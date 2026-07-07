import { beforeAll, describe, expect, it } from "vitest";
import { abrirBanco, type Banco } from "../../ingestion/src/db/client.js";
import {
  type MunicipioParaGravar,
  type StatusIngestao,
  upsertMunicipio,
  upsertProgresso,
  upsertResultado,
} from "../../ingestion/src/db/repositorio.js";
import { criarApp } from "../src/app.js";

const SAO_SEPE_IBGE = 4319604;
const IBGE_INEXISTENTE = 9999999;

/**
 * Microrregião de Cachoeira do Sul (id 43022) — mesmo oráculo da Tarefa 1.2:
 * 7 municípios, 6 vizinhos. População/microrregião confirmadas via IBGE +
 * SICONFI (data/fixtures/NOTES.md). São Sepé fica de fora (microrregião 43028)
 * para provar que o filtro por microrregião funciona na borda da API.
 */
const CADASTRO: readonly (MunicipioParaGravar & { statusIngestao: StatusIngestao })[] = [
  { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS", populacao: 82222, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "completo" },
  { codIbge: 4305132, nome: "Cerro Branco", uf: "RS", populacao: 3859, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "parcial" },
  { codIbge: 4313391, nome: "Novo Cabrais", uf: "RS", populacao: 3633, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "completo" },
  { codIbge: 4313953, nome: "Pantano Grande", uf: "RS", populacao: 10443, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "completo" },
  { codIbge: 4314027, nome: "Paraíso do Sul", uf: "RS", populacao: 6627, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "sem_dados" },
  { codIbge: 4314076, nome: "Passo do Sobrado", uf: "RS", populacao: 6155, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "completo" },
  { codIbge: 4315701, nome: "Rio Pardo", uf: "RS", populacao: 35641, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", statusIngestao: "completo" },
  { codIbge: SAO_SEPE_IBGE, nome: "São Sepé", uf: "RS", populacao: 21551, microrregiaoId: 43028, microrregiaoNome: "São Sepé", statusIngestao: "sem_dados" },
];

let db: Banco;
let app: ReturnType<typeof criarApp>;

beforeAll(() => {
  ({ db } = abrirBanco(":memory:"));

  for (const item of CADASTRO) {
    const { statusIngestao, ...cadastro } = item;
    upsertMunicipio(db, cadastro);
    upsertProgresso(db, {
      municipio: { codIbge: cadastro.codIbge, nome: cadastro.nome, uf: cadastro.uf },
      exercicio: 2024,
      status: statusIngestao,
      indicadoresOk: statusIngestao === "sem_dados" ? 0 : 5,
      indicadoresFalha: statusIngestao === "completo" ? 0 : 2,
    });
  }

  const CACHOEIRA_DO_SUL = { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS" } as const;
  upsertResultado(db, {
    indicador: "receita_corrente_liquida",
    municipio: CACHOEIRA_DO_SUL,
    periodo: { exercicio: 2024, numero: 6, periodicidade: "B" },
    valor: 386_316_913.8,
    unidade: "BRL",
    fonte:
      'SICONFI RREO 2024, 6º bimestre, RREO-Anexo 03, RREO3ReceitaCorrenteLiquida, coluna "TOTAL (ÚLTIMOS 12 MESES)"',
    anexo: "RREO-Anexo 03",
    codConta: "RREO3ReceitaCorrenteLiquida",
    coluna: "TOTAL (ÚLTIMOS 12 MESES)",
  });
  upsertResultado(db, {
    indicador: "despesa_pessoal",
    municipio: CACHOEIRA_DO_SUL,
    periodo: { exercicio: 2024, numero: 3, periodicidade: "Q" },
    valor: 40.33,
    unidade: "PERCENTUAL",
    fonte:
      'SICONFI RGF 2024, 3º quadrimestre, RGF-Anexo 01, DespesaComPessoalTotal, coluna "% sobre a RCL Ajustada"',
    anexo: "RGF-Anexo 01",
    codConta: "DespesaComPessoalTotal",
    coluna: "% sobre a RCL Ajustada",
  });

  app = criarApp(db);
});

describe("GET /municipios", () => {
  it("lista todos os municípios do cadastro (não só os 5 da Fase 0) com status", async () => {
    const res = await app.request("/municipios?ano=2024");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      municipios: Array<{ codIbge: number; nome: string; status: string }>;
    };
    expect(body.municipios).toHaveLength(CADASTRO.length);

    // Ordenado por nome (pt-BR): Cachoeira do Sul vem antes de Cerro Branco.
    expect(body.municipios[0]?.nome).toBe("Cachoeira do Sul");

    const cachoeira = body.municipios.find((m) => m.codIbge === 4303004);
    expect(cachoeira?.status).toBe("com_dados");

    const saoSepe = body.municipios.find((m) => m.codIbge === SAO_SEPE_IBGE);
    expect(saoSepe?.status).toBe("sem_dados");
  });

  it("parcial conta como com_dados (há número a mostrar)", async () => {
    const res = await app.request("/municipios?ano=2024");
    const body = (await res.json()) as { municipios: Array<{ codIbge: number; status: string }> };
    const cerroBranco = body.municipios.find((m) => m.codIbge === 4305132);
    expect(cerroBranco?.status).toBe("com_dados");
  });

  it("ano ausente retorna 400", async () => {
    const res = await app.request("/municipios");
    expect(res.status).toBe(400);
  });
});

describe("GET /municipios/:ibge/vizinhos", () => {
  it("retorna os vizinhos da microrregião do foco, sem incluir o próprio, ordenados por nome", async () => {
    const res = await app.request("/municipios/4303004/vizinhos?ano=2024");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      criterio: string;
      vizinhos: Array<{ codIbge: number; nome: string; status: string }>;
    };
    expect(body.criterio).toBe("regional");
    expect(body.vizinhos.map((v) => v.nome)).toEqual([
      "Cerro Branco",
      "Novo Cabrais",
      "Pantano Grande",
      "Paraíso do Sul",
      "Passo do Sobrado",
      "Rio Pardo",
    ]);
    expect(body.vizinhos.some((v) => v.codIbge === 4303004)).toBe(false);
    expect(body.vizinhos.some((v) => v.codIbge === SAO_SEPE_IBGE)).toBe(false);
  });

  it("vizinho sem_dados aparece marcado, não some da lista", async () => {
    const res = await app.request("/municipios/4303004/vizinhos?ano=2024");
    const body = (await res.json()) as {
      vizinhos: Array<{ nome: string; status: string }>;
    };
    const paraiso = body.vizinhos.find((v) => v.nome === "Paraíso do Sul");
    expect(paraiso?.status).toBe("sem_dados");
  });

  it("critério inválido retorna 400", async () => {
    const res = await app.request("/municipios/4303004/vizinhos?ano=2024&criterio=porte");
    expect(res.status).toBe(400);
    const body = (await res.json()) as { erro: string };
    expect(body.erro).toMatch(/porte/);
  });

  it("cod_ibge fora do cadastro retorna 404", async () => {
    const res = await app.request(`/municipios/${IBGE_INEXISTENTE}/vizinhos?ano=2024`);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { erro: string };
    expect(body.erro).toMatch(/9999999/);
  });

  it("ano ausente retorna 400", async () => {
    const res = await app.request("/municipios/4303004/vizinhos");
    expect(res.status).toBe(400);
  });
});

describe("GET /municipios/:ibge/indicadores", () => {
  it("retorna os indicadores de um município com dados, com rastreabilidade", async () => {
    const res = await app.request("/municipios/4303004/indicadores?ano=2024");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      status: string;
      indicadores: unknown[];
    };
    expect(body.status).toBe("com_dados");
    expect(body.indicadores).toHaveLength(2);
    expect(body.indicadores).toContainEqual(
      expect.objectContaining({
        indicador: "receita_corrente_liquida",
        valor: 386_316_913.8,
        anexo: "RREO-Anexo 03",
        codConta: "RREO3ReceitaCorrenteLiquida",
        coluna: "TOTAL (ÚLTIMOS 12 MESES)",
      }),
    );
  });

  it("São Sepé (sem dado publicado) responde 200 com status sem_dados, não 404", async () => {
    const res = await app.request(`/municipios/${SAO_SEPE_IBGE}/indicadores?ano=2024`);
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      status: string;
      indicadores: unknown[];
      municipio: { nome: string };
    };
    expect(body.status).toBe("sem_dados");
    expect(body.indicadores).toEqual([]);
    expect(body.municipio.nome).toBe("São Sepé");
  });

  it("cod_ibge fora do cadastro retorna 404 com corpo de erro claro", async () => {
    const res = await app.request(`/municipios/${IBGE_INEXISTENTE}/indicadores?ano=2024`);
    expect(res.status).toBe(404);

    const body = (await res.json()) as { erro: string };
    expect(body.erro).toMatch(/9999999/);
  });

  it("ano ausente retorna 400", async () => {
    const res = await app.request("/municipios/4303004/indicadores");
    expect(res.status).toBe(400);
  });

  it("ano inválido retorna 400", async () => {
    const res = await app.request("/municipios/4303004/indicadores?ano=abacate");
    expect(res.status).toBe(400);
  });
});
