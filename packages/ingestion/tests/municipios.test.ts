import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Ente } from "../../core/src/siconfi/schemas.js";

const listarMunicipiosMock = vi.fn<(params?: { uf?: string }) => Promise<Ente[]>>();

vi.mock("../../core/src/siconfi/client.js", () => ({
  listarMunicipios: (params?: { uf?: string }) => listarMunicipiosMock(params),
}));

const { listarMunicipiosAlvo } = await import("../src/municipios.js");

function ente(parcial: Partial<Ente> & Pick<Ente, "cod_ibge" | "ente">): Ente {
  return {
    capital: "0",
    regiao: "SU",
    uf: "RS",
    esfera: "M",
    exercicio: 2024,
    populacao: 1000,
    cnpj: "00000000000000",
    ...parcial,
  };
}

describe("listarMunicipiosAlvo", () => {
  beforeEach(() => {
    listarMunicipiosMock.mockReset();
  });

  it("mapeia Ente para Municipio e ordena por nome", async () => {
    listarMunicipiosMock.mockResolvedValueOnce([
      ente({ cod_ibge: 4315701, ente: "Rio Pardo" }),
      ente({ cod_ibge: 4303004, ente: "Cachoeira do Sul" }),
    ]);

    const municipios = await listarMunicipiosAlvo({ uf: "RS", limite: undefined });

    expect(listarMunicipiosMock).toHaveBeenCalledWith({ uf: "RS" });
    expect(municipios).toEqual([
      { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS" },
      { codIbge: 4315701, nome: "Rio Pardo", uf: "RS" },
    ]);
  });

  it("aplica o limite após ordenar", async () => {
    listarMunicipiosMock.mockResolvedValueOnce([
      ente({ cod_ibge: 4315701, ente: "Rio Pardo" }),
      ente({ cod_ibge: 4303004, ente: "Cachoeira do Sul" }),
      ente({ cod_ibge: 4319604, ente: "São Sepé" }),
    ]);

    const municipios = await listarMunicipiosAlvo({ uf: "RS", limite: 2 });

    expect(municipios).toEqual([
      { codIbge: 4303004, nome: "Cachoeira do Sul", uf: "RS" },
      { codIbge: 4315701, nome: "Rio Pardo", uf: "RS" },
    ]);
  });

  it("falha alto se um ente vier sem UF", async () => {
    listarMunicipiosMock.mockResolvedValueOnce([
      ente({ cod_ibge: 4303004, ente: "Cachoeira do Sul", uf: null }),
    ]);

    await expect(listarMunicipiosAlvo({ uf: "RS", limite: undefined })).rejects.toThrow(
      /sem UF/,
    );
  });
});
