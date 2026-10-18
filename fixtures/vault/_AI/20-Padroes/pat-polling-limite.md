---
id: pat-polling-limite
type: pattern
status: approved
description: Todo polling tem limite de tentativas, aviso ao usuário e limpeza do intervalo. Use ao consultar status de um processamento assíncrono.
keywords:
  - polling
  - interval
  - timeout
  - retry
  - status
  - tentativas
  - loop
  - waiting
aliases:
  - consultar status
  - setInterval
  - infinite loop
  - waiting for the job
  - retry limit
  - laço infinito
scope: global
updated: 2026-09-22
---
# Polling com limite

## Quando usar

Ao aguardar um processamento que pode nunca terminar.

## Passos

1. Defina o número máximo de tentativas e o intervalo entre elas.
2. A cada tentativa, consulte o status do job.
3. Ao chegar no limite, pare, limpe o interval e avise o usuário.

## Armadilhas

Sem limite, o loop fica infinito (infinite loop) e o interval continua
rodando depois que o componente sai da tela.
