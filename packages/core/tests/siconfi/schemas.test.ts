import { describe, expect, it } from "vitest";
import {
  entesRespostaSchema,
  rgfRespostaSchema,
  rreoRespostaSchema,
} from "../../src/siconfi/schemas.js";
import { lerFixture } from "./fixtures.js";

describe("contrato: schemas Zod vs. fixtures reais do SICONFI", () => {
  it("entesRespostaSchema parseia entes_municipios_alvo.json", () => {
    const bruto = lerFixture("entes_municipios_alvo.json");
    const resultado = entesRespostaSchema.safeParse(bruto);
    expect(resultado.success).toBe(true);
  });

  it("rreoRespostaSchema parseia rreo_4303004_2024_p6.json", () => {
    const bruto = lerFixture("rreo_4303004_2024_p6.json");
    const resultado = rreoRespostaSchema.safeParse(bruto);
    expect(resultado.success).toBe(true);
  });

  it("rgfRespostaSchema parseia rgf_4303004_2024_p3.json", () => {
    const bruto = lerFixture("rgf_4303004_2024_p3.json");
    const resultado = rgfRespostaSchema.safeParse(bruto);
    expect(resultado.success).toBe(true);
  });

  it("rejeita resposta que não bate com o schema (falha alto)", () => {
    const resultado = rreoRespostaSchema.safeParse({ items: "não é array" });
    expect(resultado.success).toBe(false);
  });
});
