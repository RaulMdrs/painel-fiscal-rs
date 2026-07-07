import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { garantirEsquema } from "./migrar.js";

export type Banco = ReturnType<typeof drizzle<typeof schema>>;

export interface ConexaoBanco {
  db: Banco;
  fechar: () => void;
}

export function abrirBanco(caminhoArquivo: string): ConexaoBanco {
  const sqlite = new Database(caminhoArquivo);
  sqlite.pragma("journal_mode = WAL");
  garantirEsquema(sqlite);
  return { db: drizzle(sqlite, { schema }), fechar: () => sqlite.close() };
}
