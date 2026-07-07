import { describe, expect, it } from "vitest";
import { buscarRGF, buscarRREO, listarEntes } from "../../src/siconfi/client.js";

const CACHOEIRA_DO_SUL = 4303004;

describe.skipIf(process.env.SICONFI_INTEGRATION !== "1")(
  "integração real com a API do SICONFI (depende de rede, roda só com SICONFI_INTEGRATION=1)",
  () => {
    it("listarEntes bate com o schema atual da API", async () => {
      const entes = await listarEntes();
      expect(entes.length).toBeGreaterThan(0);
    });

    it("buscarRREO bate com o schema atual da API", async () => {
      const itens = await buscarRREO({
        anExercicio: 2024,
        nrPeriodo: 6,
        idEnte: CACHOEIRA_DO_SUL,
      });
      expect(itens.length).toBeGreaterThan(0);
    });

    it("buscarRGF bate com o schema atual da API", async () => {
      const itens = await buscarRGF({
        anExercicio: 2024,
        nrPeriodo: 3,
        idEnte: CACHOEIRA_DO_SUL,
      });
      expect(itens.length).toBeGreaterThan(0);
    });
  },
);
