# Plano de execução com Claude Code — Fase 0

Este é o roteiro para construir o MVP **com** o Claude Code, no estilo
"defina o comportamento esperado → escreva o teste → deixe o agente iterar até
passar". Cada tarefa é pequena, tem **critério de aceite** verificável e, quando
faz sentido, um **teste** que deve ficar verde antes de seguir.

Trabalhe **uma tarefa por vez**, em branches separadas, com commits em
Conventional Commits (em pt-BR, como você já faz). Não deixe o agente pular para
a próxima tarefa sem o critério de aceite satisfeito.

---

## Tarefa 0 — Reconhecimento da API (fazer ANTES de codar)

**Por quê:** a documentação do SICONFI é renderizada por JS e os schemas variam.
Antes de escrever qualquer parser, confirme os endpoints e o formato real.

**O que pedir ao Claude Code:**
> Faça requisições reais aos endpoints do SICONFI e me mostre a estrutura da
> resposta JSON. Endpoints a investigar (base
> `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`):
> - `/entes` — lista de entes federativos (achar o cod_ibge de Cachoeira do Sul)
> - `/rreo?an_exercicio=2024&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=<cod_ibge>`
> - `/rgf?an_exercicio=2024&nr_periodo=3&co_tipo_demonstrativo=RGF&id_ente=<cod_ibge>`
> Salve exemplos de resposta reais em `data/fixtures/` para usar como base dos
> schemas Zod e dos testes unitários.

**Critério de aceite:**
- [ ] Fixtures reais de RREO e RGF salvos em `data/fixtures/`.
- [ ] Você identificou, na resposta, **onde** estão os campos de: RCL, despesa
      com pessoal, dívida consolidada líquida, receita/despesa prevista e
      realizada. (Anote os `cod_conta` / rótulos exatos — eles são a parte
      chata e crítica.)
- [ ] Confirmado o `cod_ibge` (7 dígitos) de cada município-alvo.

> ⚠️ Ponto de atenção: os relatórios do SICONFI têm anexos e contas
> específicas. A RCL, por exemplo, aparece em um anexo próprio do RREO. Não
> presuma o nome da conta — confirme no fixture real.

---

## Tarefa 1 — Setup do monorepo e do package `core`

**O que pedir:** inicializar o monorepo (pnpm workspaces), TypeScript estrito,
Vitest, e o package `core` vazio com `types.ts`.

**Critério de aceite:**
- [ ] `pnpm test` roda (mesmo sem testes ainda) sem erro de config.
- [ ] `tsc --noEmit` passa com `strict: true`.
- [ ] Tipos base definidos: `Municipio`, `Periodo`, `IndicadorFiscal`,
      `ResultadoIndicador` (com `valor`, `unidade`, `fonte`, `periodo`).

---

## Tarefa 2 — Cliente SICONFI + schemas Zod

**O que pedir:** implementar `siconfi/client.ts` (funções `buscarRREO`,
`buscarRGF`, `listarEntes`) e `siconfi/schemas.ts` validando as respostas com
Zod, com base nos fixtures da Tarefa 0.

**Critério de aceite:**
- [ ] Teste de contrato: parsear cada fixture com o schema Zod **passa**.
- [ ] O client trata paginação da API (o SICONFI pagina com `offset`/`limit`).
- [ ] Rate limiting básico / retry com backoff (a API às vezes é lenta).
- [ ] Teste que, dado um fixture, o client extrai a lista de itens corretamente.

---

## Tarefa 3 — Cálculo dos 4 indicadores (o coração)

Este é o package `core/indicadores`, **puro** (sem I/O). É aqui que mora o
critério de sucesso do projeto.

**O que pedir, um indicador por vez:**

### 3a — Despesa com Pessoal vs. limite LRF
> Implemente `calcularDespesaPessoal(rgf)` que retorna o % da despesa total com
> pessoal sobre a RCL e a comparação com o limite de 54% (Poder Executivo
> municipal). Baseie-se no fixture RGF real.

**Teste:** dado o fixture de Cachoeira do Sul, o % calculado bate (tolerância de
centavos/arredondamento) com o valor publicado no próprio RGF, que já traz esse
percentual calculado — **use o valor oficial do relatório como oráculo do teste.**

### 3b — Receita Corrente Líquida
> `extrairRCL(rreo | rgf)` — a RCL é publicada; o trabalho é localizá-la na
> conta certa e expor de forma limpa.

**Teste:** valor bate com o relatório oficial.

### 3c — Endividamento (DCL / RCL)
### 3d — Execução orçamentária (realizado / previsto)

**Critério de aceite geral da Tarefa 3:**
- [ ] Cada indicador tem teste unitário validando contra valor oficial conhecido.
- [ ] Funções são puras: recebem dados já parseados, não fazem fetch.
- [ ] Cobrem o caso de dado ausente/incompleto (retornam erro explícito, não
      `NaN` silencioso — lição do seu bug do guard silencioso: falhe alto).

---

## Tarefa 4 — Ingestão + cache SQLite

**O que pedir:** package `ingestion` que busca RREO/RGF dos 5 municípios para
os períodos-alvo e grava num SQLite (Drizzle). Idempotente (rodar de novo não
duplica).

**Critério de aceite:**
- [ ] `pnpm ingest` popula o banco a partir da API real.
- [ ] Rodar duas vezes não duplica registros.
- [ ] Log claro do que foi buscado e de falhas por município/período.

---

## Tarefa 5 — API própria

**O que pedir:** endpoints que servem os indicadores já calculados a partir do
cache. Ex.: `GET /municipios`, `GET /municipios/:ibge/indicadores?ano=2024`.

**Critério de aceite:**
- [ ] Respostas tipadas (mesmos tipos do `core`).
- [ ] Teste de integração: subir a API, chamar endpoint, validar shape.

---

## Tarefa 6 — UI: painel comparativo

**O que pedir:** página Next.js que mostra os 5 municípios lado a lado nos 4
indicadores, com gráficos Recharts. Foco em **clareza** (a lição OpenGov).

**Critério de aceite:**
- [ ] Um município selecionável + comparação com vizinhos.
- [ ] Cada indicador com contexto visual (ex.: barra de despesa com pessoal
      mostrando a linha dos 54%; verde/amarelo/vermelho por proximidade do
      limite).
- [ ] Cada número tem link/nota "fonte: SICONFI, RREO 6º bim 2024" — rastreável.
- [ ] Deploy na Vercel funcionando.

---

## Tarefa 7 — Verificação final de credibilidade

**O que pedir:** um script/checklist que, para cada indicador de cada município,
compara o valor do painel com o valor do relatório oficial e reporta divergências.

**Critério de aceite:**
- [ ] Relatório de conferência gerado; divergências = 0 (ou explicadas por
      arredondamento documentado).

> Quando a Tarefa 7 estiver verde, você tem o MVP da Fase 0: **real, público e
> verificável.** É o ponto de publicar no GitHub e começar a mostrar para
> jornalistas / vereadores locais (início da Fase 1).

---

## Dicas de workflow com o Claude Code

- **Escreva o teste primeiro** quando o "certo" for verificável (indicadores).
  É o padrão que vimos na Fireworks e é perfeito aqui, porque a fonte oficial
  é o oráculo.
- **Uma branch por tarefa**, PRs pequenos, no seu padrão Conventional Commits
  em pt-BR (`feat:`, `fix:`, `test:`, `chore:`).
- **Não deixe o agente presumir schema.** A Tarefa 0 existe justamente para
  ancorar tudo em dado real.
- **Falhe alto:** dado fiscal errado exibido é pior que dado ausente. Sem
  `NaN`/guard silencioso — erro explícito sempre.
