import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const RAIZ_REPO = fileURLToPath(new URL("../../../../", import.meta.url));

export function lerFixture(nome: string): unknown {
  const conteudo = readFileSync(`${RAIZ_REPO}data/fixtures/${nome}`, "utf-8");
  return JSON.parse(conteudo);
}
