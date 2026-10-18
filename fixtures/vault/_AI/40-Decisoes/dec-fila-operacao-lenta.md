---
id: dec-fila-operacao-lenta
type: decision
status: approved
description: Operação acima de ~4 s responde 202 e vai para fila com worker. Decisão padrão para upload grande, IA e transcrição, em vez de segurar a request até o timeout.
keywords:
  - fila
  - worker
  - 202
  - assincrono
  - timeout
  - upload
  - request
  - resposta
aliases:
  - responder 202
  - resposta imediata
  - processar depois
  - tempo limite da request
  - background job
scope: global
updated: 2026-09-22
---
# Operações lentas vão para fila

## Contexto

Request que demora mais que o tempo limite do proxy estoura e o usuário
não recebe nada. Acontece em upload grande, transcrição e chamadas de IA.

## Decisão

Responder 202 com o id do job, enfileirar e processar em worker.

## Consequências

O cliente recebe uma resposta imediata e consulta o status depois
(ver pat-polling-limite).
