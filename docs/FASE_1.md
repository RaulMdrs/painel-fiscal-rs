# Fase 1 — Cobertura e tração cívica

A Fase 0 entregou um MVP verificável: 5 municípios, 4 indicadores, ponta a ponta
(SICONFI → ingestão → SQLite → API → UI), com rastreabilidade de fonte e
tratamento honesto de dado ausente.

A Fase 1 tem dois objetivos:
1. **Cobertura** — deixar de ser "a página de Cachoeira do Sul" e virar "a
   página de qualquer município do RS".
2. **Tração cívica** — colocar o painel na frente de quem usa (jornalistas,
   vereadores, observatórios sociais).

As três melhorias anotadas no fim da Fase 0 pertencem todas a esta fase, porque
todas pressupõem muitos municípios ingeridos:
- Seleção da cidade em foco.
- Vizinhos recalculados conforme a cidade escolhida.
- Animação da régua de limites ao trocar de cidade.

---

## Sequência (a ordem importa)

### Tarefa 1.1 — Expandir a ingestão (pré-requisito de tudo)

Sem muitos municípios no banco, seletor e vizinhos dinâmicos não têm graça.
Este é o primeiro passo.

- Ingerir, no mínimo, uma região inteira; idealmente os ~497 municípios do RS.
- Reusar o pipeline da Fase 0 (o cálculo dos indicadores já está pronto e
  testado). O trabalho novo é de **escala**, não de lógica.
- Desafios reais esperados (todos já anteceipados pelo caso São Sepé):
  - Muitos municípios não terão publicado todos os relatórios → tratar como
    `sem_dados`, como já se faz. Em escala, isso vira um dado interessante por
    si: "quantos municípios do RS estão em dia com a publicação da LRF?".
  - Rate limiting da API do SICONFI em centenas de requisições → o retry com
    backoff já existe; pode precisar de throttle/paralelismo controlado.
  - Ingestão vira processo demorado → log de progresso e capacidade de retomar
    de onde parou (não reingerir tudo se cair no município 300).
- Idempotência já garantida pelo upsert; manter.

**Critério de aceite:** banco populado com uma região inteira (ou o RS todo),
com relatório de quantos municípios têm dados completos / parciais / nenhum.

### Tarefa 1.2 — Modelo de "vizinhança"

Decisão de produto antes de codar: **o que define um vizinho?**
- **Geográfico (limítrofes):** mais intuitivo para o cidadão. Requer dado de
  adjacência municipal (malhas do IBGE).
- **Regional (mesma microrregião / raio):** fácil se a região já estiver no
  cadastro do município.
- **Por porte (população parecida):** fiscalmente mais justo, menos intuitivo.

Recomendação: começar por **geográfico ou regional** (é o que o cidadão espera
de "vizinho"). Guardar a relação no modelo de dados.

**Critério de aceite:** dado um cod_ibge, o sistema retorna os vizinhos segundo
a regra escolhida, de forma testável.

### Tarefa 1.3 — Seletor de cidade + vizinhos dinâmicos (a mesma feature)

Escolher o foco e recalcular os vizinhos são duas faces do mesmo trabalho.

- Seletor de município (busca por nome, com autocomplete — são centenas).
- Ao escolher, a cidade vira o foco e os vizinhos são recalculados (Tarefa 1.2).
- Municípios sem dados aparecem no seletor mas sinalizados (não somem — a
  ausência é informação).
- URL deve refletir a cidade escolhida (ex.: `/municipio/4303004`) para ser
  compartilhável — um vereador manda o link da SUA cidade.

**Critério de aceite:** trocar de cidade no seletor recarrega foco + vizinhos
corretos; a URL é compartilhável; `sem_dados` bem tratado.

### Tarefa 1.4 — Animação da régua ao trocar de cidade (refinamento)

Independente; não bloqueia nada; fica por último.

- Ao trocar de cidade, a **marca do valor desliza** até a nova posição na régua
  de limites (51,3% / 54%). Movimento que ensina: mostra a mudança de posição
  relativa ao limite.
- **NÃO** animar números correndo (contador) — atrapalha leitura e cheira a
  firula. O valor troca direto; o que anima é a barra/posição.
- Respeitar `prefers-reduced-motion`: com movimento reduzido, a régua salta
  para a posição final sem transição (a cultura do projeto já faz isso).

**Critério de aceite:** transição suave da posição na régua ao trocar de cidade;
reduced-motion salta sem animar; sem números-contador.

---

## Depois da cobertura: tração

### Evolução do seletor: escolha por mapa

Marco planejado, não uma tarefa desta fase: evoluir o seletor de município da
Tarefa 1.3 (busca por nome com autocomplete) para um **mapa do RS clicável** —
o usuário clica no município no mapa para escolher o foco, em vez de (ou além
de) digitar o nome. É mais intuitivo pra quem já pensa geograficamente
("cadê minha cidade no mapa") do que pra quem já sabe o nome exato.

Depende de duas coisas que a busca por autocomplete não precisa:
- **Malhas municipais do IBGE** (polígonos de cada município, formato
  geoespacial) — fonte diferente da API de Localidades usada na Tarefa 1.2
  (que só dá nome/microrregião, sem geometria).
- Uma **biblioteca de mapa** no front-end (ex. Leaflet, Mapbox GL) — dependência
  nova, com peso de bundle e curva de aprendizado que não se justificam antes
  de o seletor básico existir.

Por isso fica **depois** do seletor por autocomplete (Tarefa 1.3): a busca por
nome já resolve o critério de aceite ("trocar de cidade recarrega foco +
vizinhos") sem essas duas dependências extras. O mapa é uma evolução de UX
sobre uma base que já funciona, não um bloqueador.

Com o RS coberto, o valor cívico aparece:
- Rankings ("municípios do RS mais próximos de estourar o limite de pessoal").
- Painel-resumo do estado ("X% dos municípios publicaram; Y estão acima do
  limite de pessoal").
- Levar a jornalistas locais, câmaras de vereadores, observatórios sociais.
  Uma matéria citando o painel, ou um vereador usando numa sessão, vale mais
  que qualquer divulgação.
- Candidatura ao Prêmio Tesouro Nacional (categoria de soluções em dados de
  finanças públicas) — o histórico de PRs bem documentado é parte do material.

## Princípios mantidos da Fase 0

- Uma tarefa = uma branch = um PR. Merge via PR, nunca local.
- Falhe alto: dado ausente é `sem_dados` explícito, nunca número inventado.
- Rastreabilidade da fonte em cada número — inegociável.
- Verificabilidade: novos cálculos, novo teste-oráculo contra valor oficial.
