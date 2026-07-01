# CLAUDE.md — contexto para o Claude Code

Este arquivo orienta o agente ao trabalhar neste repositório.

## O que é este projeto

Painel fiscal open source de municípios do RS (Brasil), consumindo a API de
dados abertos do SICONFI / Tesouro Nacional. Fase 0 = MVP verificável.
Ver `README.md` e `docs/PLANO_CLAUDE_CODE.md`.

## Princípios inegociáveis

1. **Verificabilidade acima de tudo.** Todo indicador fiscal exibido deve bater
   com o relatório oficial. Todo cálculo tem teste que valida contra um valor
   oficial conhecido (o relatório serve de oráculo).
2. **Falhe alto.** Dado ausente/inconsistente → erro explícito, nunca `NaN`
   silencioso nem `guard` que engole o problema. Um número fiscal errado na tela
   é pior que um espaço em branco honesto.
3. **`core` é puro.** Cálculo de indicadores não faz I/O. Fetch e cache ficam
   nas bordas (`siconfi/client`, `ingestion`).
4. **Não presuma o schema do SICONFI.** Sempre valide com Zod contra fixtures
   reais salvos em `data/fixtures/`. Se a API mudar, o teste de contrato quebra —
   isso é desejado.

## Convenções

- TypeScript estrito (`strict: true`), sem `any` implícito.
- Testes: Vitest.
- Commits: Conventional Commits em **português** (`feat:`, `fix:`, `test:`,
  `refactor:`, `chore:`, `docs:`).
- Uma tarefa do plano por branch; PRs pequenos e revisáveis.

## Fluxo esperado por tarefa

1. Ler a tarefa em `docs/PLANO_CLAUDE_CODE.md`.
2. Se o "certo" for verificável, escrever o teste primeiro.
3. Implementar até o teste passar e o critério de aceite ser satisfeito.
4. Rodar `pnpm test` e `tsc --noEmit` antes de considerar concluído.
5. Commit no padrão; não avançar de tarefa sem o critério de aceite verde.

## Fonte de dados

- Base: `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`
- Sem autenticação, sem captcha. Respeitar rate limit (retry com backoff).
- Endpoints principais: `/entes`, `/rreo`, `/rgf`.
- Municípios-alvo (confirmar cod_ibge na Tarefa 0): Cachoeira do Sul, Rio Pardo,
  Caçapava do Sul, São Sepé, Encruzilhada do Sul.
- ⚠️ `/rgf` exige `in_periodicidade=Q` e `co_poder=E` (município, Poder
  Executivo) além de `an_exercicio`, `nr_periodo`, `co_tipo_demonstrativo` e
  `id_ente`. Sem esses dois parâmetros, a API retorna `count: 0` **sem erro**
  — falha silenciosa. `/rreo` não precisa desses parâmetros extras.

## Fluxo de Git

- Uma tarefa = uma branch = um PR. NUNCA mergear em main localmente.
- Push só da branch de feature. O merge acontece via PR.
- main local só atualiza via git pull após o PR ser mergeado.
- Ao terminar uma tarefa: push da branch e parar. Não tocar na main.
