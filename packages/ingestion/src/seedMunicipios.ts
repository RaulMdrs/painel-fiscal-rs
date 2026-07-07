import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { listarMunicipios } from "../../core/src/siconfi/client.js";
import { abrirBanco } from "./db/client.js";
import { upsertMunicipio } from "./db/repositorio.js";

const CAMINHO_BANCO = fileURLToPath(
  new URL("../../../data/painel-fiscal.sqlite", import.meta.url),
);
const CAMINHO_SEED_IBGE = fileURLToPath(
  new URL("../../../data/fixtures/ibge_municipios_rs.json", import.meta.url),
);

interface MicrorregiaoIbge {
  codIbge: number;
  nome: string;
  microrregiaoId: number;
  microrregiaoNome: string;
}

/**
 * Popula a tabela `municipios` (cadastro: nome/população/microrregião)
 * cruzando o seed estático do IBGE (data/fixtures/ibge_municipios_rs.json)
 * com a população vinda do SICONFI /entes — usado pelo modelo de vizinhança
 * regional (Fase 1, Tarefa 1.2). Roda separado da ingestão de indicadores
 * porque microrregião quase não muda; não há motivo pra chamar o IBGE toda
 * ingestão.
 */
async function main(): Promise<void> {
  const microrregioes: MicrorregiaoIbge[] = JSON.parse(readFileSync(CAMINHO_SEED_IBGE, "utf-8"));
  const microrregiaoPorCodIbge = new Map(microrregioes.map((m) => [m.codIbge, m]));

  console.log(`Seed de municípios: ${microrregioes.length} município(s) no seed do IBGE.`);
  console.log("Buscando população via SICONFI /entes (uf=RS)...");
  const entes = await listarMunicipios({ uf: "RS" });

  const semMicrorregiao = entes.filter((ente) => !microrregiaoPorCodIbge.has(ente.cod_ibge));
  if (semMicrorregiao.length > 0) {
    throw new Error(
      `${semMicrorregiao.length} município(s) do SICONFI sem microrregião no seed do IBGE ` +
        `(seed desatualizado? rode a busca no IBGE de novo) — ` +
        `${semMicrorregiao.map((e) => `${e.ente} (${e.cod_ibge})`).join(", ")}`,
    );
  }

  const codigosSiconfi = new Set(entes.map((e) => e.cod_ibge));
  const semSiconfi = microrregioes.filter((m) => !codigosSiconfi.has(m.codIbge));
  if (semSiconfi.length > 0) {
    throw new Error(
      `${semSiconfi.length} município(s) do seed do IBGE sem correspondente no SICONFI /entes: ` +
        `${semSiconfi.map((m) => `${m.nome} (${m.codIbge})`).join(", ")}`,
    );
  }

  const { db, fechar } = abrirBanco(CAMINHO_BANCO);
  try {
    for (const ente of entes) {
      const microrregiao = microrregiaoPorCodIbge.get(ente.cod_ibge);
      if (microrregiao === undefined || ente.uf === null) {
        throw new Error(`Estado inconsistente para ${ente.ente} (${ente.cod_ibge}).`);
      }
      upsertMunicipio(db, {
        codIbge: ente.cod_ibge,
        nome: ente.ente,
        uf: ente.uf,
        populacao: ente.populacao,
        microrregiaoId: microrregiao.microrregiaoId,
        microrregiaoNome: microrregiao.microrregiaoNome,
      });
    }
    console.log(`Cadastro de municípios atualizado: ${entes.length} gravado(s).`);
  } finally {
    fechar();
  }
}

main();
