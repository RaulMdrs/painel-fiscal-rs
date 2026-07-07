/**
 * Executa `tarefa` para cada item de `itens` com no máximo `limite` execuções
 * concorrentes — evita disparar centenas de requisições de uma vez contra o
 * SICONFI e esbarrar em rate limit. Cada "trabalhador" puxa o próximo item de
 * uma fila compartilhada assim que termina o anterior (em vez de dividir a
 * lista em lotes fixos, o que deixaria trabalhadores ociosos se um item
 * demorar mais que os outros).
 */
export async function executarComLimite<T>(
  itens: readonly T[],
  limite: number,
  tarefa: (item: T, indice: number) => Promise<void>,
): Promise<void> {
  if (itens.length === 0) {
    return;
  }

  let proximoIndice = 0;

  async function trabalhador(): Promise<void> {
    for (;;) {
      const indice = proximoIndice++;
      if (indice >= itens.length) {
        return;
      }
      const item = itens[indice] as T;
      await tarefa(item, indice);
    }
  }

  const trabalhadores = Array.from({ length: Math.min(limite, itens.length) }, () =>
    trabalhador(),
  );
  await Promise.all(trabalhadores);
}
