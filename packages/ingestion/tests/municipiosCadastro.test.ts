import { beforeEach, describe, expect, it } from "vitest";
import { abrirBanco, type Banco } from "../src/db/client.js";
import {
  listarMunicipiosParaVizinhanca,
  upsertMunicipio,
  upsertProgresso,
} from "../src/db/repositorio.js";

const CACHOEIRA_DO_SUL = {
  codIbge: 4303004,
  nome: "Cachoeira do Sul",
  uf: "RS",
  populacao: 82222,
  microrregiaoId: 43022,
  microrregiaoNome: "Cachoeira do Sul",
};
const RIO_PARDO = {
  codIbge: 4315701,
  nome: "Rio Pardo",
  uf: "RS",
  populacao: 35641,
  microrregiaoId: 43022,
  microrregiaoNome: "Cachoeira do Sul",
};

let db: Banco;

beforeEach(() => {
  ({ db } = abrirBanco(":memory:"));
});

describe("upsertMunicipio", () => {
  it("grava e é lido de volta por listarMunicipiosParaVizinhanca", () => {
    upsertMunicipio(db, CACHOEIRA_DO_SUL);

    const [municipio] = listarMunicipiosParaVizinhanca(db, 2024);
    expect(municipio).toMatchObject({
      codIbge: 4303004,
      nome: "Cachoeira do Sul",
      microrregiaoId: 43022,
    });
  });

  it("upsert na chave (cod_ibge) atualiza em vez de duplicar", () => {
    upsertMunicipio(db, CACHOEIRA_DO_SUL);
    upsertMunicipio(db, { ...CACHOEIRA_DO_SUL, populacao: 90000 });

    const municipios = listarMunicipiosParaVizinhanca(db, 2024);
    expect(municipios).toHaveLength(1);
    expect(municipios[0]?.populacao).toBe(90000);
  });
});

describe("listarMunicipiosParaVizinhanca", () => {
  it("município sem linha em progresso_ingestao vira status 'sem_dados', não some da lista", () => {
    upsertMunicipio(db, CACHOEIRA_DO_SUL);
    upsertMunicipio(db, RIO_PARDO);
    // Só Cachoeira do Sul tem progresso registrado nesse exercício.
    upsertProgresso(db, {
      municipio: { codIbge: CACHOEIRA_DO_SUL.codIbge, nome: CACHOEIRA_DO_SUL.nome, uf: "RS" },
      exercicio: 2024,
      status: "completo",
      indicadoresOk: 5,
      indicadoresFalha: 0,
    });

    const municipios = listarMunicipiosParaVizinhanca(db, 2024);

    expect(municipios).toHaveLength(2);
    const cachoeira = municipios.find((m) => m.codIbge === CACHOEIRA_DO_SUL.codIbge);
    const rioPardo = municipios.find((m) => m.codIbge === RIO_PARDO.codIbge);
    expect(cachoeira?.status).toBe("completo");
    expect(rioPardo?.status).toBe("sem_dados");
  });

  it("progresso de outro exercício não é aplicado ao exercício pedido", () => {
    upsertMunicipio(db, CACHOEIRA_DO_SUL);
    upsertProgresso(db, {
      municipio: { codIbge: CACHOEIRA_DO_SUL.codIbge, nome: CACHOEIRA_DO_SUL.nome, uf: "RS" },
      exercicio: 2023,
      status: "completo",
      indicadoresOk: 5,
      indicadoresFalha: 0,
    });

    const municipios = listarMunicipiosParaVizinhanca(db, 2024);

    expect(municipios[0]?.status).toBe("sem_dados");
  });
});
