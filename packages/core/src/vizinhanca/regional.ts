import type { EstrategiaVizinhanca } from "./tipos.js";

/**
 * Default de vizinhos retornados quando `opcoes.limite` não é informado.
 * RS tem microrregiões de 3 a 31 municípios (mediana 13, ver
 * data/fixtures/NOTES.md) — 10 cobre a maioria das microrregiões inteiras e
 * ainda dá um recorte razoável nas maiores.
 */
export const LIMITE_PADRAO_REGIONAL = 10;

/**
 * Vizinhos = municípios da mesma microrregião do IBGE, excluindo o próprio.
 * Quando o total excede o limite, prioriza os de população mais próxima à
 * do município-foco (não os N maiores nem os N primeiros da lista) — é o
 * recorte mais comparável para exibir lado a lado. A saída final é sempre
 * ordenada por nome, para uma apresentação estável independente de haver
 * corte ou não.
 */
export const encontrarVizinhosRegional: EstrategiaVizinhanca = (
  universo,
  codIbge,
  opcoes,
) => {
  const alvo = universo.find((municipio) => municipio.codIbge === codIbge);
  if (alvo === undefined) {
    throw new Error(
      `Município cod_ibge=${codIbge} não encontrado no universo fornecido a encontrarVizinhos.`,
    );
  }

  const candidatos = universo.filter(
    (municipio) =>
      municipio.codIbge !== codIbge &&
      municipio.microrregiaoId === alvo.microrregiaoId,
  );

  const limite = opcoes.limite ?? LIMITE_PADRAO_REGIONAL;
  const selecionados =
    candidatos.length <= limite
      ? candidatos
      : [...candidatos]
          .sort(
            (a, b) =>
              Math.abs(a.populacao - alvo.populacao) -
              Math.abs(b.populacao - alvo.populacao),
          )
          .slice(0, limite);

  return [...selecionados].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
};
