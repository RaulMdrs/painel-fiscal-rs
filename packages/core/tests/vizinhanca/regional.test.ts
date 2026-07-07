import { describe, expect, it } from "vitest";
import { encontrarVizinhos } from "../../src/vizinhanca/index.js";
import { encontrarVizinhosRegional } from "../../src/vizinhanca/regional.js";
import type { MunicipioVizinhanca } from "../../src/vizinhanca/tipos.js";

/**
 * Microrregião "Cachoeira do Sul" (id 43022), 7 municípios — confirmado via
 * API de Localidades do IBGE em 2026-07-07 (ver data/fixtures/NOTES.md).
 * População vinda do SICONFI /entes na mesma data.
 */
const MICRORREGIAO_CACHOEIRA_DO_SUL: readonly MunicipioVizinhanca[] = [
  { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS", populacao: 82222, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "completo" },
  { codIbge: 4305132, nome: "Cerro Branco", uf: "RS", populacao: 3859, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "completo" },
  { codIbge: 4313391, nome: "Novo Cabrais", uf: "RS", populacao: 3633, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "parcial" },
  { codIbge: 4313953, nome: "Pantano Grande", uf: "RS", populacao: 10443, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "completo" },
  { codIbge: 4314027, nome: "Paraíso do Sul", uf: "RS", populacao: 6627, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "sem_dados" },
  { codIbge: 4314076, nome: "Passo do Sobrado", uf: "RS", populacao: 6155, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "completo" },
  { codIbge: 4315701, nome: "Rio Pardo", uf: "RS", populacao: 35641, microrregiaoId: 43022, microrregiaoNome: "Cachoeira do Sul", status: "completo" },
  // Município de outra microrregião — não deve aparecer como vizinho de Cachoeira do Sul.
  { codIbge: 4319604, nome: "São Sepé", uf: "RS", populacao: 21551, microrregiaoId: 43028, microrregiaoNome: "São Sepé", status: "sem_dados" },
];

/**
 * Microrregião "Lajeado-Estrela" (id 43021), a maior do RS com 31
 * municípios — usada para travar o critério de priorização por proximidade
 * de população quando o total excede o limite. Dados confirmados via IBGE +
 * SICONFI /entes em 2026-07-07 (ver data/fixtures/NOTES.md).
 */
const MICRORREGIAO_LAJEADO_ESTRELA: readonly MunicipioVizinhanca[] = [
  { codIbge: 4311403, nome: "Lajeado", uf: "RS", populacao: 96879, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4321451, nome: "Teutônia", uf: "RS", populacao: 34023, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4307807, nome: "Estrela", uf: "RS", populacao: 33263, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4321303, nome: "Taquari", uf: "RS", populacao: 25963, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4306809, nome: "Encantado", uf: "RS", populacao: 23520, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4301008, nome: "Arroio do Meio", uf: "RS", populacao: 22523, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4302402, nome: "Bom Retiro do Sul", uf: "RS", populacao: 12587, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4306205, nome: "Cruzeiro do Sul", uf: "RS", populacao: 12574, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4315800, nome: "Roca Sales", uf: "RS", populacao: 10646, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4314159, nome: "Paverama", uf: "RS", populacao: 8146, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4316758, nome: "Santa Clara do Sul", uf: "RS", populacao: 7079, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4302451, nome: "Boqueirão do Leão", uf: "RS", populacao: 6202, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4315156, nome: "Progresso", uf: "RS", populacao: 5423, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4312609, nome: "Muçum", uf: "RS", populacao: 4692, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4320859, nome: "Tabaí", uf: "RS", populacao: 4569, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4308078, nome: "Fazenda Vilanova", uf: "RS", populacao: 4405, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4312054, nome: "Marques de Souza", uf: "RS", populacao: 4050, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4323770, nome: "Westfália", uf: "RS", populacao: 3223, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "sem_dados" },
  { codIbge: 4310363, nome: "Imigrante", uf: "RS", populacao: 3149, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4313003, nome: "Nova Bréscia", uf: "RS", populacao: 3104, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4304697, nome: "Capitão", uf: "RS", populacao: 2994, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4305587, nome: "Colinas", uf: "RS", populacao: 2474, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4308433, nome: "Forquetinha", uf: "RS", populacao: 2441, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4321626, nome: "Travesseiro", uf: "RS", populacao: 2192, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4320453, nome: "Sério", uf: "RS", populacao: 2089, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4306759, nome: "Doutor Ricardo", uf: "RS", populacao: 1924, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4322855, nome: "Vespasiano Corrêa", uf: "RS", populacao: 1851, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4315453, nome: "Relvado", uf: "RS", populacao: 1826, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4315131, nome: "Pouso Novo", uf: "RS", populacao: 1771, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4304614, nome: "Canudos do Vale", uf: "RS", populacao: 1686, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
  { codIbge: 4305835, nome: "Coqueiro Baixo", uf: "RS", populacao: 1308, microrregiaoId: 43021, microrregiaoNome: "Lajeado-Estrela", status: "completo" },
];

describe("encontrarVizinhosRegional", () => {
  it("retorna os municípios da mesma microrregião de Cachoeira do Sul, sem incluir ela mesma", () => {
    const vizinhos = encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, {});

    expect(vizinhos.map((v) => v.nome)).toEqual([
      "Cerro Branco",
      "Novo Cabrais",
      "Pantano Grande",
      "Paraíso do Sul",
      "Passo do Sobrado",
      "Rio Pardo",
    ]);
    expect(vizinhos.some((v) => v.codIbge === 4303004)).toBe(false);
  });

  it("não inclui municípios de outra microrregião", () => {
    const vizinhos = encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, {});

    expect(vizinhos.some((v) => v.nome === "São Sepé")).toBe(false);
  });

  it("vizinho sem_dados aparece na lista com o status marcado, não some", () => {
    const vizinhos = encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, {});

    const paraisoDoSul = vizinhos.find((v) => v.nome === "Paraíso do Sul");
    expect(paraisoDoSul?.status).toBe("sem_dados");
    expect(vizinhos).toHaveLength(6);
  });

  it("município cod_ibge desconhecido falha alto em vez de retornar lista vazia", () => {
    expect(() => encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 9999999, {})).toThrow(
      /não encontrado/,
    );
  });

  it("limite configurável reduz o número de vizinhos", () => {
    const vizinhos = encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, {
      limite: 2,
    });

    expect(vizinhos).toHaveLength(2);
  });

  it("quando excede o limite, prioriza vizinhos de população mais próxima à do foco, não os N maiores", () => {
    // Roca Sales (10.646 hab.) tem 30 concorrentes na maior microrregião do RS.
    // Os 6 mais próximos em população não são os 6 mais populosos da região
    // (Lajeado, Teutônia, Estrela... são muito maiores) — são os vizinhos de
    // porte parecido: Cruzeiro do Sul, Bom Retiro do Sul, Paverama, Santa
    // Clara do Sul, Boqueirão do Leão, Progresso.
    const vizinhos = encontrarVizinhosRegional(MICRORREGIAO_LAJEADO_ESTRELA, 4315800, {
      limite: 6,
    });

    expect(vizinhos.map((v) => v.codIbge).sort((a, b) => a - b)).toEqual(
      [4302402, 4302451, 4306205, 4314159, 4315156, 4316758].sort((a, b) => a - b),
    );
    // Confirma que NÃO é simplesmente "os 6 maiores" da microrregião.
    expect(vizinhos.some((v) => v.nome === "Lajeado")).toBe(false);
  });

  it("microrregião pequena (menor que o limite) retorna todos os candidatos, sem aplicar o critério de proximidade", () => {
    const vizinhos = encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, {
      limite: 10,
    });

    expect(vizinhos).toHaveLength(6);
  });
});

describe("encontrarVizinhos (dispatcher por critério)", () => {
  it("despacha 'regional' para a mesma estratégia usada diretamente", () => {
    const viaDispatcher = encontrarVizinhos(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, "regional");
    const direto = encontrarVizinhosRegional(MICRORREGIAO_CACHOEIRA_DO_SUL, 4303004, {});

    expect(viaDispatcher).toEqual(direto);
  });

  it("aplica o limite padrão (10) quando nenhuma opção é passada", () => {
    const vizinhos = encontrarVizinhos(MICRORREGIAO_LAJEADO_ESTRELA, 4315800, "regional");

    expect(vizinhos).toHaveLength(10);
  });

  it("repassa opções de limite ao despachar", () => {
    const vizinhos = encontrarVizinhos(MICRORREGIAO_LAJEADO_ESTRELA, 4315800, "regional", {
      limite: 3,
    });

    expect(vizinhos).toHaveLength(3);
  });
});
