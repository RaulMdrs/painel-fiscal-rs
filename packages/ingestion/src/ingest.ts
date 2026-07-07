import { fileURLToPath } from "node:url";
import {
  RASTREIO_PERCENTUAL_SOBRE_RCL,
  calcularDespesaPessoal,
} from "../../core/src/indicadores/despesaPessoal.js";
import {
  calcularEndividamento,
  rastreioPercentualDCL,
} from "../../core/src/indicadores/endividamento.js";
import {
  RASTREIO_EXECUCAO_DESPESA,
  RASTREIO_EXECUCAO_RECEITA,
  calcularExecucaoOrcamentaria,
} from "../../core/src/indicadores/execucaoOrcamentaria.js";
import { RASTREIO_RCL, extrairRCL } from "../../core/src/indicadores/rcl.js";
import { buscarRGF, buscarRREO } from "../../core/src/siconfi/client.js";
import type {
  IndicadorFiscal,
  Municipio,
  Periodo,
  UnidadeIndicador,
} from "../../core/src/types.js";
import { executarComLimite } from "./concorrencia.js";
import { lerConfiguracao } from "./config.js";
import { abrirBanco, type Banco } from "./db/client.js";
import {
  buscarProgresso,
  relatorioCobertura,
  type ResultadoParaGravar,
  type StatusIngestao,
  upsertProgresso,
  upsertResultado,
} from "./db/repositorio.js";
import { listarMunicipiosAlvo } from "./municipios.js";

const EXERCICIO = 2024;
const PERIODO_RREO: Periodo = { exercicio: EXERCICIO, numero: 6, periodicidade: "B" };
const PERIODO_RGF: Periodo = { exercicio: EXERCICIO, numero: 3, periodicidade: "Q" };

const CAMINHO_BANCO = fileURLToPath(
  new URL("../../../data/painel-fiscal.sqlite", import.meta.url),
);

interface Rastreio {
  anexo: string;
  codConta: string;
  coluna: string;
}

function rotuloPeriodo(periodo: Periodo): string {
  switch (periodo.periodicidade) {
    case "B":
      return `${periodo.numero}º bimestre`;
    case "Q":
      return `${periodo.numero}º quadrimestre`;
    case "S":
      return `${periodo.numero}º semestre`;
  }
}

function construirFonte(
  demonstrativo: "RREO" | "RGF",
  periodo: Periodo,
  rastreio: Rastreio,
): string {
  return (
    `SICONFI ${demonstrativo} ${periodo.exercicio}, ${rotuloPeriodo(periodo)}, ` +
    `${rastreio.anexo}, ${rastreio.codConta}, coluna "${rastreio.coluna}"`
  );
}

function formatarValor(unidade: UnidadeIndicador, valor: number): string {
  return unidade === "PERCENTUAL" ? `${valor.toFixed(2)}%` : `R$ ${valor.toFixed(2)}`;
}

/** Executa uma função de cálculo do core; loga e retorna undefined se ela falhar alto. */
function tentarCalcular<T>(contexto: string, rotulo: string, calcular: () => T): T | undefined {
  try {
    return calcular();
  } catch (erro) {
    console.error(
      `  ${contexto} ✗ ${rotulo}: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return undefined;
  }
}

/** Grava um resultado no banco (upsert); loga sucesso/falha. Retorna se gravou. */
function gravar(
  db: Banco,
  contexto: string,
  municipio: Municipio,
  periodo: Periodo,
  demonstrativo: "RREO" | "RGF",
  indicador: IndicadorFiscal,
  valor: number,
  unidade: UnidadeIndicador,
  rastreio: Rastreio,
): boolean {
  try {
    const resultado: ResultadoParaGravar = {
      indicador,
      municipio,
      periodo,
      valor,
      unidade,
      fonte: construirFonte(demonstrativo, periodo, rastreio),
      ...rastreio,
    };
    upsertResultado(db, resultado);
    console.log(`  ${contexto} ✓ ${indicador}: ${formatarValor(unidade, valor)}`);
    return true;
  } catch (erro) {
    console.error(
      `  ${contexto} ✗ ${indicador}: falha ao gravar no banco — ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return false;
  }
}

async function ingerirMunicipio(
  db: Banco,
  municipio: Municipio,
  prefixo: string,
): Promise<{ ok: number; falhas: number }> {
  const contexto = `${prefixo} ${municipio.nome}`;
  console.log(`${contexto} (${municipio.codIbge})`);
  let ok = 0;
  let falhas = 0;

  const itensRGF = await buscarRGF({
    anExercicio: EXERCICIO,
    nrPeriodo: PERIODO_RGF.numero,
    idEnte: municipio.codIbge,
  }).catch((erro: unknown) => {
    console.error(
      `  ${contexto} ✗ falha ao buscar RGF: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return undefined;
  });

  if (itensRGF !== undefined) {
    const despesaPessoal = tentarCalcular(contexto, "despesa_pessoal", () =>
      calcularDespesaPessoal(itensRGF),
    );
    if (despesaPessoal !== undefined) {
      const sucesso = gravar(
        db,
        contexto,
        municipio,
        PERIODO_RGF,
        "RGF",
        "despesa_pessoal",
        despesaPessoal.percentualSobreRcl,
        "PERCENTUAL",
        RASTREIO_PERCENTUAL_SOBRE_RCL,
      );
      sucesso ? ok++ : falhas++;
    } else {
      falhas++;
    }

    const endividamento = tentarCalcular(contexto, "endividamento", () =>
      calcularEndividamento(itensRGF),
    );
    if (endividamento !== undefined) {
      const rastreio = rastreioPercentualDCL(
        PERIODO_RGF.periodicidade,
        PERIODO_RGF.numero,
      );
      const sucesso = gravar(
        db,
        contexto,
        municipio,
        PERIODO_RGF,
        "RGF",
        "endividamento",
        endividamento.percentualDCLSobreRCL,
        "PERCENTUAL",
        rastreio,
      );
      sucesso ? ok++ : falhas++;
    } else {
      falhas++;
    }
  } else {
    console.error(`  ${contexto} ✗ despesa_pessoal: RGF indisponível, pulando.`);
    console.error(`  ${contexto} ✗ endividamento: RGF indisponível, pulando.`);
    falhas += 2;
  }

  const itensRREO = await buscarRREO({
    anExercicio: EXERCICIO,
    nrPeriodo: PERIODO_RREO.numero,
    idEnte: municipio.codIbge,
  }).catch((erro: unknown) => {
    console.error(
      `  ${contexto} ✗ falha ao buscar RREO: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return undefined;
  });

  if (itensRREO !== undefined) {
    const rcl = tentarCalcular(contexto, "receita_corrente_liquida", () => extrairRCL(itensRREO));
    if (rcl !== undefined) {
      const sucesso = gravar(
        db,
        contexto,
        municipio,
        PERIODO_RREO,
        "RREO",
        "receita_corrente_liquida",
        rcl.receitaCorrenteLiquida,
        "BRL",
        RASTREIO_RCL,
      );
      sucesso ? ok++ : falhas++;
    } else {
      falhas++;
    }

    const execucao = tentarCalcular(contexto, "execucao_orcamentaria", () =>
      calcularExecucaoOrcamentaria(itensRREO),
    );
    if (execucao !== undefined) {
      const sucessoReceita = gravar(
        db,
        contexto,
        municipio,
        PERIODO_RREO,
        "RREO",
        "execucao_orcamentaria_receita",
        execucao.percentualExecucaoReceita,
        "PERCENTUAL",
        RASTREIO_EXECUCAO_RECEITA,
      );
      sucessoReceita ? ok++ : falhas++;

      const sucessoDespesa = gravar(
        db,
        contexto,
        municipio,
        PERIODO_RREO,
        "RREO",
        "execucao_orcamentaria_despesa",
        execucao.percentualExecucaoDespesa,
        "PERCENTUAL",
        RASTREIO_EXECUCAO_DESPESA,
      );
      sucessoDespesa ? ok++ : falhas++;
    } else {
      falhas += 2;
    }
  } else {
    console.error(`  ${contexto} ✗ receita_corrente_liquida: RREO indisponível, pulando.`);
    console.error(
      `  ${contexto} ✗ execucao_orcamentaria_receita/despesa: RREO indisponível, pulando.`,
    );
    falhas += 3;
  }

  return { ok, falhas };
}

/** Rótulo de status para a linha de progresso de um município. */
function rotuloStatus(status: StatusIngestao, ok: number, falhas: number): string {
  switch (status) {
    case "completo":
      return `✓ ${ok} indicador(es)`;
    case "sem_dados":
      return "✗ sem_dados";
    case "parcial":
      return `⚠ parcial (${ok}/${ok + falhas})`;
  }
}

async function main(): Promise<void> {
  const config = lerConfiguracao();
  const { db, fechar } = abrirBanco(CAMINHO_BANCO);

  try {
    console.log(`Buscando municípios de UF=${config.uf} via SICONFI /entes...`);
    const municipios = await listarMunicipiosAlvo({ uf: config.uf, limite: config.limite });
    if (municipios.length === 0) {
      throw new Error(`Nenhum município encontrado para UF="${config.uf}".`);
    }

    console.log(
      `Ingestão SICONFI → ${CAMINHO_BANCO}\n` +
        `Exercício ${EXERCICIO} — RREO ${rotuloPeriodo(PERIODO_RREO)}, RGF ${rotuloPeriodo(PERIODO_RGF)}\n` +
        `${municipios.length} município(s) alvo, concorrência=${config.concorrencia}` +
        `${config.forcar ? " (ignorando progresso anterior)" : ""}.`,
    );

    let totalOk = 0;
    let totalFalhas = 0;
    let puladas = 0;

    await executarComLimite(municipios, config.concorrencia, async (municipio, indice) => {
      const prefixo = `[${indice + 1}/${municipios.length}]`;

      if (!config.forcar) {
        const progresso = buscarProgresso(db, municipio.codIbge, EXERCICIO);
        if (progresso !== undefined) {
          console.log(
            `${prefixo} ${municipio.nome}... já ingerido (${progresso.status}), pulando.`,
          );
          puladas++;
          return;
        }
      }

      const { ok, falhas } = await ingerirMunicipio(db, municipio, prefixo);
      totalOk += ok;
      totalFalhas += falhas;

      const status: StatusIngestao = ok === 0 ? "sem_dados" : falhas === 0 ? "completo" : "parcial";
      upsertProgresso(db, {
        municipio,
        exercicio: EXERCICIO,
        status,
        indicadoresOk: ok,
        indicadoresFalha: falhas,
      });
      console.log(`${prefixo} ${municipio.nome}... ${rotuloStatus(status, ok, falhas)}`);
    });

    const cobertura = relatorioCobertura(db, EXERCICIO);
    const totalRegistrado = cobertura.completo + cobertura.parcial + cobertura.sem_dados;

    console.log(`\n=== Relatório de cobertura — exercício ${EXERCICIO} (UF=${config.uf}) ===`);
    console.log(`Completo:   ${cobertura.completo}`);
    console.log(`Parcial:    ${cobertura.parcial}`);
    console.log(`Sem dados:  ${cobertura.sem_dados}`);
    console.log(`Total:      ${totalRegistrado} de ${municipios.length} município(s) alvo.`);
    if (puladas > 0) {
      console.log(`(${puladas} já haviam sido ingerido(s) nesta execução e foram pulado(s).)`);
    }
    console.log(
      `\nResumo desta execução: ${totalOk} indicador(es) gravado(s), ${totalFalhas} falha(s), ` +
        `${puladas} pulado(s).`,
    );
  } finally {
    fechar();
  }
}

main();
