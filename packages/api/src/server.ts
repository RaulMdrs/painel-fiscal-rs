import { serve } from "@hono/node-server";
import { criarApp } from "./app.js";
import { conectarBancoReal } from "./db.js";

const PORTA = Number(process.env["PORT"] ?? 3001);

const { db } = conectarBancoReal();
const app = criarApp(db);

serve({ fetch: app.fetch, port: PORTA }, (info) => {
  console.log(`API rodando em http://localhost:${info.port}`);
  console.log(`  GET /municipios?ano=2024`);
  console.log(`  GET /municipios/:ibge/indicadores?ano=2024`);
  console.log(`  GET /municipios/:ibge/vizinhos?ano=2024&criterio=regional`);
});
