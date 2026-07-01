# Stack — Painel Fiscal RS

Escolhas priorizando: (1) aproveitar seu domínio existente, (2) simplicidade de
rodar local, (3) custo de hospedagem baixo/zero na Fase 0, (4) caminho de
evolução claro para as fases seguintes.

## Linguagem: TypeScript ponta a ponta

Você já domina TS. Um só idioma no backend e no front reduz atrito e deixa o
Claude Code mais eficiente (um só conjunto de convenções). Também facilita
compartilhar tipos entre a camada de dados e a UI (ex.: o tipo `IndicadorFiscal`
é o mesmo dos dois lados).

## Backend / ingestão

- **Runtime:** Node.js (LTS).
- **Framework HTTP:** Hono ou Fastify — leves, rápidos, ótimos com TS. (Hono
  tem a vantagem de rodar igual em Node, edge e serverless, o que ajuda na
  Fase 3.)
- **Cliente HTTP:** `fetch` nativo. A API do SICONFI é REST/JSON puro.
- **Validação de schema:** **Zod** — crucial aqui. Os dados do SICONFI variam
  entre entes e períodos; Zod valida a resposta da API antes de confiar nela,
  e falha alto quando o schema muda.

## Cache / persistência

- **SQLite** (via `better-sqlite3` ou Drizzle ORM com SQLite).
- Motivo: a Fase 0 não precisa de Postgres. SQLite é um arquivo, roda em
  qualquer lugar, e o volume (5 municípios × poucos períodos) é trivial.
- Caminho de evolução: Drizzle permite trocar para Postgres na Fase 1/2 com
  mudança mínima, quando forem 497 municípios com ingestão agendada.

## Front-end

- **Next.js** (React + TS). Você já tem experiência com React/TS.
- **Gráficos:** **Recharts** — declarativo, integra bem com React, suficiente
  para linhas, barras e comparativos. (Alternativa: Visx, mais poderoso e mais
  verboso — deixe para depois se precisar.)
- **Estilo:** Tailwind CSS. Rápido de iterar; a lição do OpenGov é que
  **clareza visual é o diferencial**, então vale investir no design dos
  gráficos, não em CSS artesanal.

## Hospedagem (Fase 0)

- **Front + API:** Vercel (free tier) — deploy automático do Next.js.
- **Cache:** na Fase 0 o SQLite pode ser gerado num passo de build/seed. Quando
  a ingestão virar agendada (Fase 1), migra para um banco gerenciado.

## Testes

- **Vitest** — rápido, TS-nativo, mesma ergonomia do Jest.
- Dois níveis:
  1. **Unit:** cálculo de cada indicador a partir de um fixture de resposta
     da API (determinístico, roda offline).
  2. **Contrato/integração:** bate na API real do SICONFI e valida que o
     schema ainda é o esperado (Zod). Roda separado (pode ser lento / depende
     de rede).

## Estrutura de pastas (proposta)

```
painel-fiscal-rs/
├── packages/
│   ├── core/            # tipos compartilhados, cálculo de indicadores (puro)
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   ├── indicadores/
│   │   │   │   ├── rcl.ts
│   │   │   │   ├── despesaPessoal.ts
│   │   │   │   ├── endividamento.ts
│   │   │   │   └── execucaoOrcamentaria.ts
│   │   │   └── siconfi/
│   │   │       ├── client.ts      # wrapper da API SICONFI
│   │   │       ├── schemas.ts     # schemas Zod das respostas
│   │   │       └── entes.ts       # códigos IBGE dos municípios-alvo
│   │   └── tests/
│   ├── ingestion/       # busca do SICONFI → grava no cache
│   └── web/             # Next.js (UI + API routes)
├── docs/
│   ├── STACK.md
│   └── PLANO_CLAUDE_CODE.md
├── data/                # cache SQLite (gitignored) + fixtures (versionados)
└── README.md
```

Monorepo simples (workspaces do npm/pnpm). Se achar excessivo para a Fase 0,
comece com uma pasta única `src/` e separe em packages quando doer — mas a
separação `core` puro (cálculo testável, sem I/O) vs. resto é a que **mais
importa manter desde o início**, porque é o que garante o critério de sucesso.
