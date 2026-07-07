import type Database from "better-sqlite3";

/**
 * DDL mantida manualmente em vez de migrações do drizzle-kit — para a Fase 0
 * um único CREATE TABLE IF NOT EXISTS é suficiente. As colunas precisam
 * espelhar exatamente schema.ts.
 */
export function garantirEsquema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS resultados_indicadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_ibge INTEGER NOT NULL,
      municipio_nome TEXT NOT NULL,
      indicador TEXT NOT NULL,
      exercicio INTEGER NOT NULL,
      periodo_numero INTEGER NOT NULL,
      periodicidade TEXT NOT NULL,
      valor REAL NOT NULL,
      unidade TEXT NOT NULL,
      fonte TEXT NOT NULL,
      anexo TEXT NOT NULL,
      cod_conta TEXT NOT NULL,
      coluna TEXT NOT NULL,
      ingerido_em TEXT NOT NULL,
      UNIQUE (cod_ibge, indicador, exercicio, periodo_numero, periodicidade)
    );

    CREATE TABLE IF NOT EXISTS progresso_ingestao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cod_ibge INTEGER NOT NULL,
      municipio_nome TEXT NOT NULL,
      exercicio INTEGER NOT NULL,
      status TEXT NOT NULL,
      indicadores_ok INTEGER NOT NULL,
      indicadores_falha INTEGER NOT NULL,
      atualizado_em TEXT NOT NULL,
      UNIQUE (cod_ibge, exercicio)
    );
  `);
}
