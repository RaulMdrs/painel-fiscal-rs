import { describe, expect, it } from "vitest";
import { extrairRCL } from "../../src/indicadores/rcl.js";
import { rreoRespostaSchema } from "../../src/siconfi/schemas.js";
import { lerFixture } from "../siconfi/fixtures.js";

const itensRREO = rreoRespostaSchema.parse(
  lerFixture("rreo_4303004_2024_p6.json"),
).items;

describe("extrairRCL", () => {
  it("bate com a RCL oficial do RREO de Cachoeira do Sul (últimos 12 meses)", () => {
    const resultado = extrairRCL(itensRREO);

    expect(resultado.receitaCorrenteLiquida).toBeCloseTo(386316913.8, 2);
  });

  it("não confunde com o valor de um único mês da mesma conta", () => {
    const valorDeUmMes = itensRREO.find(
      (item) =>
        item.anexo === "RREO-Anexo 03" &&
        item.cod_conta === "RREO3ReceitaCorrenteLiquida" &&
        item.coluna === "<MR>",
    )?.valor;

    const resultado = extrairRCL(itensRREO);

    expect(valorDeUmMes).toBeDefined();
    expect(resultado.receitaCorrenteLiquida).not.toBeCloseTo(
      valorDeUmMes as number,
      2,
    );
  });

  it("falha alto quando a conta de RCL está ausente", () => {
    const semRCL = itensRREO.filter(
      (item) => item.cod_conta !== "RREO3ReceitaCorrenteLiquida",
    );

    expect(() => extrairRCL(semRCL)).toThrow(/RREO3ReceitaCorrenteLiquida/);
  });
});
