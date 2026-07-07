import { notFound } from "next/navigation";
import { CardFoco } from "../../../components/CardFoco";
import { CardSemDados } from "../../../components/CardSemDados";
import { CardVizinho } from "../../../components/CardVizinho";
import {
  GraficoComparativo,
  type ItemComparativo,
} from "../../../components/GraficoComparativo";
import { SeletorMunicipio } from "../../../components/SeletorMunicipio";
import {
  buscarMunicipios,
  buscarPainel,
  buscarVizinhos,
  type PainelMunicipio,
} from "../../../lib/contratoApi";
import { rotuloPeriodo } from "../../../lib/formato";
import { indicadorDe } from "../../../lib/indicadores";
import { limiteLegal } from "../../../lib/limites";
import { avaliarSinal } from "../../../lib/semaforo";

const EXERCICIO = 2024;

function itensComparativo(paineis: PainelMunicipio[]): ItemComparativo[] {
  const itens: ItemComparativo[] = [];
  for (const painel of paineis) {
    const despesa = indicadorDe(painel, "despesa_pessoal");
    if (despesa === null) {
      continue;
    }
    const sinal = avaliarSinal("despesa_pessoal", despesa.valor);
    if (sinal === null) {
      throw new Error("despesa_pessoal deveria ter limite legal definido.");
    }
    itens.push({ nome: painel.municipio.nome, valor: despesa.valor, sinal });
  }
  return itens;
}

export default async function PaginaMunicipio({
  params,
}: {
  params: Promise<{ ibge: string }>;
}) {
  const { ibge } = await params;
  const codIbge = Number(ibge);
  if (!Number.isInteger(codIbge)) {
    notFound();
  }

  const painelFoco = await buscarPainel(codIbge, EXERCICIO);
  if (painelFoco === null) {
    notFound();
  }

  const [municipios, vizinhosLista] = await Promise.all([
    buscarMunicipios(EXERCICIO),
    buscarVizinhos(codIbge, EXERCICIO),
  ]);

  const paineisVizinhos = (
    await Promise.all(vizinhosLista.map((v) => buscarPainel(v.codIbge, EXERCICIO)))
  ).filter((painel): painel is PainelMunicipio => painel !== null);

  const rgf = indicadorDe(painelFoco, "despesa_pessoal");
  const rreo = indicadorDe(painelFoco, "execucao_orcamentaria_receita");
  const referencias = [
    `Exercício ${EXERCICIO}`,
    rgf === null ? null : `RGF: ${rotuloPeriodo(rgf.periodo)}`,
    rreo === null ? null : `RREO: ${rotuloPeriodo(rreo.periodo)}`,
  ]
    .filter((parte) => parte !== null)
    .join(" · ");

  const limiteDespesa = limiteLegal("despesa_pessoal");
  if (limiteDespesa === null) {
    throw new Error("despesa_pessoal deveria ter limite legal definido.");
  }

  const itensComp = itensComparativo([painelFoco, ...paineisVizinhos]);

  return (
    <main className="lauda">
      <header className="cabecalho">
        <p className="eyebrow">Dados abertos · SICONFI / Tesouro Nacional</p>
        <h1>Painel Fiscal — Municípios do RS</h1>
        <p className="periodo-ref">
          {referencias} ·{" "}
          <a href="https://siconfi.tesouro.gov.br" rel="noopener">
            siconfi.tesouro.gov.br
          </a>
        </p>
      </header>

      <SeletorMunicipio municipios={municipios} ano={EXERCICIO} />

      <h2 className="secao-titulo">Em foco</h2>
      {painelFoco.status === "sem_dados" ? (
        <CardSemDados painel={painelFoco} />
      ) : (
        <CardFoco painel={painelFoco} />
      )}

      <h2 className="secao-titulo">
        Vizinhos na microrregião
        {paineisVizinhos.length === 0 ? "" : ` · ${paineisVizinhos.length}`}
      </h2>
      {paineisVizinhos.length === 0 ? (
        <p className="indicador-ausente">
          Nenhum outro município da microrregião de {painelFoco.municipio.nome} no cadastro.
        </p>
      ) : (
        <div className="vizinhos-grade">
          {paineisVizinhos.map((painel) =>
            painel.status === "sem_dados" ? (
              <CardSemDados key={painel.municipio.codIbge} painel={painel} />
            ) : (
              <CardVizinho key={painel.municipio.codIbge} painel={painel} />
            ),
          )}
        </div>
      )}

      {itensComp.length > 0 && (
        <>
          <h2 className="secao-titulo">Na mesma régua</h2>
          <GraficoComparativo itens={itensComp} limite={limiteDespesa} />
        </>
      )}

      <footer className="metodologia">
        <h2>Como ler este painel</h2>
        <p>
          <strong>Despesa com pessoal:</strong> a Lei de Responsabilidade Fiscal (LC 101/2000,
          art. 20) limita a despesa total com pessoal do Executivo municipal a{" "}
          <strong>54% da receita corrente líquida</strong>. Aos 51,3% (limite prudencial, art. 22)
          o município já sofre vedações, como novas contratações; aos 48,6% (art. 59) os tribunais
          de contas emitem alerta.
        </p>
        <p>
          <strong>Endividamento:</strong> a Resolução nº 40/2001 do Senado Federal limita a dívida
          consolidada líquida dos municípios a <strong>120% da RCL</strong>; o alerta dos tribunais
          de contas vem aos 108%.
        </p>
        <p>
          <strong>Execução orçamentária:</strong> compara o que foi arrecadado e empenhado com o
          previsto no orçamento do ano. “Despesa realizada” usa o estágio <strong>empenhado</strong>.
          Não há limite legal — são indicadores de referência.
        </p>
        <p>
          Os vizinhos são os municípios da mesma microrregião do IBGE — recalculados para a cidade
          em foco. Municípios que não publicaram os relatórios da LRF de {EXERCICIO} aparecem
          assim mesmo: a ausência é informação pública.
        </p>
        <p>
          Todos os valores vêm da API de dados abertos do SICONFI (Tesouro Nacional), sem ajuste
          manual — o ⓘ ao lado de cada número mostra o relatório, anexo e coluna de origem, para
          conferência contra o documento oficial. Dado ausente aparece como ausência, nunca como
          zero.
        </p>
      </footer>
    </main>
  );
}
