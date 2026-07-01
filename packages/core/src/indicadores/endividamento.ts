import type { RGFItem } from "../siconfi/schemas.js";
import { localizarConta } from "./localizarConta.js";

const ANEXO = "RGF-Anexo 02";
// Tolerância do oráculo cruzado (recalcular DCL/RCL e comparar com o % que
// o relatório já publica) — divergência acima disso indica coluna errada.
const TOLERANCIA_ORACULO_CRUZADO_PP = 0.05;

export interface ResultadoEndividamento {
  dividaConsolidadaLiquida: number;
  receitaCorrenteLiquidaAjustada: number;
  percentualDCLSobreRCL: number;
}

/**
 * O nome da coluna acumulada do RGF-Anexo 02 depende do período consultado
 * ("Até o 1º/2º/3º Quadrimestre" ou "...Semestre") — deriva do próprio item
 * em vez de fixar um período, já que o indicador precisa valer para qualquer
 * município/período, não só o 3º quadrimestre de Cachoeira do Sul.
 */
export function colunaAcumulada(periodicidade: string, periodo: number): string {
  switch (periodicidade) {
    case "Q":
      return `Até o ${periodo}º Quadrimestre`;
    case "S":
      return `Até o ${periodo}º Semestre`;
    default:
      throw new Error(
        `Periodicidade "${periodicidade}" não suportada para localizar a coluna acumulada do RGF-Anexo 02.`,
      );
  }
}

/** Rastreabilidade da fonte do percentual retornado (para quem persiste o resultado). */
export function rastreioPercentualDCL(
  periodicidade: string,
  periodo: number,
): { anexo: string; codConta: string; coluna: string } {
  return {
    anexo: ANEXO,
    codConta: "PercentualDaDCLSobreARCL",
    coluna: colunaAcumulada(periodicidade, periodo),
  };
}

/**
 * Endividamento: Dívida Consolidada Líquida / RCL Ajustada (RGF-Anexo 02).
 * O percentual oficial já vem calculado no relatório, mas recalculamos a
 * partir da DCL e da RCL ajustada como oráculo cruzado: se divergir do
 * percentual oficial, é sinal de leitura de coluna errada — falha alto.
 */
export function calcularEndividamento(
  itensRGF: readonly RGFItem[],
): ResultadoEndividamento {
  const primeiroItem = itensRGF[0];
  if (primeiroItem === undefined) {
    throw new Error(
      "Não é possível calcular endividamento: lista de itens do RGF está vazia.",
    );
  }
  const coluna = colunaAcumulada(
    primeiroItem.periodicidade,
    primeiroItem.periodo,
  );

  const dcl = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "DividaConsolidadaLiquida",
    coluna,
  });
  const rclAjustada = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta:
      "ReceitaCorrenteLiquidaAjustadaParaCalculoDosLimitesDeEndividamento",
    coluna,
  });
  const percentualOficial = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "PercentualDaDCLSobreARCL",
    coluna,
  });

  const percentualRecalculado = (dcl.valor / rclAjustada.valor) * 100;
  const divergencia = Math.abs(
    percentualRecalculado - percentualOficial.valor,
  );
  if (divergencia > TOLERANCIA_ORACULO_CRUZADO_PP) {
    throw new Error(
      `Divergência entre o % de DCL/RCL oficial (${percentualOficial.valor}) e o ` +
        `recalculado a partir de DCL e RCL ajustada (${percentualRecalculado.toFixed(2)}) ` +
        "— sinal de leitura de coluna errada.",
    );
  }

  return {
    dividaConsolidadaLiquida: dcl.valor,
    receitaCorrenteLiquidaAjustada: rclAjustada.valor,
    percentualDCLSobreRCL: percentualOficial.valor,
  };
}
