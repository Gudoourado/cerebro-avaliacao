import YAML from 'yaml';

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

export function normalizeText(text) {
  let conteudo = String(text);
  if (conteudo.charCodeAt(0) === 0xfeff) conteudo = conteudo.slice(1);
  return conteudo.replace(/\r\n/g, '\n');
}

export function parseNote(text) {
  const conteudo = normalizeText(text);
  const achado = conteudo.match(FRONTMATTER_RE);
  if (!achado) {
    return { ok: false, error: 'frontmatter ausente', data: {}, body: conteudo };
  }
  const corpo = conteudo.slice(achado[0].length);
  let data;
  try {
    data = YAML.parse(achado[1]) ?? {};
  } catch (erro) {
    return { ok: false, error: `YAML inválido: ${erro.message}`, data: {}, body: corpo };
  }
  if (typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'frontmatter não é um mapa de campos', data: {}, body: corpo };
  }
  return { ok: true, data, body: corpo };
}

export function noteTitle(nota) {
  const achado = nota.body?.match(/^#\s+(.+)$/m);
  if (achado) return achado[1].trim();
  return String(nota.data?.id ?? '');
}
