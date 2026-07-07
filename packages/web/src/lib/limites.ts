import type { IndicadorFiscal } from "../../../core/src/types";

/**
 * Limites legais dos indicadores percentuais, para a régua da lei e o semáforo.
 * `alerta` é o limiar de 90% do máximo (LRF art. 59, §1º) e `prudencial` o de
 * 95% (LRF art. 22, parágrafo único) — este só existe para despesa com pessoal.
 * `escalaMax` fixa a escala da régua para que as barras de municípios
 * diferentes sejam comparáveis entre si.
 */
export interface LimiteLegal {
  maximo: number;
  prudencial: number | null;
  alerta: number;
  escalaMax: number;
  base: string;
}

const LIMITES: Partial<Record<IndicadorFiscal, LimiteLegal>> = {
  despesa_pessoal: {
    maximo: 54,
    prudencial: 51.3,
    alerta: 48.6,
    escalaMax: 60,
    base: "LRF (LC 101/2000), arts. 20, 22 e 59 — Poder Executivo municipal",
  },
  endividamento: {
    maximo: 120,
    prudencial: null,
    alerta: 108,
    escalaMax: 130,
    base: "Resolução nº 40/2001 do Senado Federal; LRF art. 59, §1º, III",
  },
};

/** Retorna o limite legal do indicador, ou null quando a lei não fixa um teto. */
export function limiteLegal(indicador: IndicadorFiscal): LimiteLegal | null {
  return LIMITES[indicador] ?? null;
}
