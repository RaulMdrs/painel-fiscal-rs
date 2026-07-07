import type { IndicadorFiscal } from "../../../core/src/types";
import { limiteLegal } from "./limites";

export type EstadoSinal = "ok" | "alerta" | "estouro";

export interface Sinal {
  estado: EstadoSinal;
  rotulo: string;
}

/**
 * Classifica um valor percentual contra o limite legal do indicador.
 * Retorna null para indicadores sem teto legal — a UI não inventa julgamento
 * onde a lei não define um. O rótulo textual acompanha sempre o estado, para
 * que o significado nunca dependa só de cor.
 */
export function avaliarSinal(indicador: IndicadorFiscal, valor: number): Sinal | null {
  const limite = limiteLegal(indicador);
  if (limite === null) {
    return null;
  }

  if (!Number.isFinite(valor)) {
    throw new Error(
      `Valor não finito (${valor}) para o indicador "${indicador}" — dado corrompido não vira sinal.`,
    );
  }

  if (valor > limite.maximo) {
    return { estado: "estouro", rotulo: "Acima do limite máximo" };
  }
  if (limite.prudencial !== null && valor >= limite.prudencial) {
    return { estado: "alerta", rotulo: "Acima do limite prudencial" };
  }
  if (valor >= limite.alerta) {
    return { estado: "alerta", rotulo: "Zona de alerta" };
  }
  return { estado: "ok", rotulo: "Dentro do limite" };
}
