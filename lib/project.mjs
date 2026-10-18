import path from 'node:path';

/** Compara caminhos: absolutos, com barras normais e sem diferença de maiúsculas. */
export function normalizePathKey(alvo) {
  const resolvido = path.resolve(String(alvo)).replace(/\\/g, '/').toLowerCase();
  return resolvido.endsWith('/') ? resolvido.slice(0, -1) : resolvido;
}

/** Notas de projeto (`type: project`) com os caminhos de repositório que elas declaram. */
export function projectEntries(byId) {
  const entradas = [];
  for (const doc of byId.values()) {
    if (doc.type !== 'project') continue;
    const repos = (doc.repos ?? []).map((repo) => normalizePathKey(repo));
    if (repos.length > 0) entradas.push({ id: doc.id, repos });
  }
  return entradas;
}

/**
 * O projeto do pedido é o da nota cujo caminho de repositório é o prefixo mais
 * longo da pasta de trabalho (`cwd`). Sem projeto, notas `scope: project` não
 * entram no resultado.
 */
export function detectProject(cwd, entradas) {
  if (!cwd || entradas.length === 0) return null;
  const chave = normalizePathKey(cwd);
  let melhorId = null;
  let melhorTamanho = -1;
  for (const entrada of entradas) {
    for (const repo of entrada.repos) {
      const casa = chave === repo || chave.startsWith(`${repo}/`);
      if (casa && repo.length > melhorTamanho) {
        melhorId = entrada.id;
        melhorTamanho = repo.length;
      }
    }
  }
  return melhorId;
}
