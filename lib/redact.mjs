/**
 * Redação de segredo colado por engano.
 *
 * Roda **antes da busca**, não antes do log. Se produção buscasse o texto cru e
 * o replay buscasse o redigido, o caso de avaliação mediria uma distribuição
 * diferente da real. Fazendo o texto sanitizado ser a entrada canônica da
 * recuperação, ao vivo e no replay são a mesma string.
 *
 * E é conceitualmente melhor: uma chave secreta não deveria pesar em qual nota
 * recuperar. Tirar a sequência aleatória costuma até ajudar o BM25, porque
 * remove um termo sem valor semântico — enquanto o marcador tipado preserva o
 * que importava ("isto era um token do GitHub").
 *
 * Isto é camada a mais, nunca garantia: nenhum detector pega tudo. Se houver
 * indício de que um segredo vazou, o certo é rotacionar o segredo.
 *
 * Nada aqui usa entropia sozinha como sinal. Num cérebro de programação isso
 * massacraria hash, UUID, base64 de exemplo e id de nota — ver os testes.
 */

export const REDACTION_VERSION = 1;

const PADROES = [
  // Blocos e cabeçalhos: alta confiança, pegam antes de tudo.
  { tipo: 'CHAVE_PRIVADA', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g },
  { tipo: 'AUTORIZACAO', re: /(Authorization\s*:\s*)(Bearer|Basic|Token)\s+[\w\-._~+/=]{8,}/gi, guarda: 1 },

  // Formatos de provedor: o prefixo é a evidência.
  { tipo: 'GITHUB_TOKEN', re: /\bgh[pousr]_[A-Za-z0-9]{16,}\b/g },
  { tipo: 'GITHUB_TOKEN', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g },
  { tipo: 'GITLAB_TOKEN', re: /\bglpat-[A-Za-z0-9\-_]{16,}\b/g },
  { tipo: 'SLACK_TOKEN', re: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
  { tipo: 'OPENAI_KEY', re: /\bsk-(?:proj-|ant-)?[A-Za-z0-9\-_]{20,}\b/g },
  { tipo: 'STRIPE_KEY', re: /\b[sprk]k_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { tipo: 'GOOGLE_KEY', re: /\bAIza[A-Za-z0-9\-_]{30,}\b/g },
  { tipo: 'AWS_KEY', re: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g },
  { tipo: 'JWT', re: /\beyJ[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\.[A-Za-z0-9\-_]{10,}\b/g },

  // Credencial dentro de string de conexão: o host fica, que não é segredo.
  { tipo: 'SENHA', re: /([a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:)([^\s@/]{3,})(?=@)/gi, guarda: 1 },

  // Contexto forte: sem formato conhecido, mas o nome do campo entrega.
  {
    tipo: 'SEGREDO',
    re: /\b(pass(?:word|wd)?|senha|secret|client_secret|api[_-]?key|access_token|refresh_token|token)\b(\s*[:=]\s*)(["']?)([^\s"',;]{4,})\3/gi,
    guarda: 3,
  },
];

/**
 * @returns {{text: string, detections: string[]}} `detections` traz só os tipos
 * encontrados, nunca os valores.
 */
export function redactSecrets(texto) {
  let saida = String(texto ?? '');
  const achados = [];
  const marcadorPorValor = new Map();
  const contagemPorTipo = new Map();

  for (const { tipo, re, guarda } of PADROES) {
    saida = saida.replace(re, (casamento, ...grupos) => {
      // Com `guarda`, os grupos antes dele são prefixo que deve sobreviver
      // (o nome do campo, o "Authorization:", o "postgres://user:").
      const prefixo = guarda ? grupos.slice(0, guarda).join('') : '';
      const valor = guarda ? casamento.slice(prefixo.length) : casamento;
      if (marcadorPorValor.has(valor)) return prefixo + marcadorPorValor.get(valor);

      const anteriores = contagemPorTipo.get(tipo) ?? 0;
      contagemPorTipo.set(tipo, anteriores + 1);
      if (anteriores === 0) achados.push(tipo);

      const marcador = `<SEGREDO:${tipo}>`;
      marcadorPorValor.set(valor, marcador);
      return prefixo + marcador;
    });
  }

  // Só numera quando há mais de um valor distinto do mesmo tipo: caso comum
  // fica legível, e o caso raro continua distinguindo um segredo do outro.
  for (const [tipo, quantos] of contagemPorTipo) {
    if (quantos < 2) continue;
    let indice = 0;
    saida = saida.replace(new RegExp(`<SEGREDO:${tipo}>`, 'g'), () => {
      indice += 1;
      return `<SEGREDO:${tipo}:${indice}>`;
    });
  }

  return { text: saida, detections: achados };
}
