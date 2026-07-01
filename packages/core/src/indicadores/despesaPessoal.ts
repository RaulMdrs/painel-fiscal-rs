import type { RGFItem } from "../siconfi/schemas.js";
import { localizarConta } from "./localizarConta.js";

const ANEXO = "RGF-Anexo 01";
const COLUNA_VALOR = "Valor";
const COLUNA_PERCENTUAL = "% sobre a RCL Ajustada";

export interface ResultadoDespesaPessoal {
  despesaTotalComPessoal: number;
  receitaCorrenteLiquidaAjustada: number;
  percentualSobreRcl: number;
  limiteMaximoPercentual: number;
  limitePrudencialPercentual: number;
  limiteAlertaPercentual: number;
  dentroDoLimiteMaximo: boolean;
  dentroDoLimitePrudencial: boolean;
}

/**
 * Despesa com pessoal (RGF-Anexo 01) vs. limites da LRF (art. 20/22/59).
 * Os percentuais de limite são lidos do próprio relatório (não hardcoded),
 * já que o RGF os traz calculados por poder/esfera.
 */
export function calcularDespesaPessoal(
  itensRGF: readonly RGFItem[],
): ResultadoDespesaPessoal {
  const despesaTotal = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "DespesaComPessoalTotal",
    coluna: COLUNA_VALOR,
  });
  const percentual = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "DespesaComPessoalTotal",
    coluna: COLUNA_PERCENTUAL,
  });
  const rclAjustada = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "ReceitaCorrenteLiquidaAjustada",
    coluna: COLUNA_VALOR,
  });
  const limiteMaximo = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "LimiteMaximoDespesaComPessoalTotal",
    coluna: COLUNA_PERCENTUAL,
  });
  const limitePrudencial = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "LimitePrudencialDespesaComPessoalTotal",
    coluna: COLUNA_PERCENTUAL,
  });
  const limiteAlerta = localizarConta(itensRGF, {
    anexo: ANEXO,
    codConta: "LimiteDeAlertaDespesaComPessoalTotal",
    coluna: COLUNA_PERCENTUAL,
  });

  return {
    despesaTotalComPessoal: despesaTotal.valor,
    receitaCorrenteLiquidaAjustada: rclAjustada.valor,
    percentualSobreRcl: percentual.valor,
    limiteMaximoPercentual: limiteMaximo.valor,
    limitePrudencialPercentual: limitePrudencial.valor,
    limiteAlertaPercentual: limiteAlerta.valor,
    dentroDoLimiteMaximo: percentual.valor <= limiteMaximo.valor,
    dentroDoLimitePrudencial: percentual.valor <= limitePrudencial.valor,
  };
}
