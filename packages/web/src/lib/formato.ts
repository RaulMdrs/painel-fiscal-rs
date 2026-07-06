import type { Periodo, UnidadeIndicador } from "../../../core/src/types";

function exigirFinito(valor: number, contexto: string): void {
  if (!Number.isFinite(valor)) {
    throw new Error(`Valor não finito (${valor}) em ${contexto} — não exibimos número suspeito.`);
  }
}

const percentualFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const brlFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactoFmt = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** 40.33 → "40,33%" (o valor já vem em pontos percentuais da API). */
export function formatarPercentual(valor: number): string {
  exigirFinito(valor, "formatarPercentual");
  return `${percentualFmt.format(valor)}%`;
}

/** Valor exato em BRL, para conferência contra o relatório oficial. */
export function formatarBrlCompleto(valor: number): string {
  exigirFinito(valor, "formatarBrlCompleto");
  return brlFmt.format(valor);
}

/** Valor resumido para leitura rápida ("R$ 386,3 mi"); o exato fica na fonte. */
export function formatarBrlCompacto(valor: number): string {
  exigirFinito(valor, "formatarBrlCompacto");
  const absoluto = Math.abs(valor);
  if (absoluto >= 1e9) {
    return `R$ ${compactoFmt.format(valor / 1e9)} bi`;
  }
  if (absoluto >= 1e6) {
    return `R$ ${compactoFmt.format(valor / 1e6)} mi`;
  }
  if (absoluto >= 1e3) {
    return `R$ ${compactoFmt.format(valor / 1e3)} mil`;
  }
  return brlFmt.format(valor);
}

const exatoFmt = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 10,
});

/**
 * Valor exato, sem arredondamento de exibição, para conferência contra o
 * relatório oficial (vai no painel de fonte de cada número).
 */
export function formatarValorExato(valor: number, unidade: UnidadeIndicador): string {
  exigirFinito(valor, "formatarValorExato");
  return unidade === "BRL" ? brlFmt.format(valor) : `${exatoFmt.format(valor)}%`;
}

const NOME_PERIODICIDADE = {
  B: "bimestre",
  Q: "quadrimestre",
  S: "semestre",
} as const;

/** { 2024, 6, "B" } → "6º bimestre de 2024". */
export function rotuloPeriodo(periodo: Periodo): string {
  const nome = NOME_PERIODICIDADE[periodo.periodicidade];
  return `${periodo.numero}º ${nome} de ${periodo.exercicio}`;
}
