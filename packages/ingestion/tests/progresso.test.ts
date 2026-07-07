import { beforeEach, describe, expect, it } from "vitest";
import type { Municipio } from "../../core/src/types.js";
import { abrirBanco, type Banco } from "../src/db/client.js";
import {
  buscarProgresso,
  relatorioCobertura,
  upsertProgresso,
} from "../src/db/repositorio.js";

const CACHOEIRA_DO_SUL: Municipio = {
  codIbge: 4303004,
  nome: "Cachoeira do Sul",
  uf: "RS",
};
const SAO_SEPE: Municipio = { codIbge: 4319604, nome: "São Sepé", uf: "RS" };
const RIO_PARDO: Municipio = { codIbge: 4315701, nome: "Rio Pardo", uf: "RS" };

let db: Banco;

beforeEach(() => {
  ({ db } = abrirBanco(":memory:"));
});

describe("upsertProgresso / buscarProgresso", () => {
  it("retorna undefined quando não há progresso registrado", () => {
    expect(buscarProgresso(db, CACHOEIRA_DO_SUL.codIbge, 2024)).toBeUndefined();
  });

  it("grava e recupera o status registrado", () => {
    upsertProgresso(db, {
      municipio: CACHOEIRA_DO_SUL,
      exercicio: 2024,
      status: "completo",
      indicadoresOk: 5,
      indicadoresFalha: 0,
    });

    expect(buscarProgresso(db, CACHOEIRA_DO_SUL.codIbge, 2024)).toEqual({
      status: "completo",
    });
  });

  it("upsert na chave (cod_ibge, exercicio) atualiza em vez de duplicar", () => {
    upsertProgresso(db, {
      municipio: CACHOEIRA_DO_SUL,
      exercicio: 2024,
      status: "parcial",
      indicadoresOk: 3,
      indicadoresFalha: 2,
    });
    upsertProgresso(db, {
      municipio: CACHOEIRA_DO_SUL,
      exercicio: 2024,
      status: "completo",
      indicadoresOk: 5,
      indicadoresFalha: 0,
    });

    expect(buscarProgresso(db, CACHOEIRA_DO_SUL.codIbge, 2024)).toEqual({
      status: "completo",
    });
    expect(relatorioCobertura(db, 2024)).toEqual({
      completo: 1,
      parcial: 0,
      sem_dados: 0,
    });
  });

  it("progresso é isolado por exercício", () => {
    upsertProgresso(db, {
      municipio: CACHOEIRA_DO_SUL,
      exercicio: 2023,
      status: "completo",
      indicadoresOk: 5,
      indicadoresFalha: 0,
    });

    expect(buscarProgresso(db, CACHOEIRA_DO_SUL.codIbge, 2024)).toBeUndefined();
  });
});

describe("relatorioCobertura", () => {
  it("conta municípios por status no exercício informado", () => {
    upsertProgresso(db, {
      municipio: CACHOEIRA_DO_SUL,
      exercicio: 2024,
      status: "completo",
      indicadoresOk: 5,
      indicadoresFalha: 0,
    });
    upsertProgresso(db, {
      municipio: RIO_PARDO,
      exercicio: 2024,
      status: "parcial",
      indicadoresOk: 3,
      indicadoresFalha: 2,
    });
    upsertProgresso(db, {
      municipio: SAO_SEPE,
      exercicio: 2024,
      status: "sem_dados",
      indicadoresOk: 0,
      indicadoresFalha: 5,
    });

    expect(relatorioCobertura(db, 2024)).toEqual({
      completo: 1,
      parcial: 1,
      sem_dados: 1,
    });
  });

  it("retorna zeros quando não há progresso para o exercício", () => {
    expect(relatorioCobertura(db, 2099)).toEqual({
      completo: 0,
      parcial: 0,
      sem_dados: 0,
    });
  });
});
