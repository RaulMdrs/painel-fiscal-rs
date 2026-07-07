import { describe, expect, it } from "vitest";
import { calcularEndividamento } from "../../src/indicadores/endividamento.js";
import { rgfRespostaSchema, type RGFItem } from "../../src/siconfi/schemas.js";
import { lerFixture } from "../siconfi/fixtures.js";

const itensRGF = rgfRespostaSchema.parse(
  lerFixture("rgf_4303004_2024_p3.json"),
).items;

describe("calcularEndividamento", () => {
  it("bate com o percentual oficial de DCL/RCL do RGF de Cachoeira do Sul (2.82%)", () => {
    const resultado = calcularEndividamento(itensRGF);

    expect(resultado.percentualDCLSobreRCL).toBeCloseTo(2.82, 2);
    expect(resultado.dividaConsolidadaLiquida).toBeCloseTo(10822992.57, 2);
    expect(resultado.receitaCorrenteLiquidaAjustada).toBeCloseTo(
      383586381.8,
      2,
    );
  });

  it("oráculo cruzado: DCL / RCL ajustada recalculado bate com o percentual oficial", () => {
    const resultado = calcularEndividamento(itensRGF);
    const recalculado =
      (resultado.dividaConsolidadaLiquida /
        resultado.receitaCorrenteLiquidaAjustada) *
      100;

    expect(recalculado).toBeCloseTo(resultado.percentualDCLSobreRCL, 1);
  });

  it("falha alto quando a conta de DCL está ausente", () => {
    const semDCL = itensRGF.filter(
      (item) => item.cod_conta !== "DividaConsolidadaLiquida",
    );

    expect(() => calcularEndividamento(semDCL)).toThrow(
      /DividaConsolidadaLiquida/,
    );
  });

  it("falha alto quando o percentual oficial diverge do recalculado (coluna errada)", () => {
    const comPercentualAdulterado: RGFItem[] = itensRGF.map((item) =>
      item.anexo === "RGF-Anexo 02" &&
      item.cod_conta === "PercentualDaDCLSobreARCL" &&
      item.coluna === "Até o 3º Quadrimestre"
        ? { ...item, valor: 99 }
        : item,
    );

    expect(() => calcularEndividamento(comPercentualAdulterado)).toThrow(
      /leitura de coluna errada/,
    );
  });
});
