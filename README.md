# Painel Fiscal RS

Ferramenta open source que torna a saúde fiscal de municípios do interior do RS
**legível e comparável** — para o cidadão entender, o vereador fiscalizar e a
prefeitura pequena se gerir sem depender de consultoria cara.

Fonte de dados: **API de Dados Abertos do SICONFI / Tesouro Nacional**
(`https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`), sem captcha e sem
autenticação.

---

## Escopo da Fase 0 (MVP)

O objetivo desta fase **não é o negócio**, é ter algo real e verificável rodando.

- **Municípios:** Cachoeira do Sul + 3–4 vizinhos (Rio Pardo, Caçapava do Sul,
  São Sepé, Encruzilhada do Sul).
- **Indicadores (4):**
  1. Receita Corrente Líquida (RCL)
  2. Despesa com Pessoal vs. limite da LRF (54%)
  3. Nível de endividamento (Dívida Consolidada Líquida / RCL)
  4. Execução orçamentária (previsto vs. realizado)
- **Fontes SICONFI:** RREO (Relatório Resumido de Execução Orçamentária) e
  RGF (Relatório de Gestão Fiscal).

## Critério de sucesso (inegociável)

> O número exibido no painel **bate** com o relatório oficial publicado pela
> prefeitura / disponível no SICONFI.

Se bate, o projeto tem credibilidade. Se não bate, é bug. Todos os cálculos de
indicador têm teste que valida contra um valor oficial conhecido (ver
`tests/`).

## Arquitetura (visão)

```
[SICONFI API] → [ingestion] → [cache local / SQLite] → [API própria] → [web UI]
                    │                                        │
              valida schema                            gráficos claros
              ao vivo                                   + rankings
```

## Stack

Ver `docs/STACK.md`. Resumo: TypeScript ponta a ponta (aproveita seu domínio de
TS), backend leve, front com gráficos, SQLite para cache. Escolha pensada para
ser simples de rodar localmente e barata de hospedar.

## Como começar

Este repositório foi estruturado para ser desenvolvido **com o Claude Code**.
O plano de execução está em `docs/PLANO_CLAUDE_CODE.md` — são tarefas
incrementais, cada uma com critério de aceite e teste. Comece pela Tarefa 0.

## Licença

MIT (ver `LICENSE`). Dado público continua público.
