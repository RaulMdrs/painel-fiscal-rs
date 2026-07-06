import { describe, expect, it } from "vitest";
import { limiteLegal } from "../src/lib/limites";
import { avaliarSinal } from "../src/lib/semaforo";

describe("avaliarSinal — despesa com pessoal (LRF: máximo 54%, prudencial 51,3%, alerta 48,6%)", () => {
  // Valores reais do cache 2024 (RGF 3º quadrimestre) servem de oráculo.
  it("Cachoeira do Sul (40,33%) está dentro do limite", () => {
    expect(avaliarSinal("despesa_pessoal", 40.33)).toEqual({
      estado: "ok",
      rotulo: "Dentro do limite",
    });
  });

  it("Rio Pardo (48,96%) está na zona de alerta", () => {
    expect(avaliarSinal("despesa_pessoal", 48.96)).toEqual({
      estado: "alerta",
      rotulo: "Zona de alerta",
    });
  });

  it("acima do prudencial (52%) recebe rótulo específico, ainda em alerta", () => {
    expect(avaliarSinal("despesa_pessoal", 52)).toEqual({
      estado: "alerta",
      rotulo: "Acima do limite prudencial",
    });
  });

  it("Caçapava do Sul (55,34%) está acima do limite máximo", () => {
    expect(avaliarSinal("despesa_pessoal", 55.34)).toEqual({
      estado: "estouro",
      rotulo: "Acima do limite máximo",
    });
  });

  it("fronteiras: 48,6% já é alerta; 54% ainda não é estouro; 54,01% é", () => {
    expect(avaliarSinal("despesa_pessoal", 48.6)?.estado).toBe("alerta");
    expect(avaliarSinal("despesa_pessoal", 54)?.estado).toBe("alerta");
    expect(avaliarSinal("despesa_pessoal", 54.01)?.estado).toBe("estouro");
  });
});

describe("avaliarSinal — endividamento (Res. Senado 40/2001: DCL ≤ 120% da RCL; alerta 108%)", () => {
  it("Cachoeira do Sul (2,82%) está dentro do limite", () => {
    expect(avaliarSinal("endividamento", 2.82)?.estado).toBe("ok");
  });

  it("108% entra em alerta; acima de 120% estoura", () => {
    expect(avaliarSinal("endividamento", 108)?.estado).toBe("alerta");
    expect(avaliarSinal("endividamento", 120)?.estado).toBe("alerta");
    expect(avaliarSinal("endividamento", 120.5)?.estado).toBe("estouro");
  });
});

describe("avaliarSinal — indicadores sem limite legal não recebem julgamento", () => {
  it("RCL e execução orçamentária retornam null", () => {
    expect(avaliarSinal("receita_corrente_liquida", 386316913.8)).toBeNull();
    expect(avaliarSinal("execucao_orcamentaria_receita", 94.93)).toBeNull();
    expect(avaliarSinal("execucao_orcamentaria_despesa", 73.96)).toBeNull();
  });
});

describe("falhe alto", () => {
  it("valor não finito lança erro em vez de virar sinal silencioso", () => {
    expect(() => avaliarSinal("despesa_pessoal", Number.NaN)).toThrow(/não finito/);
    expect(() => avaliarSinal("despesa_pessoal", Number.POSITIVE_INFINITY)).toThrow(/não finito/);
  });
});

describe("limiteLegal", () => {
  it("despesa com pessoal tem os três limiares da LRF na escala 0–60", () => {
    const limite = limiteLegal("despesa_pessoal");
    expect(limite).toMatchObject({
      maximo: 54,
      prudencial: 51.3,
      alerta: 48.6,
      escalaMax: 60,
    });
  });

  it("endividamento usa o teto do Senado (120%) sem limite prudencial", () => {
    const limite = limiteLegal("endividamento");
    expect(limite).toMatchObject({ maximo: 120, prudencial: null, alerta: 108 });
  });

  it("indicadores sem limite legal retornam null", () => {
    expect(limiteLegal("receita_corrente_liquida")).toBeNull();
    expect(limiteLegal("execucao_orcamentaria_receita")).toBeNull();
  });
});
