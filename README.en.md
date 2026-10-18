# Exploratory evaluation of Cérebro's note search

[Versão em português](README.md)

Cérebro is a base of engineering notes (rules, patterns, lessons, decisions) that a coding assistant checks on every request. For each request, a search picks **at most three notes** that look relevant, or **returns nothing** when none matches well enough.

This repository isolates just that search and its evaluation, using a vault of 14 synthetic notes, so anyone can reproduce the result.

> **Exploratory study:** 10/10 positive cases found the expected note among the top three; 0/6 negative cases returned any note. Synthetic cases written by the author. Not yet measured on real requests.

The code, datasets and result files are in Portuguese (identifiers, case prompts, CLI flags). The datasets also include some English prompts.

## How to run

Requires Node 24.

```
npm ci
npm run eval -- --dataset validacao
npm test
```

Other `bin/eval.mjs` options:

| Command | What it does |
|---|---|
| `npm run eval -- --dataset calibracao` | runs the calibration set |
| `npm run eval -- --dataset validacao --detalhes` | shows every case: query, expected note, returned notes with their scores, and the candidates before filtering |
| `npm run eval -- --dataset calibracao --sugerir-piso` | sweeps `minScore` values on the calibration set and shows the lowest one that passes |
| `npm run resultados` | rewrites `resultados/validacao.*` and `resultados/calibracao.*` |

The command exits with code 1 if the set fails the functional gate (top-3 hit rate ≥ 0.80 and negative cases returning a note ≤ 0.10).

## Results

Versioned, case-by-case output in [`resultados/`](resultados/):

- [`resultados/validacao.md`](resultados/validacao.md) and `validacao.json`: 16 cases (validation).
- [`resultados/calibracao.md`](resultados/calibracao.md) and `calibracao.json`: 24 cases (calibration), plus the threshold sweep.

| Set | Positive cases with the expected note in the top 3 | Negative cases that returned any note |
|---|---|---|
| Validation | 10/10 | 0/6 |
| Calibration | 14/14 | 1/10 |

The calibration miss is the negative case "qual o status do deploy de ontem?" ("what's the status of yesterday's deploy?"), which returns `pat-polling-limite` with a score of 18.74, just above the threshold of 15. It was written on purpose as a near miss (the word "status" is a keyword of that note), and it is the case that sets the threshold: at 20, no calibration negative gets through; at 12 or below, three or more do.

### What the metrics measure

- **Top-3 hit rate**: the share of positive cases where the expected note is among the (up to three) returned notes. Each positive case has **a single** expected note (a test checks this), so this is not recall in the sense of several relevant notes per query. The original project called the same number "recall@3"; here it is named for what it actually measures. The code still accepts more than one expected note, in which case a hit requires all of them.
- **Negative cases that returned any note**: the share of cases with no expected note (`"expected": []`) where the search returned something instead of abstaining.

## Calibration and validation

Both sets live in `eval/` and run against the same synthetic vault (`fixtures/vault/`).

| Parameter | Value | How it was set |
|---|---|---|
| `minScore` (score threshold) | 15 | **Tuned on the calibration set**: the lowest value in 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20 that keeps the top-3 hit rate ≥ 0.80 and negatives returning a note ≤ 0.10 (see the sweep in `resultados/calibracao.md`) |
| Field weights | title 3, keywords 2, aliases 2, description 2, applies-when 2, body 1 | Fixed in the specification before any measurement; not tuned on data |
| Note limit | 3 | Fixed in the specification |
| Relative cutoff | 0.5 × the best score | Fixed in the specification |
| Current-project note boost | × 1.25 | Fixed in the specification |
| Prefix / fuzzy search | terms with 5+ / 6+ letters, distance 0.2 | Fixed in the specification |

The validation set **was not used to choose any of these parameters**: the threshold came from the calibration set only, and validation was run afterwards, as a check.

An honest caveat: validation was not fully blind. In the first measurement, the synthetic notes were short (4 keywords and a one-line body) and validation scored 1/10 at any threshold. The notes were then rewritten with aliases, English synonyms and a fuller body, which is what a real note looks like, and some of those aliases match words from validation cases (for example "money rounding", "invoice total", "srt export", "time format"). In other words, the parameters were not tuned on validation, but the **content of the notes** was written knowing which questions would be asked. That favors the result and is one more reason to treat it as exploratory. In the same round, the calibration set gained four near-miss negatives, because with only easy negatives any threshold passed and the rule returned 0.

## How the search works, and who did what

The search itself is **[MiniSearch](https://github.com/lucaong/minisearch)** (7.2.0): inverted index, BM25+ scoring (the library's default parameters), per-field weights, prefix and fuzzy matching. The ranking algorithm is not the author's creation.

The author's work is around it:

- **choosing and configuring** MiniSearch: which note fields to index, their weights, OR queries, prefix and fuzzy matching only for long terms;
- **preparing the text**: accents removed, Portuguese and English stopwords dropped, identifiers such as `parseFloat` also split into parts, and secrets pasted by mistake (API keys, tokens) replaced with a placeholder before the search so they don't weigh on the result;
- **filtering the ranking**: only approved notes of a searchable type; project notes only when the request comes from that project (by working directory, `cwd`); `priority: must` notes are left out because they are always in context already;
- **the threshold**: an absolute minimum score, a cutoff relative to the best note, and a structural filter (two distinct matched terms, or one term in the title, description, keywords or aliases);
- **the three-note limit** and a 1,024-byte budget for the returned text;
- **abstaining when nothing matches**: if no note passes, the search returns nothing instead of the "least bad" note;
- **the evaluation**: the case sets, the split between calibration and validation, and the metrics.

## Limitations

- **Few cases, written by the author.** There are 16 validation cases (10 positive, 6 negative) and 24 calibration cases, all synthetic and written by the person who wrote the notes and the code. There is bias: the questions tend to use words the author already knew were in the notes. 10/10 and 0/6 is a functional gate, not a statistical measurement.
- **Small synthetic vault.** There are 14 note files, of which only 7 can be returned by the search. With so few notes, there is almost no competition between candidates.
- **No measurement on real requests yet.** Real use has started, but there is not yet enough sample to say how well the search does outside these cases.
- **Words only.** There is no semantic search (embeddings); a request that describes the problem with words that are not in the note won't find it.

## What was adapted from the original project

The code comes from Cérebro, where the search runs inside an assistant hook on every request. For this repository:

- only what the search and the evaluation need was kept; the hook, the log, the dashboard, note proposals, the on-disk index cache and the user's config file were removed. The index is now built in memory and the evaluation writes nothing outside `resultados/`;
- the cooldown between requests in the same session was removed (each evaluation case already ran with a clean session, so the result doesn't change), as was the handling of the assistant's internal notifications;
- project detection no longer falls back to `git` when the path doesn't match (the case paths are fictional);
- each returned note's line carries the path relative to the vault instead of the absolute path, so the byte budget doesn't depend on the machine;
- the metrics were renamed for what they measure, and `eval` now produces case-by-case output;
- project paths in the cases and notes were made generic (`/projetos/editor`), and the example project note was made generic.

## Layout

```
bin/eval.mjs            runs a set, prints and saves the results
lib/evaluate.mjs        metrics, per-case criterion and threshold sweep
lib/retrieve.mjs        MiniSearch query, filters, threshold and abstention
lib/index.mjs           builds the MiniSearch index from the vault
lib/text.mjs            tokenization and term normalization
lib/redact.mjs          secret redaction before the search
lib/project.mjs         finds the project from the working directory
lib/notes.mjs, lib/frontmatter.mjs   note reading
lib/config.mjs, lib/constants.mjs    parameters
eval/                   validacao.json (16 cases) and calibracao.json (24 cases)
fixtures/vault/         14 synthetic notes
resultados/             versioned case-by-case output
test/                   tests (node --test)
```

In `fixtures/vault/`, only the `_AI/` folder is indexed. The notes in `_AI-Inbox/` (a proposal and a rejected one), in `_Fontes/`, and those of type `system`, `prompt` or `priority: must` exist to prove that the search never returns them.
