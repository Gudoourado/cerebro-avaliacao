# Resultado caso a caso: calibracao

Gerado por `node bin/eval.mjs --dataset calibracao --salvar`, com os parâmetros de `lib/config.mjs`.
Pontuação: a do MiniSearch (BM25+ com peso por campo), multiplicada por 1,25 em nota do projeto do pedido.

- Acerto no top 3: 14/14 casos positivos
- Casos negativos que devolveram alguma nota: 1/10

| # | Consulta | cwd | Nota esperada | Notas devolvidas (pontuação) | Melhores candidatas antes dos filtros | Resultado |
|---|---|---|---|---|---|---|
| 1 | preciso corrigir o cálculo financeiro que está arredondando errado no prisma |  | rule-decimal-financeiro | rule-decimal-financeiro (135,13) | rule-decimal-financeiro (135,13) | acerto |
| 2 | posso converter Decimal para Number antes de somar? |  | rule-decimal-financeiro | rule-decimal-financeiro (232,27) | rule-decimal-financeiro (232,27) | acerto |
| 3 | como evitar drift no timecode do srt? | /projetos/editor | pat-srt-deslocar-tempo | pat-srt-deslocar-tempo (191,21) | pat-srt-deslocar-tempo (191,21) | acerto |
| 4 | o upload de mp4 veio com mime vazio, o que fazer? | /projetos/editor/src | lrn-mp4-mime-vazio | lrn-mp4-mime-vazio (384,79) | lrn-mp4-mime-vazio (384,79), dec-fila-operacao-lenta (12,73) | acerto |
| 5 | quero implementar polling para aguardar a transcrição |  | pat-polling-limite | pat-polling-limite (53,17) | pat-polling-limite (53,17), dec-fila-operacao-lenta (20,78) | acerto |
| 6 | o polling está rodando para sempre, como limitar as tentativas? |  | pat-polling-limite | pat-polling-limite (126,99) | pat-polling-limite (126,99), dec-fila-operacao-lenta (2,05) | acerto |
| 7 | essa operação demora uns 10 segundos, devo responder o que? |  | dec-fila-operacao-lenta | dec-fila-operacao-lenta (55,18) | dec-fila-operacao-lenta (55,18), rule-decimal-financeiro (2,46) | acerto |
| 8 | vale a pena usar fila com worker para o processamento pesado? |  | dec-fila-operacao-lenta | dec-fila-operacao-lenta (74,03) | dec-fila-operacao-lenta (74,03), pat-polling-limite (21,71), rule-decimal-financeiro (4,55) | acerto |
| 9 | como fazemos transcrição assíncrona com 202 accepted? |  | dec-fila-operacao-lenta | dec-fila-operacao-lenta (89,90) | dec-fila-operacao-lenta (89,90), pat-polling-limite (2,54) | acerto |
| 10 | preciso de um retry com backoff no interval do angular |  | pat-polling-limite | pat-polling-limite (55,44) | pat-polling-limite (55,44) | acerto |
| 11 | where is the rule about decimal rounding in financial code? |  | rule-decimal-financeiro | rule-decimal-financeiro (62,34) | rule-decimal-financeiro (62,34) | acerto |
| 12 | subtitle timecode drifting after shift | /projetos/editor | pat-srt-deslocar-tempo | pat-srt-deslocar-tempo (46,72) | pat-srt-deslocar-tempo (46,72) | acerto |
| 13 | o que fazer quando o navegador manda octet-stream no upload de vídeo | /projetos/editor | lrn-mp4-mime-vazio | lrn-mp4-mime-vazio (383,34) | lrn-mp4-mime-vazio (383,34), dec-fila-operacao-lenta (12,73) | acerto |
| 14 | qual o padrão para operações lentas na api? |  | dec-fila-operacao-lenta | dec-fila-operacao-lenta (85,36) | dec-fila-operacao-lenta (85,36) | acerto |
| 15 | qual a melhor receita de bolo de cenoura |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 16 | me ajuda a escolher um nome para o gato |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 17 | como está o clima em são paulo hoje? |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 18 | renomeia esse componente para UserCard |  | (nenhuma) | (nenhuma) | pat-polling-limite (2,65) | acerto |
| 19 | roda os testes de novo e me mostra o resultado |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 20 | atualiza a versão do pacote no package.json |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 21 | o ponto de entrada do app mudou de lugar |  | (nenhuma) | (nenhuma) | rule-decimal-financeiro (7,70) | acerto |
| 22 | coloca um loop simples nesse script de build |  | (nenhuma) | (nenhuma) | pat-polling-limite (13,97) | acerto |
| 23 | qual o status do deploy de ontem? |  | (nenhuma) | pat-polling-limite (18,74) | pat-polling-limite (18,74), dec-fila-operacao-lenta (2,05) | erro |
| 24 | preciso de um service worker para cache offline |  | (nenhuma) | (nenhuma) | dec-fila-operacao-lenta (14,16) | acerto |

## Varredura do piso (minScore)

| minScore | Acerto no top 3 | Negativos com nota | Passa (>= 0,80 e <= 0,10) |
|---|---|---|---|
| 0 | 1,00 | 0,40 | não |
| 1 | 1,00 | 0,40 | não |
| 2 | 1,00 | 0,40 | não |
| 3 | 1,00 | 0,40 | não |
| 4 | 1,00 | 0,40 | não |
| 5 | 1,00 | 0,40 | não |
| 6 | 1,00 | 0,40 | não |
| 8 | 1,00 | 0,30 | não |
| 10 | 1,00 | 0,30 | não |
| 12 | 1,00 | 0,30 | não |
| 15 | 1,00 | 0,10 | sim |
| 20 | 1,00 | 0,00 | sim |
