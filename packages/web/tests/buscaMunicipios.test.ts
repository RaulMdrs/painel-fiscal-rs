import { describe, expect, it } from "vitest";
import { filtrarMunicipios, normalizar } from "../src/lib/buscaMunicipios";

const MUNICIPIOS = [
  { codIbge: 4303004, nome: "Cachoeira do Sul" },
  { codIbge: 4302808, nome: "Caçapava do Sul" },
  { codIbge: 4306908, nome: "Encruzilhada do Sul" },
  { codIbge: 4319604, nome: "São Sepé" },
  { codIbge: 4314100, nome: "Passo Fundo" },
  { codIbge: 4314902, nome: "Porto Alegre" },
];

describe("normalizar", () => {
  it("remove acentos e caixa", () => {
    expect(normalizar("São Sepé")).toBe("sao sepe");
    expect(normalizar("CACHOEIRA")).toBe("cachoeira");
    expect(normalizar("Caçapava")).toBe("cacapava");
  });

  it("apara espaços nas bordas", () => {
    expect(normalizar("  Porto  ")).toBe("porto");
  });
});

describe("filtrarMunicipios", () => {
  it("acha com digitação sem acento e caixa qualquer", () => {
    expect(filtrarMunicipios(MUNICIPIOS, "sao sepe").map((m) => m.nome)).toEqual(["São Sepé"]);
    expect(filtrarMunicipios(MUNICIPIOS, "CACHOEIRA").map((m) => m.nome)).toEqual([
      "Cachoeira do Sul",
    ]);
    expect(filtrarMunicipios(MUNICIPIOS, "encruzilhada").map((m) => m.nome)).toEqual([
      "Encruzilhada do Sul",
    ]);
    expect(filtrarMunicipios(MUNICIPIOS, "cacapava").map((m) => m.nome)).toEqual([
      "Caçapava do Sul",
    ]);
  });

  it("prefixo curto casa cedo (autocomplete)", () => {
    expect(filtrarMunicipios(MUNICIPIOS, "cach").map((m) => m.nome)).toEqual(["Cachoeira do Sul"]);
  });

  it("prioriza quem começa com o termo antes de quem só o contém", () => {
    // "sul" aparece no fim de vários nomes; "São Sepé" não tem "sul".
    const nomes = filtrarMunicipios(MUNICIPIOS, "sul").map((m) => m.nome);
    expect(nomes).toContain("Cachoeira do Sul");
    expect(nomes).not.toContain("São Sepé");
    // Nenhum começa com "sul", então todos vêm do grupo "contém", em ordem de entrada.
    expect(nomes[0]).toBe("Cachoeira do Sul");
  });

  it("prefixo vence substring na ordenação", () => {
    const lista = [
      { codIbge: 1, nome: "Alto Feliz" },
      { codIbge: 2, nome: "Feliz" },
    ];
    // "feliz": "Feliz" começa com o termo, "Alto Feliz" apenas contém.
    expect(filtrarMunicipios(lista, "feliz").map((m) => m.nome)).toEqual(["Feliz", "Alto Feliz"]);
  });

  it("consulta vazia devolve a lista inteira", () => {
    expect(filtrarMunicipios(MUNICIPIOS, "")).toHaveLength(MUNICIPIOS.length);
    expect(filtrarMunicipios(MUNICIPIOS, "   ")).toHaveLength(MUNICIPIOS.length);
  });

  it("sem correspondência devolve lista vazia", () => {
    expect(filtrarMunicipios(MUNICIPIOS, "xyzzy")).toEqual([]);
  });
});
