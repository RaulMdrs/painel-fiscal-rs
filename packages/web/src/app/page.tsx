import { CardFoco } from "../components/CardFoco";
import { CardSemDados } from "../components/CardSemDados";
import { CardVizinho } from "../components/CardVizinho";
import {
  GraficoComparativo,
  type ItemComparativo,
} from "../components/GraficoComparativo";
import { buscarMunicipios, buscarPainel, type PainelMunicipio } from "../lib/contratoApi";
import { rotuloPeriodo } from "../lib/formato";
import { indicadorDe } from "../lib/indicadores";
import { limiteLegal } from "../lib/limites";
import { avaliarSinal } from "../lib/semaforo";

/** Cachoeira do Sul: o município em foco da Fase 0. */
const COD_IBGE_FOCO = 4303004;
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

export default async function Pagina() {
  const municipios = await buscarMunicipios();
  const paineis = await Promise.all(
    municipios.map((municipio) => buscarPainel(municipio.codIbge, EXERCICIO)),
  );

  const painelFoco = paineis.find((painel) => painel.municipio.codIbge === COD_IBGE_FOCO);
  if (painelFoco === undefined) {
    throw new Error(
      `O município em foco (cod_ibge ${COD_IBGE_FOCO}) não veio na resposta da API.`,
    );
  }
  const vizinhos = paineis.filter((painel) => painel !== painelFoco);

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

      <h2 className="secao-titulo">Em foco</h2>
      {painelFoco.status === "sem_dados" ? (
        <CardSemDados painel={painelFoco} />
      ) : (
        <CardFoco painel={painelFoco} />
      )}

      <h2 className="secao-titulo">E os vizinhos?</h2>
      <div className="vizinhos-grade">
        {vizinhos.map((painel) =>
          painel.status === "sem_dados" ? (
            <CardSemDados key={painel.municipio.codIbge} painel={painel} />
          ) : (
            <CardVizinho key={painel.municipio.codIbge} painel={painel} />
          ),
        )}
      </div>

      <h2 className="secao-titulo">Na mesma régua</h2>
      <GraficoComparativo itens={itensComparativo(paineis)} limite={limiteDespesa} />

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
          Todos os valores vêm da API de dados abertos do SICONFI (Tesouro Nacional), sem ajuste
          manual — o ⓘ ao lado de cada número mostra o relatório, anexo e coluna de origem, para
          conferência contra o documento oficial. Dado ausente aparece como ausência, nunca como
          zero.
        </p>
      </footer>
    </main>
  );
}
