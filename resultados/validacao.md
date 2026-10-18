# Resultado caso a caso: validacao

Gerado por `node bin/eval.mjs --dataset validacao --salvar`, com os parâmetros de `lib/config.mjs`.
Pontuação: a do MiniSearch (BM25+ com peso por campo), multiplicada por 1,25 em nota do projeto do pedido.

- Acerto no top 3: 10/10 casos positivos
- Casos negativos que devolveram alguma nota: 0/6

| # | Consulta | cwd | Nota esperada | Notas devolvidas (pontuação) | Melhores candidatas antes dos filtros | Resultado |
|---|---|---|---|---|---|---|
| 1 | estou somando valores monetários e o centavo não bate |  | rule-decimal-financeiro | rule-decimal-financeiro (112,02) | rule-decimal-financeiro (112,02) | acerto |
| 2 | posso usar parseFloat no total da fatura? |  | rule-decimal-financeiro | rule-decimal-financeiro (304,43) | rule-decimal-financeiro (304,43), pat-polling-limite (2,00) | acerto |
| 3 | a legenda dessincroniza depois de deslocar o tempo | /projetos/editor | pat-srt-deslocar-tempo | pat-srt-deslocar-tempo (405,01) | pat-srt-deslocar-tempo (405,01), dec-fila-operacao-lenta (7,14) | acerto |
| 4 | validação do arquivo de vídeo enviado pelo usuário | /projetos/editor/src/app | lrn-mp4-mime-vazio | lrn-mp4-mime-vazio (318,99) | lrn-mp4-mime-vazio (318,99), pat-polling-limite (5,25), pat-srt-deslocar-tempo (3,21), dec-fila-operacao-lenta (1,61) | acerto |
| 5 | ficar consultando o status até terminar é boa ideia? |  | pat-polling-limite | pat-polling-limite (42,79) | pat-polling-limite (42,79), dec-fila-operacao-lenta (2,05) | acerto |
| 6 | a request está estourando o tempo limite no upload grande |  | dec-fila-operacao-lenta | dec-fila-operacao-lenta (275,89) | dec-fila-operacao-lenta (275,89), pat-polling-limite (20,81) | acerto |
| 7 | como devolver uma resposta imediata e processar depois |  | dec-fila-operacao-lenta | dec-fila-operacao-lenta (85,71) | dec-fila-operacao-lenta (85,71), rule-decimal-financeiro (1,86) | acerto |
| 8 | money rounding is off by one cent in the invoice total |  | rule-decimal-financeiro | rule-decimal-financeiro (192,47) | rule-decimal-financeiro (192,47) | acerto |
| 9 | infinite loop while waiting for the job to finish |  | pat-polling-limite | pat-polling-limite (161,60) | pat-polling-limite (161,60), dec-fila-operacao-lenta (5,89) | acerto |
| 10 | srt export time format | /projetos/editor | pat-srt-deslocar-tempo | pat-srt-deslocar-tempo (318,88) | pat-srt-deslocar-tempo (318,88) | acerto |
| 11 | escreve um haiku sobre o inverno |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 12 | qual a capital da austrália |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 13 | arruma a indentação desse arquivo |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
| 14 | cria um componente de botão com variantes |  | (nenhuma) | (nenhuma) | pat-polling-limite (2,65) | acerto |
| 15 | faz commit do que está pronto |  | (nenhuma) | (nenhuma) | rule-decimal-financeiro (2,89) | acerto |
| 16 | explica o que esse regex faz |  | (nenhuma) | (nenhuma) | (nenhuma) | acerto |
