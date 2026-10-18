# Avaliação exploratória da busca do Cérebro

[English version](README.en.md)

O Cérebro é uma base de notas de engenharia (regras, padrões, lições, decisões) que um assistente de programação consulta a cada pedido. A cada pedido, uma busca escolhe **no máximo três notas** que parecem relevantes, ou **não devolve nada** quando nenhuma combina bem o bastante.

Este repositório separa só essa busca e a avaliação dela, com um vault de 14 notas sintéticas, para que o resultado possa ser reproduzido por qualquer pessoa.

> **Estudo exploratório:** 10/10 casos positivos encontraram a nota esperada entre as três primeiras; 0/6 casos negativos devolveram alguma nota. Casos sintéticos escritos pelo autor. Ainda não medido em pedidos reais.

## Como rodar

Requer Node 24.

```
npm ci
npm run eval -- --dataset validacao
npm test
```

Outras opções do `bin/eval.mjs`:

| Comando | O que faz |
|---|---|
| `npm run eval -- --dataset calibracao` | roda o conjunto de calibração |
| `npm run eval -- --dataset validacao --detalhes` | mostra todos os casos: consulta, nota esperada, notas devolvidas com a pontuação e as candidatas antes dos filtros |
| `npm run eval -- --dataset calibracao --sugerir-piso` | varre valores de `minScore` na calibração e mostra o menor que passa |
| `npm run resultados` | regrava `resultados/validacao.*` e `resultados/calibracao.*` |

O comando sai com código 1 se o conjunto não passar no portão funcional (acerto no top 3 ≥ 0,80 e casos negativos com nota ≤ 0,10).

## Resultados

Saídas versionadas, caso a caso, em [`resultados/`](resultados/):

- [`resultados/validacao.md`](resultados/validacao.md) e `validacao.json`: 16 casos.
- [`resultados/calibracao.md`](resultados/calibracao.md) e `calibracao.json`: 24 casos, mais a varredura do piso.

| Conjunto | Casos positivos com a nota esperada no top 3 | Casos negativos que devolveram alguma nota |
|---|---|---|
| Validação | 10/10 | 0/6 |
| Calibração | 14/14 | 1/10 |

O erro da calibração é o caso negativo "qual o status do deploy de ontem?", que devolve `pat-polling-limite` com pontuação 18,74, logo acima do piso de 15. Ele foi escrito de propósito como um quase-acerto (a palavra "status" está numa keyword da nota) e é ele que define o piso: com 20, nenhum negativo da calibração passa; com 12 ou menos, três ou mais passam.

### O que as métricas medem

- **Acerto no top 3**: fração dos casos positivos em que a nota esperada está entre as até três notas devolvidas. Cada caso positivo tem **uma única** nota esperada (um teste confere isso), então não é recall no sentido de várias notas relevantes por consulta. No projeto original a mesma conta se chamava "recall@3"; aqui ganhou o nome do que de fato mede. O código continua aceitando mais de uma nota esperada: nesse caso o acerto exige todas.
- **Casos negativos que devolveram alguma nota**: fração dos casos sem nota esperada (`"expected": []`) em que a busca devolveu alguma coisa em vez de se abster.

## Calibração e validação

Os dois conjuntos estão em `eval/` e rodam contra o mesmo vault sintético (`fixtures/vault/`).

| Parâmetro | Valor | Como foi definido |
|---|---|---|
| `minScore` (pontuação mínima) | 15 | **Ajustado na calibração**: o menor valor da lista 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20 que mantém acerto no top 3 ≥ 0,80 e negativos com nota ≤ 0,10 (ver a varredura em `resultados/calibracao.md`) |
| Pesos por campo | título 3, keywords 2, aliases 2, descrição 2, aplica-se-quando 2, corpo 1 | Fixados na especificação, antes de qualquer medição; não foram ajustados com dados |
| Limite de notas | 3 | Fixado na especificação |
| Corte relativo | 0,5 × a melhor pontuação | Fixado na especificação |
| Bônus de nota do projeto atual | × 1,25 | Fixado na especificação |
| Prefixo / busca aproximada | termos com 5+ / 6+ letras, distância 0,2 | Fixado na especificação |

O conjunto de validação **não foi usado para escolher nenhum desses parâmetros**: o piso saiu só da calibração, e a validação foi rodada depois, como conferência.

Uma ressalva honesta: a validação não ficou totalmente cega. Na primeira medição, as notas sintéticas eram curtas (4 keywords e uma linha de corpo) e a validação dava 1/10 em qualquer piso. As notas foram então reescritas com aliases, sinônimos em inglês e corpo mais completo, que é como uma nota real se parece, e alguns desses aliases coincidem com palavras de casos da validação (por exemplo "money rounding", "invoice total", "srt export", "time format"). Ou seja, os parâmetros não foram ajustados com a validação, mas o **conteúdo das notas** foi escrito sabendo quais perguntas seriam feitas. Isso favorece o resultado e é mais um motivo para tratá-lo como exploratório. Na mesma rodada, a calibração ganhou quatro negativos de quase-acerto, porque com só negativos fáceis qualquer piso passava e a regra devolvia 0.

## Como a busca funciona e o que é de quem

A busca em si é do **[MiniSearch](https://github.com/lucaong/minisearch)** (7.2.0): índice invertido, pontuação BM25+ (parâmetros padrão da biblioteca), pesos por campo, prefixo e busca aproximada. O algoritmo de ranking não é criação do autor.

O trabalho do autor está em volta dele:

- **escolher e configurar** o MiniSearch: quais campos da nota indexar, os pesos de cada um, consulta em OR, prefixo e busca aproximada só para termos longos;
- **preparar o texto**: sem acentos, sem palavras vazias em português e inglês, identificadores como `parseFloat` também quebrados em partes, e segredos colados por engano (chaves de API, tokens) trocados por um marcador antes da busca, para não pesarem no resultado;
- **filtrar o ranking**: só notas aprovadas e de tipo consultável; notas de um projeto só quando o pedido vem daquele projeto (pela pasta de trabalho, `cwd`); notas `priority: must` ficam de fora porque já estão sempre no contexto;
- **o limiar**: pontuação mínima absoluta, corte relativo à melhor nota e um filtro estrutural (dois termos distintos casados, ou um termo em título, descrição, keywords ou aliases);
- **o limite de três notas** e um orçamento de 1.024 bytes para o texto devolvido;
- **abster-se quando nada combina**: se nenhuma nota passa, a busca não devolve nada, em vez de devolver a "menos ruim";
- **a avaliação**: os conjuntos de casos, a separação entre calibração e validação e as métricas.

## Limitações

- **Poucos casos, escritos pelo autor.** São 16 casos de validação (10 positivos, 6 negativos) e 24 de calibração, todos sintéticos e escritos por quem escreveu as notas e o código. Há viés: as perguntas tendem a usar as palavras que o autor já sabia que estavam nas notas. 10/10 e 0/6 é um portão funcional, não uma medida estatística.
- **Vault sintético e pequeno.** São 14 arquivos de nota, dos quais só 7 podem ser devolvidos pela busca. Com tão poucas notas, quase não há concorrência entre candidatas.
- **Ainda não há medição em pedidos reais.** O uso real já começou, mas ainda não tem amostra suficiente para dizer quanto a busca acerta fora destes casos.
- **Só palavras.** Não há busca por significado (embeddings); um pedido que descreve o problema com palavras que não estão na nota não a encontra.

## O que foi adaptado do projeto original

O código veio do Cérebro, onde a busca roda dentro de um gancho do assistente a cada pedido. Para este repositório:

- ficou só o necessário para a busca e a avaliação; saíram o gancho, o log, o painel, as propostas de nota, o cache do índice em disco e a configuração por arquivo do usuário. O índice agora é montado em memória e a avaliação não grava nada fora de `resultados/`;
- saiu o período de espera entre pedidos da mesma sessão (cada caso da avaliação já rodava com sessão limpa, então o resultado não muda) e o reconhecimento de avisos internos do assistente;
- a detecção de projeto não tenta mais `git` quando o caminho não casa (os caminhos dos casos são fictícios);
- a linha de cada nota devolvida traz o caminho relativo ao vault em vez do absoluto, para o orçamento de bytes não depender da máquina;
- as métricas ganharam nomes que dizem o que medem, e o `eval` passou a gerar a saída caso a caso;
- os caminhos de projeto nos casos e nas notas viraram genéricos (`/projetos/editor`), e a nota do projeto de exemplo ficou genérica.

## Estrutura

```
bin/eval.mjs            roda um conjunto, mostra e grava os resultados
lib/evaluate.mjs        métricas, critério por caso e varredura do piso
lib/retrieve.mjs        consulta ao MiniSearch, filtros, limiar e abstenção
lib/index.mjs           monta o índice MiniSearch a partir do vault
lib/text.mjs            tokenização e normalização dos termos
lib/redact.mjs          redação de segredos antes da busca
lib/project.mjs         descobre o projeto pela pasta de trabalho
lib/notes.mjs, lib/frontmatter.mjs   leitura das notas
lib/config.mjs, lib/constants.mjs    parâmetros
eval/                   validacao.json (16 casos) e calibracao.json (24 casos)
fixtures/vault/         14 notas sintéticas
resultados/             saída caso a caso, versionada
test/                   testes (node --test)
```

Em `fixtures/vault/`, só a pasta `_AI/` é indexada. As notas em `_AI-Inbox/` (proposta e rejeitada), em `_Fontes/` e as de tipo `system`, `prompt` ou `priority: must` existem para provar que a busca nunca as devolve.

## Licença

MIT. Veja [LICENSE](LICENSE).
