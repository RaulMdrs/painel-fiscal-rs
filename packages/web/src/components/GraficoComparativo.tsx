import { formatarPercentual } from "../lib/formato";
import type { LimiteLegal } from "../lib/limites";
import type { Sinal } from "../lib/semaforo";
import { percentualCurto, ReguaDaLei } from "./ReguaDaLei";

export interface ItemComparativo {
  nome: string;
  valor: number;
  sinal: Sinal;
}

/**
 * Todos os municípios na mesma régua, do maior para o menor: a escala única
 * transforma a régua da lei num ranking honesto. A posição da barra em
 * relação às marcas de 51,3%/54% comunica o estado independentemente da cor;
 * a legenda textual reforça.
 */
export function GraficoComparativo({
  itens,
  limite,
}: {
  itens: ItemComparativo[];
  limite: LimiteLegal;
}) {
  const ordenados = [...itens].sort((a, b) => b.valor - a.valor);
  const posicao = (n: number) => `${(n / limite.escalaMax) * 100}%`;
  const referencia = limite.prudencial ?? limite.alerta;
  const nomeReferencia = limite.prudencial !== null ? "prudencial" : "alerta";

  return (
    <div className="card">
      <p className="indicador-rotulo">Despesa com pessoal — todos na mesma régua</p>
      <p className="indicador-def">
        Escala única de 0% a {percentualCurto(limite.escalaMax)} da RCL, do maior para o menor
        comprometimento. Quem cruza a marca dos {percentualCurto(limite.maximo)} está acima do
        limite máximo da LRF.
      </p>

      <div className="comparativo">
        <div className="comparativo-linha" aria-hidden="true">
          <span />
          <div className="comparativo-eixo-track">
            <span className="eixo-rotulo eixo-rotulo--alto" style={{ left: posicao(referencia) }}>
              <strong>{percentualCurto(referencia)}</strong> {nomeReferencia}
            </span>
            <span className="eixo-rotulo" style={{ left: posicao(limite.maximo) }}>
              <strong>{percentualCurto(limite.maximo)}</strong> máximo
            </span>
          </div>
          <span />
        </div>

        {ordenados.map((item) => (
          <div className="comparativo-linha" key={item.nome}>
            <span className="comparativo-nome">{item.nome}</span>
            <ReguaDaLei
              mini
              valor={item.valor}
              limite={limite}
              estado={item.sinal.estado}
              rotuloAcessivel={`${item.nome}: ${formatarPercentual(item.valor)} — ${item.sinal.rotulo}.`}
            />
            <span className="comparativo-valor">{formatarPercentual(item.valor)}</span>
          </div>
        ))}
      </div>

      <div className="comparativo-legenda">
        <span className="carimbo sinal--ok">
          <span className="carimbo-quadrado" aria-hidden="true" />
          dentro do limite
        </span>
        <span className="carimbo sinal--alerta">
          <span className="carimbo-quadrado" aria-hidden="true" />
          zona de alerta
        </span>
        <span className="carimbo sinal--estouro">
          <span className="carimbo-quadrado" aria-hidden="true" />
          acima do limite máximo
        </span>
      </div>
    </div>
  );
}
