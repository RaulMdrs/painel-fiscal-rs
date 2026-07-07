import type { IndicadorDaApi, PainelMunicipio } from "../lib/contratoApi";
import {
  formatarBrlCompacto,
  formatarPercentual,
  formatarValorExato,
  rotuloPeriodo,
} from "../lib/formato";
import { indicadorDe } from "../lib/indicadores";
import { limiteLegal } from "../lib/limites";
import { avaliarSinal } from "../lib/semaforo";
import { BarraExecucao } from "./BarraExecucao";
import { Carimbo } from "./Carimbo";
import { FonteInfo } from "./FonteInfo";
import { percentualCurto, ReguaDaLei } from "./ReguaDaLei";

function BlocoAusente({ titulo }: { titulo: string }) {
  return (
    <section>
      <h4 className="indicador-rotulo">{titulo}</h4>
      <p className="indicador-ausente">
        Não publicado no SICONFI para este período — a ausência é mostrada como ausência, nunca
        como zero.
      </p>
    </section>
  );
}

function BlocoComLimite({
  ind,
  titulo,
  definicao,
}: {
  ind: IndicadorDaApi | null;
  titulo: string;
  definicao: string;
}) {
  if (ind === null) {
    return <BlocoAusente titulo={titulo} />;
  }
  const limite = limiteLegal(ind.indicador);
  const sinal = avaliarSinal(ind.indicador, ind.valor);
  if (limite === null || sinal === null) {
    throw new Error(`Indicador "${ind.indicador}" não tem limite legal — não cabe régua da lei.`);
  }

  return (
    <section>
      <h4 className="indicador-rotulo">{titulo}</h4>
      <p className="indicador-def">{definicao}</p>
      <div className="valor-linha">
        <span className="valor">{formatarPercentual(ind.valor)}</span>
        <Carimbo sinal={sinal} />
      </div>
      <ReguaDaLei
        valor={ind.valor}
        limite={limite}
        estado={sinal.estado}
        rotuloAcessivel={`${titulo}: ${formatarPercentual(ind.valor)}. Limite máximo: ${percentualCurto(limite.maximo)}. Situação: ${sinal.rotulo}.`}
      />
      <div className="indicador-rodape">
        <FonteInfo
          rotulo={titulo}
          fonte={ind.fonte}
          valorExato={formatarValorExato(ind.valor, ind.unidade)}
        />
        <span className="indicador-periodo">{rotuloPeriodo(ind.periodo)}</span>
      </div>
    </section>
  );
}

function LinhaExecucao({ ind, titulo }: { ind: IndicadorDaApi | null; titulo: string }) {
  if (ind === null) {
    return <p className="indicador-ausente">{titulo}: não publicado para este período.</p>;
  }
  return (
    <div className="execucao-linha">
      <div className="valor-linha">
        <span className="execucao-rotulo">{titulo}</span>
        <span className="valor valor--medio">{formatarPercentual(ind.valor)}</span>
      </div>
      <BarraExecucao
        valor={ind.valor}
        rotuloAcessivel={`${titulo}: ${formatarPercentual(ind.valor)} do previsto no orçamento (marca de referência: 100%).`}
      />
      <div className="indicador-rodape">
        <FonteInfo
          rotulo={titulo}
          fonte={ind.fonte}
          valorExato={formatarValorExato(ind.valor, ind.unidade)}
        />
        <span className="indicador-periodo">{rotuloPeriodo(ind.periodo)}</span>
      </div>
    </div>
  );
}

/** O município em destaque: os 4 indicadores com contexto completo. */
export function CardFoco({ painel }: { painel: PainelMunicipio }) {
  const despesaPessoal = indicadorDe(painel, "despesa_pessoal");
  const endividamento = indicadorDe(painel, "endividamento");
  const execucaoReceita = indicadorDe(painel, "execucao_orcamentaria_receita");
  const execucaoDespesa = indicadorDe(painel, "execucao_orcamentaria_despesa");
  const rcl = indicadorDe(painel, "receita_corrente_liquida");

  return (
    <article className="card foco">
      <h3 className="municipio-nome">{painel.municipio.nome}</h3>
      <p className="municipio-meta">
        {painel.municipio.uf} · IBGE {painel.municipio.codIbge}
      </p>

      <div className="foco-grade">
        <BlocoComLimite
          ind={despesaPessoal}
          titulo="Despesa com pessoal"
          definicao="Quanto da receita corrente líquida vai para a folha de pagamento. A LRF limita a 54% no Executivo municipal."
        />
        <BlocoComLimite
          ind={endividamento}
          titulo="Endividamento"
          definicao="Dívida consolidada líquida como percentual da RCL. O Senado limita a 120% para municípios."
        />

        <section>
          <h4 className="indicador-rotulo">Execução orçamentária</h4>
          <p className="indicador-def">
            Quanto do que foi previsto no orçamento de {painel.ano} de fato se realizou: receita
            arrecadada e despesa empenhada.
          </p>
          <LinhaExecucao ind={execucaoReceita} titulo="Receita arrecadada" />
          <LinhaExecucao ind={execucaoDespesa} titulo="Despesa empenhada" />
        </section>

        {rcl === null ? (
          <BlocoAusente titulo="Receita corrente líquida" />
        ) : (
          <section>
            <h4 className="indicador-rotulo">Receita corrente líquida</h4>
            <p className="indicador-def">
              O “salário” do município: é sobre ela que todos os limites da LRF são calculados. Não
              há limite legal — valor de referência.
            </p>
            <div className="valor-linha">
              <span className="valor">{formatarBrlCompacto(rcl.valor)}</span>
            </div>
            <div className="indicador-rodape">
              <FonteInfo
                rotulo="Receita corrente líquida"
                fonte={rcl.fonte}
                valorExato={formatarValorExato(rcl.valor, rcl.unidade)}
              />
              <span className="indicador-periodo">
                acumulada em 12 meses · {rotuloPeriodo(rcl.periodo)}
              </span>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
