export interface Municipio {
  codIbge: number;
  nome: string;
  uf: string;
}

/**
 * Periodicidade dos demonstrativos do SICONFI: bimestral (RREO), quadrimestral
 * ou semestral (RGF) — conforme observado nos fixtures reais em data/fixtures/.
 */
export type Periodicidade = "B" | "Q" | "S";

export interface Periodo {
  exercicio: number;
  numero: number;
  periodicidade: Periodicidade;
}

/**
 * Os 4 indicadores fiscais da Fase 0 (ver README.md).
 */
export type IndicadorFiscal =
  | "receita_corrente_liquida"
  | "despesa_pessoal"
  | "endividamento"
  | "execucao_orcamentaria";

export type UnidadeIndicador = "BRL" | "PERCENTUAL";

export interface ResultadoIndicador {
  indicador: IndicadorFiscal;
  municipio: Municipio;
  periodo: Periodo;
  valor: number;
  unidade: UnidadeIndicador;
  fonte: string;
}
