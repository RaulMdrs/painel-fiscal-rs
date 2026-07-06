import type { Municipio } from "./types.js";

/**
 * Os 5 municípios-alvo da Fase 0 (README.md), cod_ibge confirmado na
 * Tarefa 0 contra a API real do SICONFI (ver data/fixtures/NOTES.md).
 * Lista canônica reaproveitada pela ingestão e pela API — nem todo
 * município-alvo necessariamente tem dado publicado em todo período.
 */
export const MUNICIPIOS_ALVO: readonly Municipio[] = [
  { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS" },
  { codIbge: 4315701, nome: "Rio Pardo", uf: "RS" },
  { codIbge: 4302808, nome: "Caçapava do Sul", uf: "RS" },
  { codIbge: 4319604, nome: "São Sepé", uf: "RS" },
  { codIbge: 4306908, nome: "Encruzilhada do Sul", uf: "RS" },
];
