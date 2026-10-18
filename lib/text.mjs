import { STOPWORDS, ACRONYMS } from './constants.mjs';

const WORD_RE = /[\p{L}\p{N}]+/gu;
const PASTED_MARKER_RE = /^<\/?pasted_content[^>]*>\s*$/gmu;

export function stripDiacritics(text) {
  return String(text).normalize('NFD').replace(/\p{M}/gu, '');
}

export function stripPastedMarkers(text) {
  return String(text).replace(PASTED_MARKER_RE, ' ');
}

function splitIdentifier(token) {
  const partes = [token];
  const separado = token
    .replace(/([\p{Ll}\p{N}])(\p{Lu})/gu, '$1 $2')
    .replace(/(\p{Lu}+)(\p{Lu}\p{Ll})/gu, '$1 $2')
    .replace(/(\p{L})(\p{N})/gu, '$1 $2')
    .replace(/(\p{N})(\p{L})/gu, '$1 $2')
    .split(' ')
    .filter(Boolean);
  if (separado.length > 1) partes.push(...separado);
  return partes;
}

export function tokenize(text) {
  const fonte = stripPastedMarkers(text);
  const saida = [];
  for (const achado of fonte.matchAll(WORD_RE)) {
    for (const parte of splitIdentifier(achado[0])) saida.push(parte);
  }
  return saida;
}

export function normalizeTerm(term) {
  const termo = stripDiacritics(String(term)).toLowerCase();
  if (!termo) return false;
  if (termo.length < 3 && !ACRONYMS.has(termo)) return false;
  if (STOPWORDS.has(termo)) return false;
  return termo;
}

export function normalizedTerms(text) {
  const saida = [];
  for (const bruto of tokenize(text)) {
    const termo = normalizeTerm(bruto);
    if (termo) saida.push(termo);
  }
  return saida;
}

export function lowerTokens(text) {
  return tokenize(text).map((token) => stripDiacritics(token).toLowerCase());
}

/**
 * Corta prompt gigante guardando o começo e o fim.
 *
 * É ponto fixo para o mesmo `maxChars`: cortar o já cortado devolve texto
 * idêntico. Assim, reexecutar a busca com o texto guardado num caso mede o
 * mesmo que a consulta original mediu.
 */
export function clampPrompt(text, maxChars) {
  const texto = String(text);
  if (texto.length <= maxChars) return texto;
  const inicio = Math.floor(maxChars * 0.8);
  const fim = maxChars - inicio;
  return `${texto.slice(0, inicio)}\n…\n${texto.slice(texto.length - fim)}`;
}

export function queryTermsFrom(prompt, { maxChars, maxTerms, vocabulary } = {}) {
  const texto = clampPrompt(prompt, maxChars ?? 20000);
  const contagem = new Map();
  for (const termo of normalizedTerms(texto)) {
    contagem.set(termo, (contagem.get(termo) ?? 0) + 1);
  }
  let termos = [...contagem.keys()];
  const limite = maxTerms ?? 64;
  if (termos.length > limite) {
    const conhecidos = vocabulary ? termos.filter((t) => vocabulary.has(t)) : [];
    const base = conhecidos.length > 0 ? conhecidos : termos;
    termos = base
      .sort((a, b) => (contagem.get(b) - contagem.get(a)) || a.localeCompare(b))
      .slice(0, limite);
  }
  return termos;
}

/** Usado pelo MiniSearch: a separação de identificadores já aconteceu em `tokenize`. */
export function processTerm(term) {
  return normalizeTerm(term);
}
