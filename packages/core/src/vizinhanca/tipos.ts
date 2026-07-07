import type { Municipio } from "../types.js";

/**
 * Critério usado para definir "vizinhos" de um município. Hoje só "regional"
 * está implementado (Fase 1, Tarefa 1.2); "porte" (população parecida) é o
 * próximo critério planejado — ver docs/FASE_1.md. Novos critérios entram
 * como um novo membro desta union + uma nova entrada no registro de
 * estratégias em `index.ts`, sem tocar em quem chama `encontrarVizinhos`.
 */
export type CriterioVizinhanca = "regional";

/**
 * Estado da ingestão de dados fiscais de um município — mesmos três valores
 * de `StatusIngestao` (packages/ingestion/src/db/repositorio.ts), definidos
 * aqui porque `core` não depende de `ingestion`. Um vizinho "sem_dados" é uma
 * informação válida (município que não publicou), não motivo para sumir da
 * lista.
 */
export type StatusDadosMunicipio = "completo" | "parcial" | "sem_dados";

/** Município com os dados extras que as estratégias de vizinhança precisam. */
export interface MunicipioVizinhanca extends Municipio {
  populacao: number;
  microrregiaoId: number;
  microrregiaoNome: string;
  status: StatusDadosMunicipio;
}

export interface OpcoesVizinhanca {
  /** Máximo de vizinhos retornados. Cada estratégia define seu próprio default quando omitido. */
  limite?: number;
}

/**
 * Assinatura comum a toda estratégia de vizinhança: recebe o universo de
 * municípios candidatos, o foco e as opções, devolve os vizinhos
 * encontrados. Pura — não faz I/O; quem chama monta o universo (ingestion/api).
 */
export type EstrategiaVizinhanca = (
  universo: readonly MunicipioVizinhanca[],
  codIbge: number,
  opcoes: OpcoesVizinhanca,
) => MunicipioVizinhanca[];
