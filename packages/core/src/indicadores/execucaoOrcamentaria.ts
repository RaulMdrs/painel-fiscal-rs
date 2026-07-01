import type { RREOItem } from "../siconfi/schemas.js";
import { localizarConta } from "./localizarConta.js";

const ANEXO = "RREO-Anexo 01";

const COLUNA_RECEITA_PREVISTA = "PREVISÃO ATUALIZADA (a)";
const COLUNA_RECEITA_REALIZADA = "Até o Bimestre (c)";
const COLUNA_RECEITA_PERCENTUAL_OFICIAL = "% (c/a)";

// A despesa não tem uma única coluna "realizado": o RREO-Anexo 01 reporta
// por estágio (empenhado/liquidado/pago), diferente da receita. Usamos o
// empenhado como "realizado", por ser o estágio mais citado como "execução
// orçamentária" em análises fiscais e o mais comparável à receita realizada
// (regime de compromisso do crédito, não de caixa).
const COLUNA_DESPESA_PREVISTA = "DOTAÇÃO ATUALIZADA (e)";
const COLUNA_DESPESA_REALIZADA = "DESPESAS EMPENHADAS ATÉ O BIMESTRE (f)";

// Tolerância do oráculo cruzado da receita (recalcular realizado/previsto e
// comparar com o % (c/a) que o relatório já publica).
const TOLERANCIA_ORACULO_CRUZADO_PP = 0.05;

export interface ResultadoExecucaoOrcamentaria {
  receitaPrevista: number;
  receitaRealizada: number;
  percentualExecucaoReceita: number;
  despesaPrevista: number;
  despesaRealizada: number;
  percentualExecucaoDespesa: number;
}

/**
 * Execução orçamentária (RREO-Anexo 01): previsto vs. realizado de receitas
 * e despesas totais. O percentual de receita vem do próprio relatório
 * (com oráculo cruzado); o de despesa é calculado, pois o relatório não
 * publica um percentual pronto para despesa empenhada/dotação atualizada.
 */
export function calcularExecucaoOrcamentaria(
  itensRREO: readonly RREOItem[],
): ResultadoExecucaoOrcamentaria {
  const receitaPrevista = localizarConta(itensRREO, {
    anexo: ANEXO,
    codConta: "TotalReceitas",
    coluna: COLUNA_RECEITA_PREVISTA,
  });
  const receitaRealizada = localizarConta(itensRREO, {
    anexo: ANEXO,
    codConta: "TotalReceitas",
    coluna: COLUNA_RECEITA_REALIZADA,
  });
  const receitaPercentualOficial = localizarConta(itensRREO, {
    anexo: ANEXO,
    codConta: "TotalReceitas",
    coluna: COLUNA_RECEITA_PERCENTUAL_OFICIAL,
  });

  const receitaPercentualRecalculado =
    (receitaRealizada.valor / receitaPrevista.valor) * 100;
  const divergenciaReceita = Math.abs(
    receitaPercentualRecalculado - receitaPercentualOficial.valor,
  );
  if (divergenciaReceita > TOLERANCIA_ORACULO_CRUZADO_PP) {
    throw new Error(
      `Divergência entre o % de execução da receita oficial (${receitaPercentualOficial.valor}) ` +
        `e o recalculado a partir de previsto/realizado (${receitaPercentualRecalculado.toFixed(2)}) ` +
        "— sinal de leitura de coluna errada.",
    );
  }

  const despesaPrevista = localizarConta(itensRREO, {
    anexo: ANEXO,
    codConta: "TotalDespesas",
    coluna: COLUNA_DESPESA_PREVISTA,
  });
  const despesaRealizada = localizarConta(itensRREO, {
    anexo: ANEXO,
    codConta: "TotalDespesas",
    coluna: COLUNA_DESPESA_REALIZADA,
  });

  return {
    receitaPrevista: receitaPrevista.valor,
    receitaRealizada: receitaRealizada.valor,
    percentualExecucaoReceita: receitaPercentualOficial.valor,
    despesaPrevista: despesaPrevista.valor,
    despesaRealizada: despesaRealizada.valor,
    percentualExecucaoDespesa:
      (despesaRealizada.valor / despesaPrevista.valor) * 100,
  };
}
