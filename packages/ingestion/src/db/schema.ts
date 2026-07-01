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
