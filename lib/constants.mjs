// Só as constantes que a busca usa.

/** Tipos de nota que a busca pode devolver. `system` e `prompt` ficam de fora. */
export const RETRIEVABLE_TYPES = new Set(['rule', 'pattern', 'learning', 'decision', 'project']);

/** Campos em que um único termo já basta para a nota contar como candidata. */
export const STRONG_FIELDS = new Set(['title', 'description', 'keywords', 'aliases']);

/** Siglas de duas letras que não são descartadas pelo tamanho mínimo de termo. */
export const ACRONYMS = new Set(['ia', 'ui', 'ux', 'db', 'ci', 'cd', 'ts', 'js', 'qa', 'pr']);

/** Pedido feito só destas palavras ("ok", "pode seguir") não dispara busca. */
export const CONFIRM_WORDS = new Set([
  'ok', 'sim', 'nao', 'pode', 'seguir', 'segue', 'continua', 'continue', 'isso',
  'beleza', 'blz', 'valeu', 'obrigado', 'faz', 'manda', 'bora',
  'yes', 'no', 'go', 'proceed', 'thanks',
]);

const STOPWORDS_PT = [
  'a', 'ao', 'aos', 'aquela', 'aquele', 'aqui', 'as', 'ate', 'com', 'como', 'da', 'das', 'de',
  'dela', 'dele', 'depois', 'do', 'dos', 'e', 'ela', 'ele', 'em', 'entre', 'era', 'essa', 'esse',
  'esta', 'estao', 'este', 'eu', 'fazer', 'foi', 'isso', 'ja', 'la', 'mais', 'mas', 'me', 'mesmo',
  'meu', 'minha', 'muito', 'na', 'nao', 'nas', 'nem', 'no', 'nos', 'nossa', 'nosso', 'num', 'numa',
  'o', 'os', 'ou', 'para', 'pela', 'pelo', 'per', 'por', 'porque', 'qual', 'quando', 'que', 'quem',
  'se', 'sem', 'ser', 'seu', 'sua', 'so', 'tambem', 'tem', 'ter', 'teu', 'tua', 'um', 'uma', 'voce',
  'vou', 'estou', 'tinha', 'havia', 'sobre', 'entao', 'agora', 'ali', 'cada',
];

const STOPWORDS_EN = [
  'a', 'about', 'after', 'all', 'also', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because',
  'been', 'but', 'by', 'can', 'could', 'did', 'do', 'does', 'for', 'from', 'get', 'had', 'has',
  'have', 'how', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'let', 'like', 'make', 'may',
  'more', 'most', 'my', 'need', 'not', 'now', 'of', 'on', 'one', 'only', 'or', 'other', 'our',
  'out', 'over', 'please', 'same', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'them', 'then', 'there', 'these', 'they', 'this', 'those', 'to', 'up', 'use', 'used', 'using',
  'was', 'we', 'were', 'what', 'when', 'which', 'who', 'will', 'with', 'would', 'you', 'your',
];

export const STOPWORDS = new Set([...STOPWORDS_PT, ...STOPWORDS_EN]);

/** Orçamento do texto devolvido (cabeçalho + uma linha por nota), em bytes. */
export const INJECTION_MAX_BYTES = 1024;
