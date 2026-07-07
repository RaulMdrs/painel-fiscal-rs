import { describe, expect, it } from "vitest";
import { lerConfiguracao } from "../src/config.js";

describe("lerConfiguracao", () => {
  it("usa os defaults quando nenhuma variável está definida", () => {
    const config = lerConfiguracao({});

    expect(config).toEqual({
      uf: "RS",
      limite: undefined,
      concorrencia: 5,
      forcar: false,
    });
  });

  it("lê UF, limite, concorrência e força do ambiente", () => {
    const config = lerConfiguracao({
      INGEST_UF: "SP",
      INGEST_LIMIT: "50",
      INGEST_CONCORRENCIA: "10",
      INGEST_FORCE: "1",
    });

    expect(config).toEqual({
      uf: "SP",
      limite: 50,
      concorrencia: 10,
      forcar: true,
    });
  });

  it("falha alto quando INGEST_LIMIT não é um inteiro positivo", () => {
    expect(() => lerConfiguracao({ INGEST_LIMIT: "0" })).toThrow(/INGEST_LIMIT inválido/);
    expect(() => lerConfiguracao({ INGEST_LIMIT: "abc" })).toThrow(/INGEST_LIMIT inválido/);
    expect(() => lerConfiguracao({ INGEST_LIMIT: "-3" })).toThrow(/INGEST_LIMIT inválido/);
  });

  it("falha alto quando INGEST_CONCORRENCIA não é um inteiro positivo", () => {
    expect(() => lerConfiguracao({ INGEST_CONCORRENCIA: "0" })).toThrow(
      /INGEST_CONCORRENCIA inválido/,
    );
  });

  it("qualquer valor de INGEST_FORCE diferente de '1' é tratado como não-forçado", () => {
    expect(lerConfiguracao({ INGEST_FORCE: "true" }).forcar).toBe(false);
    expect(lerConfiguracao({ INGEST_FORCE: "0" }).forcar).toBe(false);
  });
});
