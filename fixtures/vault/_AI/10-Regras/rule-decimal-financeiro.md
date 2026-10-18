---
id: rule-decimal-financeiro
type: rule
status: approved
description: Nunca converter Decimal para Number no meio de cálculo financeiro; converter só na serialização. Vale para soma de valores monetários, total de fatura e imposto.
keywords:
  - decimal
  - financeiro
  - prisma
  - arredondamento
  - monetarios
  - centavos
  - parseFloat
  - fatura
aliases:
  - valores monetários
  - total da fatura
  - money rounding
  - invoice total
  - cent rounding
  - ponto flutuante
scope: global
updated: 2026-09-22
---
# Decimal em cálculo financeiro

## Regra

Mantenha o tipo Decimal do início ao fim da operação.

## Por quê

Number é ponto flutuante binário: `0.1 + 0.2` não dá `0.3`. Em valores
monetários o erro aparece como um centavo a mais ou a menos no total,
e cresce a cada soma.

## Não faça

`parseFloat(valor)`, `Number(valor)` ou `+valor` antes de somar preço,
desconto, imposto ou total de fatura.

## Faça

Some com o Decimal e converta para string só na resposta HTTP.
