import { loadIndex } from './index.mjs';
import { detectProject, projectEntries } from './project.mjs';
import { retrieve } from './retrieve.mjs';

/**
 * Critério por caso. Positivo: acerta quando todas as notas esperadas estão
 * entre as devolvidas (no máximo 3). Negativo (`expected: []`): acerta quando
 * nada é devolvido.
 */
export function caseOk({ esperados, devolvidas }) {
  return esperados.length === 0
    ? devolvidas.length === 0
    : esperados.every((id) => devolvidas.includes(id));
}

/**
 * Roda um conjunto de casos. As métricas:
 * - `acertoTop3`: fração dos casos positivos em que a nota esperada veio entre
 *   as até três devolvidas. Cada caso positivo destes conjuntos tem uma única
 *   nota esperada, por isso não é chamado de recall.
 * - `negativosComNota`: fração dos casos negativos que devolveram alguma nota.
 */
export function runDataset({ casos, vaultDir, config, index }) {
  const { mini, byId, vocabulary } = index ?? loadIndex(vaultDir);
  const entradas = projectEntries(byId);
  const porCaso = [];
  let positivos = 0;
  let acertosPositivos = 0;
  let negativos = 0;
  let negativosComNota = 0;

  for (const caso of casos) {
    const projectId = caso.cwd ? detectProject(caso.cwd, entradas) : null;
    const resultado = retrieve({ prompt: caso.prompt, mini, vocabulary, projectId, config });
    const esperados = caso.expected ?? [];
    const devolvidas = resultado.injected.map((id) => ({ id, score: resultado.scores[id] }));
    const ok = caseOk({ esperados, devolvidas: resultado.injected });
    if (esperados.length === 0) {
      negativos += 1;
      if (resultado.injected.length > 0) negativosComNota += 1;
    } else {
      positivos += 1;
      if (ok) acertosPositivos += 1;
    }
    porCaso.push({
      prompt: caso.prompt,
      cwd: caso.cwd ?? null,
      projeto: projectId,
      esperados,
      devolvidas,
      candidatas: resultado.candidates,
      decisao: resultado.decision,
      ok,
    });
  }

  return {
    positivos,
    negativos,
    acertosPositivos,
    negativosComNotaTotal: negativosComNota,
    acertoTop3: positivos === 0 ? 1 : acertosPositivos / positivos,
    negativosComNota: negativos === 0 ? 0 : negativosComNota / negativos,
    porCaso,
  };
}

export const PISOS_CANDIDATOS = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

/**
 * Varre pisos de pontuação (`minScore`) num conjunto. Feito para o conjunto de
 * calibração: o piso sugerido é o menor que mantém acerto no top 3 >= 0,8 e
 * negativos com nota <= 0,1.
 */
export function sweepThreshold({ casos, vaultDir, config, candidatos = PISOS_CANDIDATOS }) {
  const index = loadIndex(vaultDir);
  return candidatos.map((minScore) => {
    const r = runDataset({ casos, config: { ...config, minScore }, index });
    return {
      minScore,
      acertoTop3: r.acertoTop3,
      negativosComNota: r.negativosComNota,
      passa: r.acertoTop3 >= 0.8 && r.negativosComNota <= 0.1,
    };
  });
}

export function suggestThreshold(argumentos) {
  const varredura = sweepThreshold(argumentos);
  const melhor = varredura.find((linha) => linha.passa);
  return melhor ?? { minScore: argumentos.config.minScore, acertoTop3: 0, negativosComNota: 1, passa: false };
}
