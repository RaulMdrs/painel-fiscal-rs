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
 * Os 4 indicadores fiscais da Fase 0 (ver README.md). Execução orçamentária
 * vira duas entradas porque o RREO-Anexo 01 não publica um único percentual
 * de "realizado": receita tem uma coluna pronta, despesa é por estágio
 * (empenhado/liquidado/pago) — ver packages/core/src/indicadores/execucaoOrcamentaria.ts.
 */
export type IndicadorFiscal =
  | "receita_corrente_liquida"
  | "despesa_pessoal"
  | "endividamento"
  | "execucao_orcamentaria_receita"
  | "execucao_orcamentaria_despesa";

export type UnidadeIndicador = "BRL" | "PERCENTUAL";

export interface ResultadoIndicador {
  indicador: IndicadorFiscal;
  municipio: Municipio;
  periodo: Periodo;
  valor: number;
  unidade: UnidadeIndicador;
  fonte: string;
}
