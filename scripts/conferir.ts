import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { calcularDespesaPessoal } from "../packages/core/src/indicadores/despesaPessoal.js";
import { calcularEndividamento } from "../packages/core/src/indicadores/endividamento.js";
import { calcularExecucaoOrcamentaria } from "../packages/core/src/indicadores/execucaoOrcamentaria.js";
import { extrairRCL } from "../packages/core/src/indicadores/rcl.js";
import {
  rgfRespostaSchema,
  rreoRespostaSchema,
} from "../packages/core/src/siconfi/schemas.js";

const RAIZ_REPO = fileURLToPath(new URL("..", import.meta.url));

function lerFixture(nome: string): unknown {
  const conteudo = readFileSync(`${RAIZ_REPO}data/fixtures/${nome}`, "utf-8");
  return JSON.parse(conteudo);
}

const MUNICIPIO = "Cachoeira do Sul";
const COD_IBGE = 4303004;

type Unidade = "%" | "R$";

interface LinhaConferencia {
  indicador: string;
  calculado: number;
  oficial: number;
  unidade: Unidade;
}

const TOLERANCIA: Record<Unidade, number> = {
  "%": 0.01,
  "R$": 0.01,
};

function formatarValor(unidade: Unidade, valor: number): string {
  if (unidade === "%") {
    return `${valor.toFixed(2)}%`;
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

const CORES = {
  verde: "\x1b[32m",
  vermelho: "\x1b[31m",
  negrito: "\x1b[1m",
  reset: "\x1b[0m",
};

function colorir(texto: string, cor: string): string {
  if (!process.stdout.isTTY) {
    return texto;
  }
  return `${cor}${texto}${CORES.reset}`;
}

function bater(linha: LinhaConferencia): boolean {
  return Math.abs(linha.calculado - linha.oficial) <= TOLERANCIA[linha.unidade];
}

interface LinhaFormatada {
  indicador: string;
  calculado: string;
  oficial: string;
  bateu: boolean;
}

function imprimirTabela(linhas: readonly LinhaConferencia[]): void {
  const cabecalho: readonly [string, string, string, string] = [
    "Indicador",
    "Calculado",
    "Oficial",
    "Status",
  ];
  const formatadas: LinhaFormatada[] = linhas.map((linha) => ({
    indicador: linha.indicador,
    calculado: formatarValor(linha.unidade, linha.calculado),
    oficial: formatarValor(linha.unidade, linha.oficial),
    bateu: bater(linha),
  }));

  const larguraIndicador = Math.max(
    cabecalho[0].length,
    ...formatadas.map((linha) => linha.indicador.length),
  );
  const larguraCalculado = Math.max(
    cabecalho[1].length,
    ...formatadas.map((linha) => linha.calculado.length),
  );
  const larguraOficial = Math.max(
    cabecalho[2].length,
    ...formatadas.map((linha) => linha.oficial.length),
  );

  function imprimirLinha(
    indicador: string,
    calculado: string,
    oficial: string,
    status: string,
  ): void {
    console.log(
      [
        indicador.padEnd(larguraIndicador),
        calculado.padEnd(larguraCalculado),
        oficial.padEnd(larguraOficial),
        status,
      ].join("  |  "),
    );
  }

  imprimirLinha(cabecalho[0], cabecalho[1], cabecalho[2], cabecalho[3]);
  imprimirLinha(
    "-".repeat(larguraIndicador),
    "-".repeat(larguraCalculado),
    "-".repeat(larguraOficial),
    "-".repeat(cabecalho[3].length),
  );
  for (const linha of formatadas) {
    const status = linha.bateu
      ? colorir("✓", CORES.verde)
      : colorir("✗", CORES.vermelho);
    imprimirLinha(linha.indicador, linha.calculado, linha.oficial, status);
  }
}

function main(): void {
  const itensRREO = rreoRespostaSchema.parse(
    lerFixture("rreo_4303004_2024_p6.json"),
  ).items;
  const itensRGF = rgfRespostaSchema.parse(
    lerFixture("rgf_4303004_2024_p3.json"),
  ).items;

  const despesaPessoal = calcularDespesaPessoal(itensRGF);
  const rcl = extrairRCL(itensRREO);
  const endividamento = calcularEndividamento(itensRGF);
  const execucao = calcularExecucaoOrcamentaria(itensRREO);

  const linhas: LinhaConferencia[] = [
    {
      indicador: "Despesa c/ pessoal / RCL Ajustada",
      calculado: despesaPessoal.percentualSobreRcl,
      oficial: 40.33,
      unidade: "%",
    },
    {
      indicador: "Receita Corrente Líquida",
      calculado: rcl.receitaCorrenteLiquida,
      oficial: 386_316_913.8,
      unidade: "R$",
    },
    {
      indicador: "Endividamento (DCL/RCL)",
      calculado: endividamento.percentualDCLSobreRCL,
      oficial: 2.82,
      unidade: "%",
    },
    {
      indicador: "Execução de receita",
      calculado: execucao.percentualExecucaoReceita,
      oficial: 94.93,
      unidade: "%",
    },
  ];

  console.log(
    colorir(`Conferência — ${MUNICIPIO} (${COD_IBGE})`, CORES.negrito),
  );
  console.log();
  imprimirTabela(linhas);
  console.log();

  const divergencias = linhas.filter((linha) => !bater(linha));
  if (divergencias.length > 0) {
    console.log(
      colorir(
        `${divergencias.length} de ${linhas.length} indicador(es) NÃO batem com o valor oficial.`,
        CORES.vermelho,
      ),
    );
    process.exitCode = 1;
    return;
  }
  console.log(
    colorir(
      `Todos os ${linhas.length} indicadores batem com o valor oficial.`,
      CORES.verde,
    ),
  );
}

main();
