const CONCORRENCIA_PADRAO = 5;
const UF_PADRAO = "RS";

export interface ConfiguracaoIngestao {
  /** UF alvo da ingestão — permite futuramente cobrir outros estados. */
  uf: string;
  /** Corta a lista de municípios após ordenar por nome; útil para rodadas parciais/testes. */
  limite: number | undefined;
  /** Nº de requisições concorrentes ao SICONFI. */
  concorrencia: number;
  /** Ignora o progresso já registrado e reingesta tudo. */
  forcar: boolean;
}

function lerInteiroPositivo(valor: string | undefined, nomeVar: string): number | undefined {
  if (valor === undefined || valor.trim() === "") {
    return undefined;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`${nomeVar} inválido: "${valor}" (esperado inteiro positivo)`);
  }
  return numero;
}

/**
 * Lê a configuração da ingestão do ambiente. Falha alto se uma variável
 * estiver presente mas com valor inválido, em vez de cair num default
 * silencioso que mascare um erro de configuração.
 */
export function lerConfiguracao(
  env: Record<string, string | undefined> = process.env,
): ConfiguracaoIngestao {
  const uf = env.INGEST_UF?.trim() || UF_PADRAO;
  const limite = lerInteiroPositivo(env.INGEST_LIMIT, "INGEST_LIMIT");
  const concorrencia = lerInteiroPositivo(env.INGEST_CONCORRENCIA, "INGEST_CONCORRENCIA") ?? CONCORRENCIA_PADRAO;
  const forcar = env.INGEST_FORCE === "1";

  return { uf, limite, concorrencia, forcar };
}
