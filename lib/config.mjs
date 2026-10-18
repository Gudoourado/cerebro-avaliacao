import { INJECTION_MAX_BYTES } from './constants.mjs';

/**
 * Parâmetros da busca. São os mesmos valores padrão do Cérebro original.
 * O README diz quais foram ajustados com o conjunto de calibração e quais foram
 * fixados antes de qualquer medição.
 */
export const DEFAULTS = {
  maxResults: 3,
  maxBytes: INJECTION_MAX_BYTES,
  maxQueryChars: 20000,
  maxQueryTerms: 64,
  minScore: 15,
  relativeCutoff: 0.5,
  projectBoost: 1.25,
  boost: { title: 3, keywords: 2, aliases: 2, description: 2, appliesWhen: 2, body: 1 },
  prefixMinLen: 5,
  fuzzyMinLen: 6,
  fuzzy: 0.2,
};
