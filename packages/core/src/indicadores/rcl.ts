import type { RREOItem } from "../siconfi/schemas.js";
import { localizarConta } from "./localizarConta.js";

const ANEXO = "RREO-Anexo 03";
// Fixada explicitamente: pegar um mês isolado (ex.: <MR>) em vez do
// acumulado dos últimos 12 meses seria um erro silencioso.
const COLUNA_ULTIMOS_12_MESES = "TOTAL (ÚLTIMOS 12 MESES)";

export interface ResultadoRCL {
  receitaCorrenteLiquida: number;
}

/**
 * Receita Corrente Líquida (RREO-Anexo 03). Existem várias variantes de RCL
 * nesse anexo (ajustada para endividamento, ajustada para despesa com
 * pessoal) — usamos o cod_conta exato da RCL "crua", RREO3ReceitaCorrenteLiquida.
 */
export function extrairRCL(itensRREO: readonly RREOItem[]): ResultadoRCL {
  const rcl = localizarConta(itensRREO, {
    anexo: ANEXO,
    codConta: "RREO3ReceitaCorrenteLiquida",
    coluna: COLUNA_ULTIMOS_12_MESES,
  });

  return {
    receitaCorrenteLiquida: rcl.valor,
  };
}
