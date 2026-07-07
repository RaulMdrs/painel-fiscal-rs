interface ItemComConta {
  anexo: string;
  cod_conta: string;
  coluna: string;
  valor: number;
}

export interface CriterioConta {
  anexo: string;
  codConta: string;
  coluna: string;
}

/**
 * Localiza uma linha específica (anexo + cod_conta + coluna) nos itens já
 * parseados pelo schema Zod. Lança erro explícito se não encontrar — falhar
 * alto é a regra do projeto: dado fiscal ausente nunca vira NaN silencioso.
 */
export function localizarConta<Item extends ItemComConta>(
  itens: readonly Item[],
  criterio: CriterioConta,
): Item {
  const encontrado = itens.find(
    (item) =>
      item.anexo === criterio.anexo &&
      item.cod_conta === criterio.codConta &&
      item.coluna === criterio.coluna,
  );
  if (encontrado === undefined) {
    throw new Error(
      `Conta não encontrada nos dados do SICONFI: anexo="${criterio.anexo}" ` +
        `cod_conta="${criterio.codConta}" coluna="${criterio.coluna}". ` +
        "Dado ausente, período incompleto ou o schema do relatório mudou — não presuma o valor.",
    );
  }
  return encontrado;
}
