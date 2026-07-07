import { z } from "zod";
import type {
  IndicadorFiscal,
  Municipio,
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
 * reaproveitando os tipos do core. O `municipio` vem do cadastro (tabela
 * `municipios`, os 497 do RS na Fase 1) — não mais de uma lista fixa de 5.
 * Falha alto se a linha não pertencer a esse município ou se algum campo
 * categórico não bater com um valor conhecido: cache corrompido ou schema
 * divergente não deve virar dado silenciosamente errado na API.
 */
export function mapearLinha(
  linha: LinhaResultadoIndicador,
  municipio: Municipio,
): IndicadorRastreavel {
  if (linha.codIbge !== municipio.codIbge) {
    throw new Error(
      `Linha do cache (cod_ibge ${linha.codIbge}) não corresponde ao município informado ` +
        `(${municipio.nome}, cod_ibge ${municipio.codIbge}).`,
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
