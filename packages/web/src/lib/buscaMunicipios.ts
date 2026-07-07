/**
 * Normaliza texto para busca tolerante: remove acentos (NFD + corta os
 * diacríticos combinantes U+0300–U+036F), passa a minúsculas e apara espaços.
 * Assim "sao sepe" casa com "São Sepé" e "CACHOEIRA" com "Cachoeira do Sul".
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Filtra municípios pelo nome com digitação relaxada (acento/caixa ignorados).
 * Resultados que *começam* com o termo vêm antes dos que apenas o *contêm* —
 * o comportamento esperado de autocomplete. A ordem dentro de cada grupo
 * preserva a da lista de entrada (que a API já entrega ordenada por nome).
 * Consulta vazia devolve a lista inteira.
 */
export function filtrarMunicipios<T extends { nome: string }>(
  lista: readonly T[],
  consulta: string,
): T[] {
  const alvo = normalizar(consulta);
  if (alvo === "") {
    return [...lista];
  }

  const comecam: T[] = [];
  const contem: T[] = [];
  for (const municipio of lista) {
    const nome = normalizar(municipio.nome);
    if (nome.startsWith(alvo)) {
      comecam.push(municipio);
    } else if (nome.includes(alvo)) {
      contem.push(municipio);
    }
  }
  return [...comecam, ...contem];
}
