import type { Sinal } from "../lib/semaforo";

/**
 * Selo textual do estado legal. Discreto de propósito — o número e a régua
 * são a estrela. O texto carrega o significado; o quadrado colorido só
 * reforça (nunca é o único encoding do estado).
 */
export function Carimbo({ sinal }: { sinal: Sinal }) {
  return (
    <span className={`carimbo sinal--${sinal.estado}`}>
      <span className="carimbo-quadrado" aria-hidden="true" />
      {sinal.rotulo}
    </span>
  );
}
