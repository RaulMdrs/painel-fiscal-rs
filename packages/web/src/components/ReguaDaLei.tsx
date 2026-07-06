import type { LimiteLegal } from "../lib/limites";
import type { EstadoSinal } from "../lib/semaforo";

const percentualCurtoFmt = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function percentualCurto(valor: number): string {
  return `${percentualCurtoFmt.format(valor)}%`;
}

interface Marca {
  valor: number;
  nome: string;
  tipo: "referencia" | "maximo";
  posicaoRotulo: "acima" | "abaixo";
}

/** Marcas da régua: prudencial (quando a lei o define, senão alerta) + máximo. */
function marcasDoLimite(limite: LimiteLegal): Marca[] {
  const referencia: Marca =
    limite.prudencial !== null
      ? { valor: limite.prudencial, nome: "prudencial", tipo: "referencia", posicaoRotulo: "acima" }
      : { valor: limite.alerta, nome: "alerta", tipo: "referencia", posicaoRotulo: "acima" };
  return [
    referencia,
    { valor: limite.maximo, nome: "limite máximo", tipo: "maximo", posicaoRotulo: "abaixo" },
  ];
}

interface ReguaDaLeiProps {
  valor: number;
  limite: LimiteLegal;
  estado: EstadoSinal;
  rotuloAcessivel: string;
  mini?: boolean;
}

/**
 * A régua da lei: escala fixa por indicador (comparável entre municípios),
 * limites legais marcados e rotulados, barra na cor do sinal. A posição da
 * barra em relação às marcas comunica o estado mesmo sem cor.
 */
export function ReguaDaLei({ valor, limite, estado, rotuloAcessivel, mini = false }: ReguaDaLeiProps) {
  const posicao = (n: number) => `${Math.min((n / limite.escalaMax) * 100, 100)}%`;
  const marcas = marcasDoLimite(limite);

  return (
    <div className={mini ? "regua regua--mini" : "regua"} role="img" aria-label={rotuloAcessivel}>
      <div className="regua-track">
        <div className={`regua-fill sinal--${estado}`} style={{ width: posicao(valor) }} />
        {marcas.map((marca) => (
          <span
            key={marca.nome}
            className={marca.tipo === "maximo" ? "regua-tick regua-tick--max" : "regua-tick"}
            style={{ left: posicao(marca.valor) }}
          >
            {!mini && (
              <span className={`regua-tick-rotulo regua-tick-rotulo--${marca.posicaoRotulo}`}>
                <strong>{percentualCurto(marca.valor)}</strong> {marca.nome}
              </span>
            )}
          </span>
        ))}
      </div>
      {!mini && (
        <div className="regua-escala" aria-hidden="true">
          <span>0%</span>
          <span>{percentualCurto(limite.escalaMax)}</span>
        </div>
      )}
    </div>
  );
}
