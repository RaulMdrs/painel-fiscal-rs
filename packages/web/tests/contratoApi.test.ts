import { describe, expect, it } from "vitest";
import {
  respostaIndicadoresSchema,
  respostaMunicipiosSchema,
} from "../src/lib/contratoApi";

// Payloads espelhando respostas reais da API da Tarefa 5 (valores do cache 2024).
const payloadMunicipios = {
  municipios: [
    { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS", status: "com_dados" },
    { codIbge: 4319604, nome: "São Sepé", uf: "RS", status: "sem_dados" },
  ],
};

const payloadIndicadores = {
  municipio: { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS" },
  ano: 2024,
  status: "com_dados",
  indicadores: [
    {
      indicador: "despesa_pessoal",
      municipio: { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS" },
      periodo: { exercicio: 2024, numero: 3, periodicidade: "Q" },
      valor: 40.33,
      unidade: "PERCENTUAL",
      fonte:
        'SICONFI RGF 2024, 3º quadrimestre, RGF-Anexo 01, DespesaComPessoalTotal, coluna "% sobre a RCL Ajustada"',
      anexo: "RGF-Anexo 01",
      codConta: "DespesaComPessoalTotal",
      coluna: "% sobre a RCL Ajustada",
    },
  ],
};

describe("contrato da API — /municipios", () => {
  it("aceita a resposta real", () => {
    const resposta = respostaMunicipiosSchema.parse(payloadMunicipios);
    expect(resposta.municipios).toHaveLength(2);
    expect(resposta.municipios[0]?.status).toBe("com_dados");
  });

  it("rejeita status desconhecido em vez de exibir dado suspeito", () => {
    const corrompido = {
      municipios: [{ codIbge: 1, nome: "X", uf: "RS", status: "talvez" }],
    };
    expect(() => respostaMunicipiosSchema.parse(corrompido)).toThrow();
  });
});

describe("contrato da API — /municipios/:ibge/indicadores", () => {
  it("aceita a resposta real com fonte rastreável", () => {
    const resposta = respostaIndicadoresSchema.parse(payloadIndicadores);
    expect(resposta.indicadores[0]?.fonte).toContain("SICONFI RGF 2024");
  });

  it("aceita a resposta sem_dados (São Sepé)", () => {
    const resposta = respostaIndicadoresSchema.parse({
      municipio: { codIbge: 4319604, nome: "São Sepé", uf: "RS" },
      ano: 2024,
      status: "sem_dados",
      indicadores: [],
    });
    expect(resposta.status).toBe("sem_dados");
    expect(resposta.indicadores).toHaveLength(0);
  });

  it("rejeita indicador ou unidade fora do vocabulário do core", () => {
    const comIndicadorEstranho = structuredClone(payloadIndicadores);
    comIndicadorEstranho.indicadores[0]!.indicador = "gasto_misterioso";
    expect(() => respostaIndicadoresSchema.parse(comIndicadorEstranho)).toThrow();

    const comUnidadeEstranha = structuredClone(payloadIndicadores);
    comUnidadeEstranha.indicadores[0]!.unidade = "USD";
    expect(() => respostaIndicadoresSchema.parse(comUnidadeEstranha)).toThrow();
  });

  it("rejeita indicador sem o campo fonte — rastreabilidade é obrigatória", () => {
    const semFonte = structuredClone(payloadIndicadores) as {
      indicadores: Array<Record<string, unknown>>;
    };
    delete semFonte.indicadores[0]!["fonte"];
    expect(() => respostaIndicadoresSchema.parse(semFonte)).toThrow();
  });
});
