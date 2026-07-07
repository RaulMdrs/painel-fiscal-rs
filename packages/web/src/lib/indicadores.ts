import type { IndicadorFiscal } from "../../../core/src/types";
import type { IndicadorDaApi, PainelMunicipio } from "./contratoApi";

/**
 * Busca um indicador no painel do município. Retorna null quando ausente:
 * a UI mostra a ausência explicitamente ("espaço em branco honesto"),
 * nunca um zero inventado.
 */
export function indicadorDe(
  painel: PainelMunicipio,
  chave: IndicadorFiscal,
): IndicadorDaApi | null {
  return painel.indicadores.find((item) => item.indicador === chave) ?? null;
}
