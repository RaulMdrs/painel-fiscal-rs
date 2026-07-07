import { describe, expect, it } from "vitest";
import { executarComLimite } from "../src/concorrencia.js";

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("executarComLimite", () => {
  it("executa a tarefa para todos os itens exatamente uma vez", async () => {
    const itens = Array.from({ length: 20 }, (_, i) => i);
    const processados: number[] = [];

    await executarComLimite(itens, 4, async (item) => {
      processados.push(item);
    });

    expect(processados.slice().sort((a, b) => a - b)).toEqual(itens);
  });

  it("nunca excede o limite de execuções concorrentes", async () => {
    const itens = Array.from({ length: 12 }, (_, i) => i);
    let emExecucao = 0;
    let picoConcorrencia = 0;

    await executarComLimite(itens, 3, async () => {
      emExecucao++;
      picoConcorrencia = Math.max(picoConcorrencia, emExecucao);
      await esperar(5);
      emExecucao--;
    });

    expect(picoConcorrencia).toBeLessThanOrEqual(3);
    expect(picoConcorrencia).toBeGreaterThan(1);
  });

  it("não faz nada com uma lista vazia", async () => {
    let chamadas = 0;
    await executarComLimite([], 5, async () => {
      chamadas++;
    });
    expect(chamadas).toBe(0);
  });

  it("propaga erro de uma tarefa individual", async () => {
    await expect(
      executarComLimite([1, 2, 3], 2, async (item) => {
        if (item === 2) {
          throw new Error("falha proposital");
        }
      }),
    ).rejects.toThrow("falha proposital");
  });
});
