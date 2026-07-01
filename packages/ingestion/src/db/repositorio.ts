import type { ResultadoIndicador } from "../../../core/src/types.js";
import type { Banco } from "./client.js";
import { resultadosIndicadores } from "./schema.js";

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
