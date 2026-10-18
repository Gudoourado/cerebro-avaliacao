import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULTS } from '../lib/config.mjs';
import { caseOk, runDataset, suggestThreshold } from '../lib/evaluate.mjs';
import { loadIndex } from '../lib/index.mjs';
import { retrieve } from '../lib/retrieve.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const VAULT = path.join(RAIZ, 'fixtures', 'vault');

function carregar(nome) {
  return JSON.parse(fs.readFileSync(path.join(RAIZ, 'eval', `${nome}.json`), 'utf8'));
}

function vaultTemporario() {
  const destino = fs.mkdtempSync(path.join(os.tmpdir(), 'avaliacao-vault-'));
  fs.cpSync(VAULT, destino, { recursive: true });
  return destino;
}

test('cada positivo tem uma única nota esperada (por isso a métrica é "acerto no top 3")', () => {
  for (const nome of ['validacao', 'calibracao']) {
    for (const caso of carregar(nome)) {
      assert.ok((caso.expected ?? []).length <= 1, `${nome}: "${caso.prompt}"`);
    }
  }
});

test('o mesmo caso repetido dá o mesmo resultado (sem estado entre casos)', () => {
  const casos = [
    { prompt: 'cálculo financeiro com decimal no prisma', expected: ['rule-decimal-financeiro'] },
    { prompt: 'cálculo financeiro com decimal no prisma', expected: ['rule-decimal-financeiro'] },
  ];
  const r = runDataset({ casos, vaultDir: VAULT, config: DEFAULTS });
  assert.equal(r.acertosPositivos, 2);
});

test('conjunto de validação passa no portão funcional', () => {
  const r = runDataset({ casos: carregar('validacao'), vaultDir: VAULT, config: DEFAULTS });
  assert.equal(r.positivos, 10);
  assert.equal(r.negativos, 6);
  assert.ok(r.acertoTop3 >= 0.8, `acerto no top 3 ficou em ${r.acertoTop3}`);
  assert.ok(r.negativosComNota <= 0.1, `negativos com nota ficou em ${r.negativosComNota}`);
});

test('o piso sugerido sai da calibração e é o que está em uso', () => {
  const sugestao = suggestThreshold({ casos: carregar('calibracao'), vaultDir: VAULT, config: DEFAULTS });
  assert.equal(sugestao.passa, true);
  assert.equal(sugestao.minScore, DEFAULTS.minScore);
});

test('nunca devolve mais de 3 notas', () => {
  const { mini, vocabulary } = loadIndex(VAULT);
  const r = retrieve({
    prompt: 'decimal fatura polling timeout fila worker upload mp4 mime legenda srt',
    mini, vocabulary, projectId: 'prj-editor', config: { ...DEFAULTS, minScore: 0, relativeCutoff: 0 },
  });
  assert.ok(r.injected.length <= 3);
});

test('propostas, rejeitadas, fontes e notas must nunca são devolvidas', () => {
  const { mini, vocabulary } = loadIndex(VAULT);
  const proibidas = ['lrn-proposta-exemplo', 'lrn-rejeitada', 'src-artigo', 'rule-tenant-scoped-writes', 'rule-srt-timecode-int'];
  for (const prompt of ['proposta de exemplo', 'rejeitada', 'tenantId no updateMany multi-tenant', 'timecode srt drift legenda']) {
    const r = retrieve({ prompt, mini, vocabulary, projectId: 'prj-editor', config: { ...DEFAULTS, minScore: 0 } });
    for (const id of proibidas) assert.ok(!r.injected.includes(id), `${id} veio para "${prompt}"`);
  }
});

test('nota de projeto só aparece quando o pedido vem daquele projeto', () => {
  const { mini, vocabulary } = loadIndex(VAULT);
  const prompt = 'a legenda dessincroniza depois de deslocar o tempo';
  const fora = retrieve({ prompt, mini, vocabulary, projectId: null, config: DEFAULTS });
  const dentro = retrieve({ prompt, mini, vocabulary, projectId: 'prj-editor', config: DEFAULTS });
  assert.ok(!fora.injected.includes('pat-srt-deslocar-tempo'));
  assert.ok(dentro.injected.includes('pat-srt-deslocar-tempo'));
});

test('segredo no pedido é redigido antes da busca', () => {
  const { mini, vocabulary } = loadIndex(VAULT);
  const r = retrieve({
    prompt: 'o polling usa token=abcd1234efgh e ' + ['ghp', '0123456789abcdefABCDEF'].join('_'),
    mini, vocabulary, projectId: null, config: DEFAULTS,
  });
  assert.ok(!r.query.includes('abcd1234efgh'));
  assert.ok(!r.query.includes('0123456789abcdefABCDEF'));
  assert.deepEqual(r.redactions.sort(), ['GITHUB_TOKEN', 'SEGREDO']);
});

test('vault sintético de 300 notas responde rápido', () => {
  const vaultDir = vaultTemporario();
  for (let i = 0; i < 300; i += 1) {
    fs.writeFileSync(path.join(vaultDir, '_AI', '30-Licoes', `lrn-sintetica-${i}.md`), [
      '---', `id: lrn-sintetica-${i}`, 'type: learning', 'status: approved',
      `description: Lição sintética ${i} sobre assunto ${i % 20} para medir desempenho.`,
      'keywords:', `  - assunto${i % 20}`, `  - termo${i % 7}`,
      'scope: global', 'updated: 2026-09-22', '---', `# Sintética ${i}`, '', 'Corpo.', '',
    ].join('\n'));
  }
  const casos = carregar('validacao');
  const inicio = Date.now();
  runDataset({ casos, vaultDir, config: DEFAULTS });
  const porCaso = (Date.now() - inicio) / casos.length;
  fs.rmSync(vaultDir, { recursive: true, force: true });
  assert.ok(porCaso < 800, `média de ${porCaso.toFixed(0)} ms por caso`);
});

test('nota com BOM e CRLF é lida; frontmatter quebrado fica fora do índice', () => {
  const vaultDir = vaultTemporario();
  fs.writeFileSync(path.join(vaultDir, '_AI', '30-Licoes', 'lrn-bom-crlf.md'),
    '﻿---\r\nid: lrn-bom-crlf\r\ntype: learning\r\nstatus: approved\r\n'
    + 'description: Nota gravada com BOM e CRLF para testar a leitura.\r\nkeywords:\r\n  - bom\r\n  - crlf\r\n'
    + 'scope: global\r\nupdated: 2026-09-22\r\n---\r\n# BOM e CRLF\r\n\r\nCorpo.\r\n');
  fs.writeFileSync(path.join(vaultDir, '_AI', '30-Licoes', 'lrn-frontmatter-quebrado.md'),
    '---\nid: lrn-frontmatter-quebrado\ntype: [learning\nstatus: approved\n---\n# Quebrada\n');
  const indice = loadIndex(vaultDir);
  fs.rmSync(vaultDir, { recursive: true, force: true });
  assert.ok(indice.byId.has('lrn-bom-crlf'));
  assert.ok(!indice.byId.has('lrn-frontmatter-quebrado'));
  assert.equal(indice.invalid.length, 1);
});

test('caseOk: positivo exige a esperada; negativo exige nenhuma nota', () => {
  assert.equal(caseOk({ esperados: ['a'], devolvidas: ['a', 'b'] }), true);
  assert.equal(caseOk({ esperados: ['a', 'c'], devolvidas: ['a'] }), false);
  assert.equal(caseOk({ esperados: [], devolvidas: [] }), true);
  assert.equal(caseOk({ esperados: [], devolvidas: ['a'] }), false);
});

test('runDataset aceita índice pronto e marca acerto por caso', () => {
  const indice = loadIndex(VAULT);
  const casos = [
    { prompt: 'cálculo financeiro com decimal no prisma', expected: ['rule-decimal-financeiro'] },
    { prompt: 'cálculo financeiro com decimal no prisma', expected: ['pat-polling-limite'] },
  ];
  const r = runDataset({ casos, config: DEFAULTS, index: indice });
  assert.equal(r.porCaso[0].ok, true);
  assert.equal(r.porCaso[1].ok, false);
  assert.equal(typeof r.porCaso[0].devolvidas[0].score, 'number');
});
