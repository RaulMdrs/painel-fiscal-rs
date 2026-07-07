import { listarMunicipios } from "../../core/src/siconfi/client.js";
import type { Ente } from "../../core/src/siconfi/schemas.js";
import type { Municipio } from "../../core/src/types.js";

function paraMunicipio(ente: Ente): Municipio {
  if (ente.uf === null) {
    throw new Error(
      `Ente ${ente.ente} (cod_ibge ${ente.cod_ibge}, esfera "${ente.esfera}") sem UF — ` +
        "não é um município válido.",
    );
  }
  return { codIbge: ente.cod_ibge, nome: ente.ente, uf: ente.uf };
}

export interface OpcoesMunicipiosAlvo {
  uf: string;
  limite: number | undefined;
}

/**
 * Busca os municípios-alvo de uma rodada de ingestão via /entes do SICONFI,
 * filtrando por UF — substitui a lista fixa de 5 municípios da Fase 0 por uma
 * cobertura configurável e expansível (Fase 1, Tarefa 1.1).
 */
export async function listarMunicipiosAlvo(
  opcoes: OpcoesMunicipiosAlvo,
): Promise<Municipio[]> {
  const entes = await listarMunicipios({ uf: opcoes.uf });
  const municipios = entes
    .map(paraMunicipio)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return opcoes.limite !== undefined ? municipios.slice(0, opcoes.limite) : municipios;
}
