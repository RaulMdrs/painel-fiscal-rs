import type { ReactNode } from "react";
import type { IndicadorDaApi, PainelMunicipio } from "../lib/contratoApi";
import {
  formatarBrlCompacto,
  formatarPercentual,
  formatarValorExato,
} from "../lib/formato";
import { indicadorDe } from "../lib/indicadores";
import { limiteLegal } from "../lib/limites";
import { avaliarSinal } from "../lib/semaforo";
import { Carimbo } from "./Carimbo";
import { FonteInfo } from "./FonteInfo";
import { percentualCurto, ReguaDaLei } from "./ReguaDaLei";

function MiniLinha({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="mini-linha">
      <dt>{titulo}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function MiniValor({ ind, titulo }: { ind: IndicadorDaApi | null; titulo: string }) {
  if (ind === null) {
    return <>não publicado</>;
  }
  const valorFmt =
    ind.unidade === "BRL" ? formatarBrlCompacto(ind.valor) : formatarPercentual(ind.valor);
  return (
    <>
      {valorFmt}
      <FonteInfo
        rotulo={titulo}
        fonte={ind.fonte}
        valorExato={formatarValorExato(ind.valor, ind.unidade)}
      />
    </>
  );
}

/**
 * Card compacto de comparação: destaca a despesa com pessoal (mesma régua do
 * card em foco, escala idêntica) e resume os demais indicadores em linhas.
 */
export function CardVizinho({ painel }: { painel: PainelMunicipio }) {
  const despesaPessoal = indicadorDe(painel, "despesa_pessoal");
  const endividamento = indicadorDe(painel, "endividamento");
  const execucaoReceita = indicadorDe(painel, "execucao_orcamentaria_receita");
  const execucaoDespesa = indicadorDe(painel, "execucao_orcamentaria_despesa");
  const rcl = indicadorDe(painel, "receita_corrente_liquida");

  const limite = despesaPessoal === null ? null : limiteLegal("despesa_pessoal");
  const sinal =
    despesaPessoal === null ? null : avaliarSinal("despesa_pessoal", despesaPessoal.valor);

  return (
    <article className="card vizinho">
      <h3 className="municipio-nome">{painel.municipio.nome}</h3>
      <p className="municipio-meta">
        {painel.municipio.uf} · IBGE {painel.municipio.codIbge}
      </p>

      <div className="vizinho-destaque">
        <p className="indicador-rotulo">Despesa com pessoal</p>
        {despesaPessoal === null || limite === null || sinal === null ? (
          <p className="indicador-ausente">Não publicado no SICONFI para este período.</p>
        ) : (
          <>
            <div className="valor-linha">
              <span className="valor valor--medio">{formatarPercentual(despesaPessoal.valor)}</span>
              <Carimbo sinal={sinal} />
            </div>
            <ReguaDaLei
              mini
              valor={despesaPessoal.valor}
              limite={limite}
              estado={sinal.estado}
              rotuloAcessivel={`Despesa com pessoal: ${formatarPercentual(despesaPessoal.valor)}. Limite máximo: ${percentualCurto(limite.maximo)}. Situação: ${sinal.rotulo}.`}
            />
            <FonteInfo
              rotulo="Despesa com pessoal"
              fonte={despesaPessoal.fonte}
              valorExato={formatarValorExato(despesaPessoal.valor, despesaPessoal.unidade)}
            />
          </>
        )}
      </div>

      <dl className="mini-indicadores">
        <MiniLinha titulo="Endividamento">
          <MiniValor ind={endividamento} titulo="Endividamento" />
        </MiniLinha>
        <MiniLinha titulo="Receita arrecadada">
          <MiniValor ind={execucaoReceita} titulo="Receita arrecadada (execução)" />
        </MiniLinha>
        <MiniLinha titulo="Despesa empenhada">
          <MiniValor ind={execucaoDespesa} titulo="Despesa empenhada (execução)" />
        </MiniLinha>
        <MiniLinha titulo="RCL 12 meses">
          <MiniValor ind={rcl} titulo="Receita corrente líquida" />
        </MiniLinha>
      </dl>
    </article>
  );
}
