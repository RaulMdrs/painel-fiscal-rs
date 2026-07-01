import { describe, expect, it } from "vitest";
import { calcularDespesaPessoal } from "../../src/indicadores/despesaPessoal.js";
import { rgfRespostaSchema } from "../../src/siconfi/schemas.js";
import { lerFixture } from "../siconfi/fixtures.js";

const itensRGF = rgfRespostaSchema.parse(
  lerFixture("rgf_4303004_2024_p3.json"),
).items;

describe("calcularDespesaPessoal", () => {
  it("bate com o percentual oficial do RGF de Cachoeira do Sul (40.33%)", () => {
    const resultado = calcularDespesaPessoal(itensRGF);

    expect(resultado.percentualSobreRcl).toBeCloseTo(40.33, 2);
    expect(resultado.despesaTotalComPessoal).toBeCloseTo(153681970.2, 2);
    expect(resultado.receitaCorrenteLiquidaAjustada).toBeCloseTo(381016343.8, 2);
  });

  it("expõe o limite máximo (54%) e o prudencial (51.3%) lidos do relatório", () => {
    const resultado = calcularDespesaPessoal(itensRGF);

    expect(resultado.limiteMaximoPercentual).toBeCloseTo(54, 2);
    expect(resultado.limitePrudencialPercentual).toBeCloseTo(51.3, 2);
    expect(resultado.dentroDoLimiteMaximo).toBe(true);
    expect(resultado.dentroDoLimitePrudencial).toBe(true);
  });

  it("falha alto quando a conta de despesa com pessoal está ausente", () => {
    const semDespesaPessoal = itensRGF.filter(
      (item) => item.cod_conta !== "DespesaComPessoalTotal",
    );

    expect(() => calcularDespesaPessoal(semDespesaPessoal)).toThrow(
      /DespesaComPessoalTotal/,
    );
  });
});
