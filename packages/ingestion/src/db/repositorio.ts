import { and, eq } from "drizzle-orm";
import type { Municipio, ResultadoIndicador } from "../../../core/src/types.js";
import type { Banco } from "./client.js";
import { progressoIngestao, resultadosIndicadores } from "./schema.js";

export interface ResultadoParaGravar extends ResultadoIndicador {
  anexo: string;
  codConta: string;
  coluna: string;
}

/**
 * Upsert na chave única (cod_ibge, indicador, exercicio, periodo_numero,
 * periodicidade) — rodar a ingestão de novo atualiza a linha existente em
 * vez de duplicar.
 */
export function upsertResultado(db: Banco, resultado: ResultadoParaGravar): void {
  const agora = new Date().toISOString();

  db.insert(resultadosIndicadores)
    .values({
      codIbge: resultado.municipio.codIbge,
      municipioNome: resultado.municipio.nome,
      indicador: resultado.indicador,
      exercicio: resultado.periodo.exercicio,
      periodoNumero: resultado.periodo.numero,
      periodicidade: resultado.periodo.periodicidade,
      valor: resultado.valor,
      unidade: resultado.unidade,
      fonte: resultado.fonte,
      anexo: resultado.anexo,
      codConta: resultado.codConta,
      coluna: resultado.coluna,
      ingeridoEm: agora,
    })
    .onConflictDoUpdate({
      target: [
        resultadosIndicadores.codIbge,
        resultadosIndicadores.indicador,
        resultadosIndicadores.exercicio,
        resultadosIndicadores.periodoNumero,
        resultadosIndicadores.periodicidade,
      ],
      set: {
        municipioNome: resultado.municipio.nome,
        valor: resultado.valor,
        unidade: resultado.unidade,
        fonte: resultado.fonte,
        anexo: resultado.anexo,
        codConta: resultado.codConta,
        coluna: resultado.coluna,
        ingeridoEm: agora,
      },
    })
    .run();
}

/** Status de uma tentativa de ingestão de um município num exercício. */
export type StatusIngestao = "completo" | "parcial" | "sem_dados";

export interface ProgressoParaGravar {
  municipio: Municipio;
  exercicio: number;
  status: StatusIngestao;
  indicadoresOk: number;
  indicadoresFalha: number;
}

/**
 * Upsert na chave única (cod_ibge, exercicio) — registra o resultado da
 * última tentativa de ingestão de um município, usado para retomar rodadas
 * longas sem reingerir quem já foi processado.
 */
export function upsertProgresso(db: Banco, progresso: ProgressoParaGravar): void {
  const agora = new Date().toISOString();

  db.insert(progressoIngestao)
    .values({
      codIbge: progresso.municipio.codIbge,
      municipioNome: progresso.municipio.nome,
      exercicio: progresso.exercicio,
      status: progresso.status,
      indicadoresOk: progresso.indicadoresOk,
      indicadoresFalha: progresso.indicadoresFalha,
      atualizadoEm: agora,
    })
    .onConflictDoUpdate({
      target: [progressoIngestao.codIbge, progressoIngestao.exercicio],
      set: {
        municipioNome: progresso.municipio.nome,
        status: progresso.status,
        indicadoresOk: progresso.indicadoresOk,
        indicadoresFalha: progresso.indicadoresFalha,
        atualizadoEm: agora,
      },
    })
    .run();
}

/** Progresso já registrado para um município num exercício, se houver. */
export function buscarProgresso(
  db: Banco,
  codIbge: number,
  exercicio: number,
): { status: StatusIngestao } | undefined {
  const linha = db
    .select({ status: progressoIngestao.status })
    .from(progressoIngestao)
    .where(and(eq(progressoIngestao.codIbge, codIbge), eq(progressoIngestao.exercicio, exercicio)))
    .get();

  return linha === undefined ? undefined : { status: linha.status as StatusIngestao };
}

/** Contagem de municípios por status de ingestão, para o relatório de cobertura. */
export function relatorioCobertura(
  db: Banco,
  exercicio: number,
): Record<StatusIngestao, number> {
  const linhas = db
    .select({ status: progressoIngestao.status })
    .from(progressoIngestao)
    .where(eq(progressoIngestao.exercicio, exercicio))
    .all();

  const contagem: Record<StatusIngestao, number> = { completo: 0, parcial: 0, sem_dados: 0 };
  for (const linha of linhas) {
    contagem[linha.status as StatusIngestao]++;
  }
  return contagem;
}
