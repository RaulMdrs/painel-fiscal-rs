interface FonteInfoProps {
  rotulo: string;
  fonte: string;
  valorExato: string;
}

/**
 * Rastreabilidade de cada número: um ⓘ que abre a fonte oficial (campo
 * "fonte" da API) e o valor exato, para conferência contra o relatório.
 * <details> nativo: funciona com teclado e toque, sem JavaScript.
 */
export function FonteInfo({ rotulo, fonte, valorExato }: FonteInfoProps) {
  return (
    <details className="fonte-info">
      <summary aria-label={`Ver fonte do dado: ${rotulo}`}>
        <span aria-hidden="true">ⓘ </span>
        fonte
      </summary>
      <div className="fonte-info-painel">
        <p className="fonte-info-titulo">Fonte oficial</p>
        <p>{fonte}</p>
        <p className="fonte-info-exato">Valor exato: {valorExato}</p>
      </div>
    </details>
  );
}
