import type { z } from "zod";
import {
  type Ente,
  entesRespostaSchema,
  type RGFItem,
  rgfRespostaSchema,
  type RREOItem,
  rreoRespostaSchema,
} from "./schemas.js";

const BASE_URL = "https://apidatalake.tesouro.gov.br/ords/siconfi/tt";
const LIMITE_POR_PAGINA = 5000;
const MAX_TENTATIVAS = 3;
const BACKOFF_BASE_MS = 500;
const TIMEOUT_MS = 20_000;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buscarComRetry(url: URL): Promise<unknown> {
  let ultimoErro: unknown;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const resposta = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!resposta.ok) {
        throw new Error(
          `SICONFI respondeu ${resposta.status} ${resposta.statusText} para ${url.toString()}`,
        );
      }
      return await resposta.json();
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa < MAX_TENTATIVAS) {
        await esperar(BACKOFF_BASE_MS * 2 ** (tentativa - 1));
      }
    }
  }
  throw new Error(
    `Falha ao buscar ${url.toString()} após ${MAX_TENTATIVAS} tentativas: ${String(ultimoErro)}`,
  );
}

interface RespostaPaginada<Item> {
  items: Item[];
  hasMore: boolean;
}

/**
 * Busca todas as páginas de um endpoint SICONFI, validando cada página com o
 * schema Zod correspondente. Falha alto: uma página que não bate com o schema
 * interrompe a busca com erro explícito, nunca retorna dado parcial não validado.
 */
async function buscarTodasPaginas<Item>(
  endpoint: string,
  queryBase: URLSearchParams,
  schema: z.ZodType<RespostaPaginada<Item>>,
): Promise<Item[]> {
  const itens: Item[] = [];
  let offset = 0;

  for (;;) {
    const query = new URLSearchParams(queryBase);
    query.set("offset", String(offset));
    query.set("limit", String(LIMITE_POR_PAGINA));
    const url = new URL(`${BASE_URL}/${endpoint}?${query.toString()}`);

    const bruto = await buscarComRetry(url);
    const resultado = schema.safeParse(bruto);
    if (!resultado.success) {
      throw new Error(
        `Resposta de ${endpoint} não bate com o schema esperado: ${resultado.error.message}`,
      );
    }

    itens.push(...resultado.data.items);
    if (!resultado.data.hasMore) {
      return itens;
    }
    offset += resultado.data.items.length;
  }
}

export async function listarEntes(
  params: { anExercicio?: number } = {},
): Promise<Ente[]> {
  const query = new URLSearchParams();
  if (params.anExercicio !== undefined) {
    query.set("an_exercicio", String(params.anExercicio));
  }
  return buscarTodasPaginas("entes", query, entesRespostaSchema);
}

export async function buscarRREO(params: {
  anExercicio: number;
  nrPeriodo: number;
  idEnte: number;
}): Promise<RREOItem[]> {
  const query = new URLSearchParams({
    an_exercicio: String(params.anExercicio),
    nr_periodo: String(params.nrPeriodo),
    co_tipo_demonstrativo: "RREO",
    id_ente: String(params.idEnte),
  });
  return buscarTodasPaginas("rreo", query, rreoRespostaSchema);
}

export async function buscarRGF(params: {
  anExercicio: number;
  nrPeriodo: number;
  idEnte: number;
  inPeriodicidade?: "Q" | "S";
  coPoder?: "E" | "L";
}): Promise<RGFItem[]> {
  const query = new URLSearchParams({
    an_exercicio: String(params.anExercicio),
    in_periodicidade: params.inPeriodicidade ?? "Q",
    nr_periodo: String(params.nrPeriodo),
    co_tipo_demonstrativo: "RGF",
    co_poder: params.coPoder ?? "E",
    id_ente: String(params.idEnte),
  });
  return buscarTodasPaginas("rgf", query, rgfRespostaSchema);
}
