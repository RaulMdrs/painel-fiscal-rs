import {
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * Um indicador já calculado, por município/período, com rastreabilidade da
 * fonte SICONFI (anexo/cod_conta/coluna) — ver ResultadoIndicador em
 * packages/core/src/types.ts. Idempotência garantida pela chave única
 * (cod_ibge, indicador, exercicio, periodo_numero, periodicidade): a
 * ingestão faz upsert nessa chave, não insert puro.
 */
export const resultadosIndicadores = sqliteTable(
  "resultados_indicadores",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codIbge: integer("cod_ibge").notNull(),
    municipioNome: text("municipio_nome").notNull(),
    indicador: text("indicador").notNull(),
    exercicio: integer("exercicio").notNull(),
    periodoNumero: integer("periodo_numero").notNull(),
    periodicidade: text("periodicidade").notNull(),
    valor: real("valor").notNull(),
    unidade: text("unidade").notNull(),
    fonte: text("fonte").notNull(),
    anexo: text("anexo").notNull(),
    codConta: text("cod_conta").notNull(),
    coluna: text("coluna").notNull(),
    ingeridoEm: text("ingerido_em").notNull(),
  },
  (tabela) => [
    uniqueIndex("resultados_indicadores_chave_unica").on(
      tabela.codIbge,
      tabela.indicador,
      tabela.exercicio,
      tabela.periodoNumero,
      tabela.periodicidade,
    ),
  ],
);

export type LinhaResultadoIndicador = typeof resultadosIndicadores.$inferSelect;
export type NovaLinhaResultadoIndicador =
  typeof resultadosIndicadores.$inferInsert;

/**
 * Uma linha por (município, exercício) registrando o resultado da última
 * tentativa de ingestão — permite retomar uma rodada longa sem reingerir
 * municípios já processados (Fase 1, Tarefa 1.1) e é a base do relatório de
 * cobertura (completo/parcial/sem_dados).
 */
export const progressoIngestao = sqliteTable(
  "progresso_ingestao",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    codIbge: integer("cod_ibge").notNull(),
    municipioNome: text("municipio_nome").notNull(),
    exercicio: integer("exercicio").notNull(),
    status: text("status").notNull(),
    indicadoresOk: integer("indicadores_ok").notNull(),
    indicadoresFalha: integer("indicadores_falha").notNull(),
    atualizadoEm: text("atualizado_em").notNull(),
  },
  (tabela) => [
    uniqueIndex("progresso_ingestao_chave_unica").on(tabela.codIbge, tabela.exercicio),
  ],
);

export type LinhaProgressoIngestao = typeof progressoIngestao.$inferSelect;
export type NovaLinhaProgressoIngestao = typeof progressoIngestao.$inferInsert;

/**
 * Cadastro de município: dados relativamente estáveis (nome, população,
 * microrregião) que não vêm do SICONFI e não fazem sentido junto do
 * resultado de um indicador. Fonte: SICONFI /entes (nome, população) + API
 * de Localidades do IBGE (microrregião), cruzados pelo script de seed
 * (Fase 1, Tarefa 1.2) — ver data/fixtures/NOTES.md.
 */
export const municipios = sqliteTable("municipios", {
  codIbge: integer("cod_ibge").primaryKey(),
  nome: text("nome").notNull(),
  uf: text("uf").notNull(),
  populacao: integer("populacao").notNull(),
  microrregiaoId: integer("microrregiao_id").notNull(),
  microrregiaoNome: text("microrregiao_nome").notNull(),
  atualizadoEm: text("atualizado_em").notNull(),
});

export type LinhaMunicipio = typeof municipios.$inferSelect;
export type NovaLinhaMunicipio = typeof municipios.$inferInsert;
