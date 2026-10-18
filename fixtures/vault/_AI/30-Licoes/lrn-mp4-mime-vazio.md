---
id: lrn-mp4-mime-vazio
type: learning
status: approved
description: Arquivo mp4 pode chegar com MIME vazio ou octet-stream no navegador; validar pela extensão antes do tipo ao receber vídeo do usuário.
keywords:
  - mp4
  - mime
  - upload
  - octet-stream
  - video
  - validacao
  - arquivo
  - extensao
aliases:
  - validar arquivo de vídeo
  - tipo do arquivo enviado
  - empty mime type
  - file upload validation
scope: project
projects:
  - prj-editor
updated: 2026-09-22
---
# MIME vazio em mp4

## Sintoma

`f.type` vem como string vazia, ou `application/octet-stream`, para um
mp4 escolhido pelo usuário.

## Causa

O navegador só preenche o tipo quando reconhece o contêiner; em alguns
sistemas o mp4 não é reconhecido.

## Correção

Valide a extensão do arquivo primeiro e use o MIME só como reforço.
