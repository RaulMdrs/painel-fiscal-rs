import { z } from "zod";
import type {
  IndicadorFiscal,
  Municipio,
  Periodicidade,
  Periodo,
  UnidadeIndicador,
} from "../../../core/src/types";

/**
 * Contrato da API da Tarefa 5, validado na borda com Zod. A UI não confia no
 * shape do JSON: resposta fora do vocabulário do core → erro explícito, nunca
 * um número suspeito na tela. Os `satisfies` amarram os schemas aos tipos do
 * core em tempo de compilação.
 */

const municipioSchema = z.object({
  codIbge: z.number().int(),
  nome: z.string().min(1),
  uf: z.string().length(2),
}) satisfies z.ZodType<Municipio>;

const statusSchema = z.enum(["com_dados", "sem_dados"] as const);

const periodoSchema = z.object({
  exercicio: z.number().int(),
  numero: z.number().int(),
  periodicidade: z.enum(["B", "Q", "S"] as const) satisfies z.ZodType<Periodicidade>,
}) satisfies z.ZodType<Periodo>;

const indicadorFiscalSchema = z.enum([
  "receita_corrente_liquida",
  "despesa_pessoal",
  "endividamento",
  "execucao_orcamentaria_receita",
  "execucao_orcamentaria_despesa",
] as const) satisfies z.ZodType<IndicadorFiscal>;

const indicadorSchema = z.object({
  indicador: indicadorFiscalSchema,
  municipio: municipioSchema,
  periodo: periodoSchema,
  valor: z.number().finite(),
  unidade: z.enum(["BRL", "PERCENTUAL"] as const) satisfies z.ZodType<UnidadeIndicador>,
  fonte: z.string().min(1),
  anexo: z.string().min(1),
  codConta: z.string().min(1),
  coluna: z.string().min(1),
});

const municipioComStatusSchema = municipioSchema.extend({ status: statusSchema });

export const respostaMunicipiosSchema = z.object({
  municipios: z.array(municipioComStatusSchema),
});

export const respostaVizinhosSchema = z.object({
  foco: municipioComStatusSchema,
  criterio: z.string().min(1),
  vizinhos: z.array(municipioComStatusSchema),
});

export const respostaIndicadoresSchema = z.object({
  municipio: municipioSchema,
  ano: z.number().int(),
  status: statusSchema,
  indicadores: z.array(indicadorSchema),
});

export type MunicipioComStatus = z.infer<typeof municipioComStatusSchema>;
export type IndicadorDaApi = z.infer<typeof indicadorSchema>;
export type PainelMunicipio = z.infer<typeof respostaIndicadoresSchema>;

const URL_BASE_API = process.env["PAINEL_API_URL"] ?? "http://localhost:3001";

async function requisitar(caminho: string): Promise<Response> {
  try {
    return await fetch(`${URL_BASE_API}${caminho}`, { cache: "no-store" });
  } catch (causa) {
    throw new Error(
      `Não foi possível conectar à API do painel em ${URL_BASE_API}. ` +
        "Ela precisa estar rodando (na raiz do repositório: pnpm api).",
      { cause: causa },
    );
  }
}

async function jsonOuErro(resposta: Response, caminho: string): Promise<unknown> {
  if (!resposta.ok) {
    throw new Error(`API do painel respondeu ${resposta.status} em ${caminho}.`);
  }
  return resposta.json();
}

export async function buscarMunicipios(ano: number): Promise<MunicipioComStatus[]> {
  const caminho = `/municipios?ano=${ano}`;
  const json = await jsonOuErro(await requisitar(caminho), caminho);
  return respostaMunicipiosSchema.parse(json).municipios;
}

/**
 * Painel de um município. Retorna `null` em 404 (cod_ibge fora do cadastro do
 * RS) para a rota chamar `notFound()` — distinto de um município que existe
 * mas não publicou (esse responde 200 com status "sem_dados").
 */
export async function buscarPainel(codIbge: number, ano: number): Promise<PainelMunicipio | null> {
  const caminho = `/municipios/${codIbge}/indicadores?ano=${ano}`;
  const resposta = await requisitar(caminho);
  if (resposta.status === 404) {
    return null;
  }
  return respostaIndicadoresSchema.parse(await jsonOuErro(resposta, caminho));
}

export async function buscarVizinhos(
  codIbge: number,
  ano: number,
): Promise<MunicipioComStatus[]> {
  const caminho = `/municipios/${codIbge}/vizinhos?ano=${ano}`;
  const json = await jsonOuErro(await requisitar(caminho), caminho);
  return respostaVizinhosSchema.parse(json).vizinhos;
}
