import { fileURLToPath } from "node:url";
import { abrirBanco, type ConexaoBanco } from "../../ingestion/src/db/client.js";

const CAMINHO_BANCO = fileURLToPath(
  new URL("../../../data/painel-fiscal.sqlite", import.meta.url),
);

/** Abre o cache SQLite populado pela ingestão (packages/ingestion). Só leitura aqui. */
export function conectarBancoReal(): ConexaoBanco {
  return abrirBanco(CAMINHO_BANCO);
}
