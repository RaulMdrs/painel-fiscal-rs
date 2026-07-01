# Notas de reconhecimento da API SICONFI (Tarefa 0)

Fixtures salvos aqui foram obtidos com requisições reais em 2026-07-01,
base `https://apidatalake.tesouro.gov.br/ords/siconfi/tt/`.

## Municípios-alvo (cod_ibge confirmado via `/entes`)

| Município            | cod_ibge |
|-----------------------|----------|
| Cachoeira do Sul       | 4303004  |
| Rio Pardo              | 4315701  |
| Caçapava do Sul        | 4302808  |
| São Sepé               | 4319604  |
| Encruzilhada do Sul    | 4306908  |

`entes_municipios_alvo.json` — resposta filtrada de `/entes` só com esses 5.
Formato: `{items: [...], hasMore, limit, offset, count}`. Cada item tem
`cod_ibge, ente, capital, regiao, uf, esfera, exercicio, populacao, cnpj`.
Nota: `/entes` sem `an_exercicio` retorna o ano corrente (2026 no momento da
consulta), não o ano do relatório — não usar `populacao`/`exercicio` desse
endpoint como se fosse do período do RREO/RGF.

## RREO — `rreo_4303004_2024_p6.json`

Query: `an_exercicio=2024&nr_periodo=6&co_tipo_demonstrativo=RREO&id_ente=4303004`
(sem parâmetros extras — funciona direto).

Formato: `{items: [...]}`, cada item:
```
{ exercicio, demonstrativo, periodo, periodicidade, instituicao, cod_ibge, uf,
  populacao, anexo, esfera, rotulo, coluna, cod_conta, conta, valor }
```
2302 linhas, sem paginação (`hasMore: false`). Anexos presentes: 01, 02, 03,
04, 06, 07, 09, 11, 14 (nem todos os 14 anexos do RREO vêm sempre — depende
do que o ente publicou).

**RCL (Receita Corrente Líquida)** → `anexo: "RREO-Anexo 03"`,
`cod_conta: "RREO3ReceitaCorrenteLiquida"` (conta = "RECEITA CORRENTE LÍQUIDA
(III) = (I - II)"), coluna `"TOTAL (ÚLTIMOS 12 MESES)"` = valor da RCL do
período. Cuidado: existem várias variantes de RCL nesse anexo (ajustada para
endividamento, ajustada para despesa com pessoal) — usar o `cod_conta` exato,
não o rótulo.

**Execução orçamentária (previsto x realizado)** → `anexo: "RREO-Anexo 01"`.
Colunas por conta: `PREVISÃO INICIAL`, `PREVISÃO ATUALIZADA (a)`,
`No Bimestre (b)`, `% (b/a)`, `Até o Bimestre (c)`, `% (c/a)`, `SALDO (a-c)`.
Contas-resumo úteis: `TotalReceitas` / `TotalDespesas` (totais gerais),
`ReceitasExcetoIntraOrcamentarias` / `DespesasExcetoIntraOrcamentarias`.

## RGF — `rgf_4303004_2024_p3.json`

⚠️ **Ponto de atenção importante**: `/rgf` com só
`an_exercicio&nr_periodo&co_tipo_demonstrativo&id_ente` retorna **vazio**
(count=0), diferente do `/rreo`. RGF exige também:
- `in_periodicidade` — `Q` (quadrimestral, usado por municípios) ou `S`
  (semestral). Testado: só `Q` retornou dados para Cachoeira do Sul.
- `co_poder` — `E` (Executivo) ou `L` (Legislativo). Necessário separar, pois
  o RGF é publicado por poder.

Query usada: `an_exercicio=2024&in_periodicidade=Q&nr_periodo=3&co_tipo_demonstrativo=RGF&co_poder=E&id_ente=4303004`
(3º quadrimestre = período mais completo do ano, "Até o 3º Quadrimestre").

Formato: `{items: [...]}`, cada item:
```
{ exercicio, periodo, periodicidade, instituicao, cod_ibge, uf, co_poder,
  populacao, anexo, esfera, rotulo, coluna, cod_conta, conta, valor }
```
514 linhas, sem paginação. Anexos presentes: 01 a 06.

**Despesa com pessoal vs. limite LRF (54%)** → `anexo: "RGF-Anexo 01"`.
- `cod_conta: "DespesaComPessoalTotal"` (DTP), colunas `Valor` e
  `"% sobre a RCL Ajustada"` — **este último já é o percentual oficial**
  (40.33% para Cachoeira do Sul, 3º quadrimestre 2024) → oráculo do teste.
- `cod_conta: "LimiteMaximoDespesaComPessoalTotal"`, coluna
  `"% sobre a RCL Ajustada"` = 54 (o limite da LRF, confirmando a constante).
- `cod_conta: "ReceitaCorrenteLiquidaAjustada"`, coluna `Valor` = RCL ajustada
  usada como denominador nesse cálculo (não confundir com a RCL "crua" do
  RREO Anexo 03 — são ajustes diferentes).

**Endividamento (DCL / RCL)** → `anexo: "RGF-Anexo 02"`.
- `cod_conta: "DividaConsolidadaLiquida"` (DCL) e
  `cod_conta: "PercentualDaDCLSobreARCL"` — **o percentual já vem calculado
  no relatório**, oráculo direto do teste.
- Colunas por período acumulado: `"SALDO DO EXERCÍCIO ANTERIOR"`,
  `"Até o 1º Quadrimestre"`, `"Até o 2º Quadrimestre"`,
  `"Até o 3º Quadrimestre"` (para `in_periodicidade=Q`).
- `cod_conta: "LimiteDefinidoPorResolucaoDoSenadoFederal"` = limite de
  endividamento em R$ (não percentual).

## Decisão pendente para Tarefa 2

Os valores de `coluna` mudam de nome conforme o anexo/demonstrativo
(`"TOTAL (ÚLTIMOS 12 MESES)"`, `"Até o Bimestre (c)"`, `"Até o 3º
Quadrimestre"` etc.) — o schema Zod deve validar `coluna` como string livre
(não enum fechado) e o client deve filtrar por `cod_conta` + `coluna` exata
por indicador, documentando a combinação em cada função `extrair*`.
