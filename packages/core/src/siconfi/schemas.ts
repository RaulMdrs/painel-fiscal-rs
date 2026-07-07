import { z } from "zod";

/**
 * Envelope de paginação comum a /entes, /rreo e /rgf (estilo ORDS), confirmado
 * nos fixtures reais em data/fixtures/. `links` não aparece no fixture de
 * /entes filtrado à mão na Tarefa 0, mas apareceu na resposta bruta real —
 * por isso é opcional aqui em vez de obrigatório.
 */
function paginaSchema<Item extends z.ZodTypeAny>(itemSchema: Item) {
  return z.object({
    items: z.array(itemSchema),
    hasMore: z.boolean(),
    limit: z.number().int().nonnegative(),
    offset: z.number().int().nonnegative(),
    count: z.number().int().nonnegative(),
    links: z
      .array(z.object({ rel: z.string(), href: z.string() }))
      .optional(),
  });
}

/**
 * /entes cobre União (cod_ibge=1), Estados (2 dígitos) e Municípios (7
 * dígitos) — confirmado numa chamada real (esfera "U"/"E"/"D"/"M"). Não dá
 * para presumir 7 dígitos aqui; quem precisa validar o cod_ibge de um
 * município específico faz isso na borda (ingestion), não no schema da API.
 */
const codIbgeSchema = z.number().int().nonnegative();

export const enteSchema = z.object({
  cod_ibge: codIbgeSchema,
  ente: z.string(),
  capital: z.string(),
  regiao: z.string(),
  // null para a União (esfera "U") — confirmado numa chamada real.
  uf: z.string().nullable(),
  esfera: z.string(),
  exercicio: z.number().int(),
  populacao: z.number().int().nonnegative(),
  cnpj: z.string(),
});
export type Ente = z.infer<typeof enteSchema>;

export const entesRespostaSchema = paginaSchema(enteSchema);
export type EntesResposta = z.infer<typeof entesRespostaSchema>;

export const rreoItemSchema = z.object({
  exercicio: z.number().int(),
  demonstrativo: z.literal("RREO"),
  periodo: z.number().int(),
  periodicidade: z.string(),
  instituicao: z.string(),
  cod_ibge: codIbgeSchema,
  uf: z.string(),
  populacao: z.number().int().nonnegative(),
  anexo: z.string(),
  esfera: z.string(),
  rotulo: z.string(),
  coluna: z.string(),
  cod_conta: z.string(),
  conta: z.string(),
  valor: z.number(),
});
export type RREOItem = z.infer<typeof rreoItemSchema>;

export const rreoRespostaSchema = paginaSchema(rreoItemSchema);
export type RREOResposta = z.infer<typeof rreoRespostaSchema>;

/**
 * Diferente do item de RREO, o item de RGF não tem campo `demonstrativo` e
 * tem `co_poder` — confirmado no fixture real (rgf_4303004_2024_p3.json).
 */
export const rgfItemSchema = z.object({
  exercicio: z.number().int(),
  periodo: z.number().int(),
  periodicidade: z.string(),
  instituicao: z.string(),
  cod_ibge: codIbgeSchema,
  uf: z.string(),
  co_poder: z.string(),
  populacao: z.number().int().nonnegative(),
  anexo: z.string(),
  esfera: z.string(),
  rotulo: z.string(),
  coluna: z.string(),
  cod_conta: z.string(),
  conta: z.string(),
  valor: z.number(),
});
export type RGFItem = z.infer<typeof rgfItemSchema>;

export const rgfRespostaSchema = paginaSchema(rgfItemSchema);
export type RGFResposta = z.infer<typeof rgfRespostaSchema>;
