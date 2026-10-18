---
id: pat-srt-deslocar-tempo
type: pattern
status: approved
description: Ao deslocar ou exportar legenda SRT, some o offset em milissegundos e formate o tempo só na saída. Evita dessincronia acumulada entre as linhas.
keywords:
  - srt
  - legenda
  - deslocar
  - tempo
  - export
  - format
  - offset
  - sincronia
aliases:
  - deslocar legenda
  - dessincroniza
  - subtitle shift
  - srt export
  - time format
  - drift de legenda
scope: project
projects:
  - prj-editor
updated: 2026-09-22
---
# Deslocar e exportar legenda SRT

## Quando usar

Ao deslocar o tempo de uma legenda inteira ou exportar o arquivo SRT.

## Passos

1. Some o offset ao timecode em milissegundos, em inteiro.
2. Formate `HH:MM:SS,mmm` só na hora de escrever o arquivo.
3. Confira a última linha: é onde o drift aparece primeiro.

## Armadilhas

Formatar, somar e reinterpretar o texto a cada linha faz a legenda
dessincronizar aos poucos.
