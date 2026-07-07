import { encontrarVizinhosRegional } from "./regional.js";
import type {
  CriterioVizinhanca,
  EstrategiaVizinhanca,
  MunicipioVizinhanca,
  OpcoesVizinhanca,
} from "./tipos.js";

/**
 * Registro de estratégias por critério. Adicionar "porte" no futuro é
 * implementar uma nova `EstrategiaVizinhanca` e somar uma entrada aqui —
 * `encontrarVizinhos` e quem o chama não mudam.
 */
const ESTRATEGIAS: Record<CriterioVizinhanca, EstrategiaVizinhanca> = {
  regional: encontrarVizinhosRegional,
};

/**
 * Ponto único de entrada para achar vizinhos de um município, despachando
 * para a estratégia do critério pedido. `universo` é o conjunto de
 * municípios candidatos (tipicamente todos os do RS) já com microrregião e
 * status de dados anexados por quem chama — `core` não busca nada sozinho.
 */
export function encontrarVizinhos(
  universo: readonly MunicipioVizinhanca[],
  codIbge: number,
  criterio: CriterioVizinhanca,
  opcoes: OpcoesVizinhanca = {},
): MunicipioVizinhanca[] {
  return ESTRATEGIAS[criterio](universo, codIbge, opcoes);
}

export { encontrarVizinhosRegional, LIMITE_PADRAO_REGIONAL } from "./regional.js";
export type {
  CriterioVizinhanca,
  EstrategiaVizinhanca,
  MunicipioVizinhanca,
  OpcoesVizinhanca,
  StatusDadosMunicipio,
} from "./tipos.js";
