import { describe, expect, it } from "vitest";
import {
  formatarBrlCompacto,
  formatarBrlCompleto,
  formatarPercentual,
  rotuloPeriodo,
} from "../src/lib/formato";

// Intl pt-BR separa "R$" do número com espaço não separável (U+00A0).
const NBSP = " ";

describe("formatarPercentual", () => {
  it("formata em pt-BR com 2 casas", () => {
    expect(formatarPercentual(40.33)).toBe("40,33%");
    expect(formatarPercentual(2.82)).toBe("2,82%");
  });

  it("arredonda o valor cru da execução orçamentária para exibição", () => {
    expect(formatarPercentual(73.9581905404742)).toBe("73,96%");
  });

  it("falha alto com valor não finito", () => {
    expect(() => formatarPercentual(Number.NaN)).toThrow(/não finito/);
  });
});

describe("formatarBrlCompleto", () => {
  it("formata o valor exato para conferência contra o relatório oficial", () => {
    expect(formatarBrlCompleto(386316913.8)).toBe(`R$${NBSP}386.316.913,80`);
  });

  it("falha alto com valor não finito", () => {
    expect(() => formatarBrlCompleto(Number.NaN)).toThrow(/não finito/);
  });
});

describe("formatarBrlCompacto", () => {
  it("resume a RCL de Cachoeira do Sul em milhões", () => {
    expect(formatarBrlCompacto(386316913.8)).toBe(`R$${NBSP}386,3 mi`);
  });

  it("usa bilhões e milhares quando a ordem de grandeza pede", () => {
    expect(formatarBrlCompacto(1_250_000_000)).toBe(`R$${NBSP}1,3 bi`);
    expect(formatarBrlCompacto(875_400)).toBe(`R$${NBSP}875,4 mil`);
  });

  it("abaixo de mil, mostra o valor completo", () => {
    expect(formatarBrlCompacto(999)).toBe(`R$${NBSP}999,00`);
  });
});

describe("rotuloPeriodo", () => {
  it("nomeia bimestre, quadrimestre e semestre", () => {
    expect(rotuloPeriodo({ exercicio: 2024, numero: 6, periodicidade: "B" })).toBe(
      "6º bimestre de 2024",
    );
    expect(rotuloPeriodo({ exercicio: 2024, numero: 3, periodicidade: "Q" })).toBe(
      "3º quadrimestre de 2024",
    );
    expect(rotuloPeriodo({ exercicio: 2024, numero: 2, periodicidade: "S" })).toBe(
      "2º semestre de 2024",
    );
  });
});
