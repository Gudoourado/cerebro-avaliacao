import fs from 'node:fs';
import path from 'node:path';
import { parseNote } from './frontmatter.mjs';

const TRAVADO = ['EBUSY', 'EPERM', 'EACCES'];

export function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entradas = fs.readdirSync(dir, { recursive: true, withFileTypes: true });
  const arquivos = [];
  for (const entrada of entradas) {
    if (!entrada.isFile()) continue;
    if (!entrada.name.toLowerCase().endsWith('.md')) continue;
    arquivos.push(path.join(entrada.parentPath ?? entrada.path, entrada.name));
  }
  return arquivos.sort();
}

export function readNoteFile(arquivo) {
  let texto;
  let stat;
  try {
    stat = fs.statSync(arquivo);
    texto = fs.readFileSync(arquivo, 'utf8');
  } catch (erro) {
    return {
      path: arquivo,
      ok: false,
      locked: TRAVADO.includes(erro.code),
      error: erro.message,
      data: {},
      body: '',
    };
  }
  const nota = parseNote(texto);
  return {
    path: arquivo,
    id: path.basename(arquivo, '.md'),
    ok: nota.ok,
    error: nota.error,
    data: nota.data,
    body: nota.body,
    text: texto,
    size: stat.size,
    mtimeMs: stat.mtimeMs,
  };
}

export function scanDir(dir) {
  const notes = [];
  const invalid = [];
  const locked = [];
  for (const arquivo of listMarkdownFiles(dir)) {
    const nota = readNoteFile(arquivo);
    if (nota.locked) {
      locked.push({ path: arquivo, error: nota.error });
      continue;
    }
    if (!nota.ok) {
      invalid.push({ path: arquivo, error: nota.error });
      continue;
    }
    notes.push(nota);
  }
  return { notes, invalid, locked };
}
