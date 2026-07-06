import { beforeAll, describe, expect, it } from "vitest";
import { abrirBanco, type Banco } from "../../ingestion/src/db/client.js";
import { upsertResultado } from "../../ingestion/src/db/repositorio.js";
import { criarApp } from "../src/app.js";

const CACHOEIRA_DO_SUL = {
  codIbge: 4303004,
  nome: "Cachoeira do Sul",
  uf: "RS",
} as const;
const SAO_SEPE_IBGE = 4319604;
const IBGE_INEXISTENTE = 9999999;

let db: Banco;
let app: ReturnType<typeof criarApp>;

beforeAll(() => {
  ({ db } = abrirBanco(":memory:"));

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
  it("lista os 5 municípios-alvo com status com_dados/sem_dados", async () => {
    const res = await app.request("/municipios");
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      municipios: Array<{ codIbge: number; status: string }>;
    };
    expect(body.municipios).toHaveLength(5);

    const cachoeira = body.municipios.find((m) => m.codIbge === 4303004);
    expect(cachoeira?.status).toBe("com_dados");

    const saoSepe = body.municipios.find((m) => m.codIbge === SAO_SEPE_IBGE);
    expect(saoSepe?.status).toBe("sem_dados");
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
    const res = await app.request(
      `/municipios/${SAO_SEPE_IBGE}/indicadores?ano=2024`,
    );
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

  it("cod_ibge inexistente retorna 404 com corpo de erro claro", async () => {
    const res = await app.request(
      `/municipios/${IBGE_INEXISTENTE}/indicadores?ano=2024`,
    );
    expect(res.status).toBe(404);

    const body = (await res.json()) as { erro: string };
    expect(body.erro).toMatch(/9999999/);
  });

  it("ano ausente retorna 400", async () => {
    const res = await app.request("/municipios/4303004/indicadores");
    expect(res.status).toBe(400);
  });

  it("ano inválido retorna 400", async () => {
    const res = await app.request(
      "/municipios/4303004/indicadores?ano=abacate",
    );
    expect(res.status).toBe(400);
  });
});
