/** Escala fixa da execução orçamentária: 0–110% do previsto (há municípios acima de 100%). */
const ESCALA_MAX_EXECUCAO = 110;

interface BarraExecucaoProps {
  valor: number;
  rotuloAcessivel: string;
}

/**
 * Barra neutra (grafite) para execução orçamentária: a lei não fixa teto,
 * então não há semáforo — só a marca dos 100% do previsto como referência.
 */
export function BarraExecucao({ valor, rotuloAcessivel }: BarraExecucaoProps) {
  const posicao = (n: number) => `${Math.min((n / ESCALA_MAX_EXECUCAO) * 100, 100)}%`;

  return (
    <div className="regua regua--mini" role="img" aria-label={rotuloAcessivel}>
      <div className="regua-track">
        <div className="regua-fill" style={{ width: posicao(valor) }} />
        <span className="regua-tick regua-tick--max" style={{ left: posicao(100) }} />
      </div>
    </div>
  );
}
