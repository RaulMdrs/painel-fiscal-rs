import { redirect } from "next/navigation";

/**
 * Default provisório: a home leva ao painel de Cachoeira do Sul (o foco da
 * Fase 0). É só um ponto de entrada — no futuro esta rota pode virar uma tela
 * de busca ("encontre seu município") em vez de um município fixo. Ideia
 * registrada para não se perder; ver docs/FASE_1.md.
 */
const COD_IBGE_PADRAO = 4303004;

export default function Home() {
  redirect(`/municipio/${COD_IBGE_PADRAO}`);
}
