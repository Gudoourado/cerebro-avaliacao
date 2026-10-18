import path from 'node:path';
import MiniSearch from 'minisearch';
import { noteTitle } from './frontmatter.mjs';
import { scanDir } from './notes.mjs';
import { normalizeTerm, processTerm, tokenize } from './text.mjs';

/** Campos indexados. O peso de cada um é aplicado na consulta (config.boost). */
const CAMPOS = ['title', 'description', 'keywords', 'aliases', 'appliesWhen', 'body'];

export function getMiniSearchOptions() {
  return {
    idField: 'id',
    fields: CAMPOS,
    storeFields: ['id', 'description', 'type', 'status', 'scope', 'projects', 'repos', 'priority', 'updated', 'path'],
    tokenize,
    processTerm,
  };
}

function comoLista(valor) {
  if (Array.isArray(valor)) return valor.map((item) => String(item));
  if (valor === undefined || valor === null || valor === '') return [];
  return [String(valor)];
}

export function toDocument(nota, base) {
  const dados = nota.data ?? {};
  const caminho = base ? path.relative(base, nota.path) : nota.path;
  return {
    id: String(dados.id ?? nota.id),
    title: noteTitle(nota),
    description: String(dados.description ?? ''),
    keywords: comoLista(dados.keywords).join(' '),
    aliases: comoLista(dados.aliases).join(' '),
    appliesWhen: comoLista(dados.applies_when).join(' '),
    body: nota.body ?? '',
    type: String(dados.type ?? ''),
    status: String(dados.status ?? ''),
    scope: String(dados.scope ?? 'global'),
    projects: comoLista(dados.projects),
    repos: comoLista(dados.repos),
    priority: String(dados.priority ?? 'should'),
    updated: String(dados.updated ?? ''),
    path: caminho.replace(/\\/g, '/'),
  };
}

function vocabularioDe(documentos) {
  const vocabulario = new Set();
  for (const doc of documentos) {
    for (const campo of CAMPOS) {
      for (const bruto of tokenize(doc[campo] ?? '')) {
        const termo = normalizeTerm(bruto);
        if (termo) vocabulario.add(termo);
      }
    }
  }
  return vocabulario;
}

/** Índice só em memória: a avaliação não grava nada em disco. */
export function buildIndex(notas, base) {
  const documentos = notas.map((nota) => toDocument(nota, base));
  const mini = new MiniSearch(getMiniSearchOptions());
  mini.addAll(documentos);
  return {
    mini,
    documentos,
    byId: new Map(documentos.map((doc) => [doc.id, doc])),
    vocabulary: vocabularioDe(documentos),
  };
}

/**
 * Indexa só a pasta `_AI` do vault (as notas aprovadas). `_AI-Inbox` (propostas
 * e rejeitadas) e `_Fontes` ficam fora do índice de propósito.
 */
export function loadIndex(vaultDir) {
  const { notes, invalid } = scanDir(path.join(vaultDir, '_AI'));
  return { ...buildIndex(notes, vaultDir), invalid };
}
