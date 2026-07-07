import { z } from "zod";
import { MUNICIPIOS_ALVO } from "../../core/src/municipiosAlvo.js";
import type {
  IndicadorFiscal,
  Periodicidade,
  ResultadoIndicador,
  UnidadeIndicador,
} from "../../core/src/types.js";
import type { LinhaResultadoIndicador } from "../../ingestion/src/db/schema.js";

const indicadorSchema = z.enum([
  "receita_corrente_liquida",
  "despesa_pessoal",
  "endividamento",
  "execucao_orcamentaria_receita",
  "execucao_orcamentaria_despesa",
] as const) satisfies z.ZodType<IndicadorFiscal>;

const periodicidadeSchema = z.enum(["B", "Q", "S"] as const) satisfies z.ZodType<Periodicidade>;

const unidadeSchema = z.enum(["BRL", "PERCENTUAL"] as const) satisfies z.ZodType<UnidadeIndicador>;

export interface IndicadorRastreavel extends ResultadoIndicador {
  anexo: string;
  codConta: string;
  coluna: string;
}

/**
 * Converte uma linha crua do SQLite (strings sem tipo) num objeto tipado,
 * reaproveitando os tipos do core. Falha alto se algum campo categórico da
 * linha não bater com um valor conhecido — cache corrompido ou schema
 * divergente não deve virar dado silenciosamente errado na API.
 */
export function mapearLinha(linha: LinhaResultadoIndicador): IndicadorRastreavel {
  const municipio = MUNICIPIOS_ALVO.find((m) => m.codIbge === linha.codIbge);
  if (municipio === undefined) {
    throw new Error(
      `Linha do cache com cod_ibge ${linha.codIbge} não corresponde a nenhum município-alvo conhecido.`,
    );
  }

  return {
    indicador: indicadorSchema.parse(linha.indicador),
    municipio,
    periodo: {
      exercicio: linha.exercicio,
      numero: linha.periodoNumero,
      periodicidade: periodicidadeSchema.parse(linha.periodicidade),
    },
    valor: linha.valor,
    unidade: unidadeSchema.parse(linha.unidade),
    fonte: linha.fonte,
    anexo: linha.anexo,
    codConta: linha.codConta,
    coluna: linha.coluna,
  };
}
