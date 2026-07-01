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
import { abrirBanco } from "./db/client.js";
import { type ResultadoParaGravar, upsertResultado } from "./db/repositorio.js";

interface MunicipioAlvo {
  codIbge: number;
  nome: string;
}

const MUNICIPIOS_ALVO: readonly MunicipioAlvo[] = [
  { codIbge: 4303004, nome: "Cachoeira do Sul" },
  { codIbge: 4315701, nome: "Rio Pardo" },
  { codIbge: 4302808, nome: "Caçapava do Sul" },
  { codIbge: 4319604, nome: "São Sepé" },
  { codIbge: 4306908, nome: "Encruzilhada do Sul" },
];

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
function tentarCalcular<T>(rotulo: string, calcular: () => T): T | undefined {
  try {
    return calcular();
  } catch (erro) {
    console.error(`  ✗ ${rotulo}: ${erro instanceof Error ? erro.message : String(erro)}`);
    return undefined;
  }
}

/** Grava um resultado no banco (upsert); loga sucesso/falha. Retorna se gravou. */
function gravar(
  db: ReturnType<typeof abrirBanco>["db"],
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
    console.log(`  ✓ ${indicador}: ${formatarValor(unidade, valor)}`);
    return true;
  } catch (erro) {
    console.error(
      `  ✗ ${indicador}: falha ao gravar no banco — ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return false;
  }
}

async function ingerirMunicipio(
  db: ReturnType<typeof abrirBanco>["db"],
  alvo: MunicipioAlvo,
): Promise<{ ok: number; falhas: number }> {
  console.log(`\n→ ${alvo.nome} (${alvo.codIbge})`);
  const municipio: Municipio = { codIbge: alvo.codIbge, nome: alvo.nome, uf: "RS" };
  let ok = 0;
  let falhas = 0;

  const itensRGF = await buscarRGF({
    anExercicio: EXERCICIO,
    nrPeriodo: PERIODO_RGF.numero,
    idEnte: alvo.codIbge,
  }).catch((erro: unknown) => {
    console.error(
      `  ✗ falha ao buscar RGF: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return undefined;
  });

  if (itensRGF !== undefined) {
    const despesaPessoal = tentarCalcular("despesa_pessoal", () =>
      calcularDespesaPessoal(itensRGF),
    );
    if (despesaPessoal !== undefined) {
      const sucesso = gravar(
        db,
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

    const endividamento = tentarCalcular("endividamento", () =>
      calcularEndividamento(itensRGF),
    );
    if (endividamento !== undefined) {
      const rastreio = rastreioPercentualDCL(
        PERIODO_RGF.periodicidade,
        PERIODO_RGF.numero,
      );
      const sucesso = gravar(
        db,
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
    console.error("  ✗ despesa_pessoal: RGF indisponível, pulando.");
    console.error("  ✗ endividamento: RGF indisponível, pulando.");
    falhas += 2;
  }

  const itensRREO = await buscarRREO({
    anExercicio: EXERCICIO,
    nrPeriodo: PERIODO_RREO.numero,
    idEnte: alvo.codIbge,
  }).catch((erro: unknown) => {
    console.error(
      `  ✗ falha ao buscar RREO: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return undefined;
  });

  if (itensRREO !== undefined) {
    const rcl = tentarCalcular("receita_corrente_liquida", () => extrairRCL(itensRREO));
    if (rcl !== undefined) {
      const sucesso = gravar(
        db,
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

    const execucao = tentarCalcular("execucao_orcamentaria", () =>
      calcularExecucaoOrcamentaria(itensRREO),
    );
    if (execucao !== undefined) {
      const sucessoReceita = gravar(
        db,
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
    console.error("  ✗ receita_corrente_liquida: RREO indisponível, pulando.");
    console.error(
      "  ✗ execucao_orcamentaria_receita/despesa: RREO indisponível, pulando.",
    );
    falhas += 3;
  }

  return { ok, falhas };
}

async function main(): Promise<void> {
  console.log(
    `Ingestão SICONFI → ${CAMINHO_BANCO}\n` +
      `Exercício ${EXERCICIO} — RREO ${rotuloPeriodo(PERIODO_RREO)}, RGF ${rotuloPeriodo(PERIODO_RGF)}`,
  );

  const { db, fechar } = abrirBanco(CAMINHO_BANCO);

  let totalOk = 0;
  let totalFalhas = 0;
  try {
    for (const alvo of MUNICIPIOS_ALVO) {
      const { ok, falhas } = await ingerirMunicipio(db, alvo);
      totalOk += ok;
      totalFalhas += falhas;
    }
  } finally {
    fechar();
  }

  console.log(
    `\nResumo: ${totalOk} indicador(es) gravado(s), ${totalFalhas} falha(s), ` +
      `em ${MUNICIPIOS_ALVO.length} município(s).`,
  );
  if (totalFalhas > 0) {
    process.exitCode = 1;
  }
}

main();
