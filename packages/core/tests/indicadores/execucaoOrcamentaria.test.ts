import { describe, expect, it } from "vitest";
import { calcularExecucaoOrcamentaria } from "../../src/indicadores/execucaoOrcamentaria.js";
import { rreoRespostaSchema, type RREOItem } from "../../src/siconfi/schemas.js";
import { lerFixture } from "../siconfi/fixtures.js";

const itensRREO = rreoRespostaSchema.parse(
  lerFixture("rreo_4303004_2024_p6.json"),
).items;

describe("calcularExecucaoOrcamentaria", () => {
  it("receita bate com o RREO oficial de Cachoeira do Sul (94.93%)", () => {
    const resultado = calcularExecucaoOrcamentaria(itensRREO);

    expect(resultado.receitaPrevista).toBeCloseTo(536981837, 2);
    expect(resultado.receitaRealizada).toBeCloseTo(509767805.19, 2);
    expect(resultado.percentualExecucaoReceita).toBeCloseTo(94.93, 2);
  });

  it("despesa (empenhado/dotação atualizada) bate com o RREO oficial de Cachoeira do Sul", () => {
    const resultado = calcularExecucaoOrcamentaria(itensRREO);

    expect(resultado.despesaPrevista).toBeCloseTo(600946469.65, 2);
    expect(resultado.despesaRealizada).toBeCloseTo(444449135.07, 2);
    expect(resultado.percentualExecucaoDespesa).toBeCloseTo(73.96, 1);
  });

  it("falha alto quando a conta de receitas totais está ausente", () => {
    const semReceitas = itensRREO.filter(
      (item) => item.cod_conta !== "TotalReceitas",
    );

    expect(() => calcularExecucaoOrcamentaria(semReceitas)).toThrow(
      /TotalReceitas/,
    );
  });

  it("falha alto quando o % de execução da receita oficial diverge do recalculado", () => {
    const comPercentualAdulterado: RREOItem[] = itensRREO.map((item) =>
      item.anexo === "RREO-Anexo 01" &&
      item.cod_conta === "TotalReceitas" &&
      item.coluna === "% (c/a)"
        ? { ...item, valor: 10 }
        : item,
    );

    expect(() =>
      calcularExecucaoOrcamentaria(comPercentualAdulterado),
    ).toThrow(/leitura de coluna errada/);
  });
});
