import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buscarRGF, buscarRREO, listarEntes } from "../../src/siconfi/client.js";
import { lerFixture } from "./fixtures.js";

function respostaFake(corpo: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? "OK" : "Erro",
    json: async () => corpo,
  } as unknown as Response;
}

describe("client SICONFI", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("buscarRREO extrai a lista de itens do fixture real", async () => {
    const fixture = lerFixture("rreo_4303004_2024_p6.json") as {
      items: unknown[];
    };
    fetchMock.mockResolvedValueOnce(respostaFake(fixture));

    const itens = await buscarRREO({
      anExercicio: 2024,
      nrPeriodo: 6,
      idEnte: 4303004,
    });

    expect(itens).toHaveLength(fixture.items.length);
    expect(itens[0]).toMatchObject({ cod_ibge: 4303004, demonstrativo: "RREO" });
  });

  it("buscarRGF extrai a lista de itens do fixture real e usa in_periodicidade=Q e co_poder=E por padrão", async () => {
    const fixture = lerFixture("rgf_4303004_2024_p3.json") as {
      items: unknown[];
    };
    fetchMock.mockResolvedValueOnce(respostaFake(fixture));

    const itens = await buscarRGF({
      anExercicio: 2024,
      nrPeriodo: 3,
      idEnte: 4303004,
    });

    expect(itens).toHaveLength(fixture.items.length);

    const urlChamada = new URL(fetchMock.mock.calls[0]?.[0] as string | URL);
    expect(urlChamada.searchParams.get("in_periodicidade")).toBe("Q");
    expect(urlChamada.searchParams.get("co_poder")).toBe("E");
  });

  it("listarEntes extrai a lista de itens do fixture real", async () => {
    const fixture = lerFixture("entes_municipios_alvo.json") as {
      items: unknown[];
    };
    fetchMock.mockResolvedValueOnce(respostaFake(fixture));

    const entes = await listarEntes();

    expect(entes).toHaveLength(fixture.items.length);
    expect(entes.map((e) => e.cod_ibge)).toContain(4303004);
  });

  it("percorre todas as páginas até hasMore ser false", async () => {
    const paginaUm = {
      items: [{ cod_ibge: 4303004, ente: "A", capital: "0", regiao: "SU", uf: "RS", esfera: "M", exercicio: 2024, populacao: 1, cnpj: "1" }],
      hasMore: true,
      limit: 1,
      offset: 0,
      count: 2,
    };
    const paginaDois = {
      items: [{ cod_ibge: 4315701, ente: "B", capital: "0", regiao: "SU", uf: "RS", esfera: "M", exercicio: 2024, populacao: 1, cnpj: "2" }],
      hasMore: false,
      limit: 1,
      offset: 1,
      count: 2,
    };
    fetchMock
      .mockResolvedValueOnce(respostaFake(paginaUm))
      .mockResolvedValueOnce(respostaFake(paginaDois));

    const entes = await listarEntes();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(entes.map((e) => e.cod_ibge)).toEqual([4303004, 4315701]);
  });

  it("falha alto quando a resposta não bate com o schema, em vez de retornar dado não validado", async () => {
    fetchMock.mockResolvedValueOnce(
      respostaFake({ items: [{ cod_ibge: "não é número" }], hasMore: false, limit: 1, offset: 0, count: 1 }),
    );

    await expect(
      buscarRREO({ anExercicio: 2024, nrPeriodo: 6, idEnte: 4303004 }),
    ).rejects.toThrow(/não bate com o schema/);
  });

  it("falha alto quando o SICONFI responde erro HTTP, mesmo após retries", async () => {
    fetchMock.mockResolvedValue(respostaFake({}, false, 500));

    await expect(
      buscarRREO({ anExercicio: 2024, nrPeriodo: 6, idEnte: 4303004 }),
    ).rejects.toThrow(/Falha ao buscar/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
