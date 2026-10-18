#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULTS } from '../lib/config.mjs';
import { runDataset, sweepThreshold } from '../lib/evaluate.mjs';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumentos = process.argv.slice(2);

function opcao(nome, padrao) {
  const indice = argumentos.indexOf(nome);
  return indice >= 0 ? argumentos[indice + 1] : padrao;
}

const nome = opcao('--dataset', 'validacao');
const vaultDir = opcao('--vault', path.join(RAIZ, 'fixtures', 'vault'));
const detalhes = argumentos.includes('--detalhes');
const salvar = argumentos.includes('--salvar');
const config = DEFAULTS;

const arquivo = path.join(RAIZ, 'eval', `${nome}.json`);
const casos = JSON.parse(fs.readFileSync(arquivo, 'utf8'));
const escreve = (texto) => process.stdout.write(`${texto}\n`);
const dec = (valor) => valor.toFixed(2).replace('.', ',');
const lista = (itens) => (itens.length ? itens.map((n) => `${n.id} (${dec(n.score)})`).join(', ') : '(nenhuma)');

if (argumentos.includes('--sugerir-piso')) {
  const varredura = sweepThreshold({ casos, vaultDir, config });
  escreve(`Varredura do piso (minScore) no conjunto ${nome}:`);
  for (const linha of varredura) {
    escreve(`  ${String(linha.minScore).padStart(2)}  acerto no top 3 ${dec(linha.acertoTop3)}  negativos com nota ${dec(linha.negativosComNota)}${linha.passa ? '  passa' : ''}`);
  }
  const melhor = varredura.find((linha) => linha.passa);
  escreve(melhor ? `Piso sugerido: ${melhor.minScore}` : 'Nenhum piso passa nos dois critérios.');
  process.exit(0);
}

const r = runDataset({ casos, vaultDir, config });

escreve(`Conjunto ${nome}: ${r.positivos} casos positivos, ${r.negativos} negativos`);
escreve(`  acerto no top 3: ${r.acertosPositivos}/${r.positivos} casos positivos encontraram a nota esperada entre as três primeiras`);
escreve(`  casos negativos que devolveram alguma nota: ${r.negativosComNotaTotal}/${r.negativos}`);

for (const caso of r.porCaso) {
  if (!detalhes && caso.ok) continue;
  const esperado = caso.esperados.join(', ') || '(nenhuma: caso negativo)';
  escreve(`  ${caso.ok ? 'acerto' : 'ERRO  '} "${caso.prompt}"${caso.cwd ? `  [cwd ${caso.cwd}]` : ''}`);
  escreve(`      esperada: ${esperado}`);
  escreve(`      devolvidas: ${lista(caso.devolvidas)}`);
  if (detalhes) escreve(`      candidatas antes dos filtros: ${lista(caso.candidatas)}`);
}

if (salvar) {
  const pasta = path.join(RAIZ, 'resultados');
  fs.mkdirSync(pasta, { recursive: true });
  const parametros = { ...config };
  fs.writeFileSync(
    path.join(pasta, `${nome}.json`),
    `${JSON.stringify({ conjunto: nome, parametros, resumo: {
      positivos: r.positivos,
      acertosPositivos: r.acertosPositivos,
      negativos: r.negativos,
      negativosComNota: r.negativosComNotaTotal,
    }, casos: r.porCaso }, null, 2)}\n`,
  );

  const md = [
    `# Resultado caso a caso: ${nome}`,
    '',
    'Gerado por `node bin/eval.mjs --dataset ' + nome + ' --salvar`, com os parâmetros de `lib/config.mjs`.',
    'Pontuação: a do MiniSearch (BM25+ com peso por campo), multiplicada por 1,25 em nota do projeto do pedido.',
    '',
    `- Acerto no top 3: ${r.acertosPositivos}/${r.positivos} casos positivos`,
    `- Casos negativos que devolveram alguma nota: ${r.negativosComNotaTotal}/${r.negativos}`,
    '',
    '| # | Consulta | cwd | Nota esperada | Notas devolvidas (pontuação) | Melhores candidatas antes dos filtros | Resultado |',
    '|---|---|---|---|---|---|---|',
    ...r.porCaso.map((c, i) => `| ${i + 1} | ${c.prompt.replace(/\|/g, '\\|')} | ${c.cwd ?? ''} | ${c.esperados.join(', ') || '(nenhuma)'} | ${lista(c.devolvidas)} | ${lista(c.candidatas)} | ${c.ok ? 'acerto' : 'erro'} |`),
    '',
  ];
  if (nome === 'calibracao') {
    md.push('## Varredura do piso (minScore)', '', '| minScore | Acerto no top 3 | Negativos com nota | Passa (>= 0,80 e <= 0,10) |', '|---|---|---|---|');
    for (const linha of sweepThreshold({ casos, vaultDir, config })) {
      md.push(`| ${linha.minScore} | ${dec(linha.acertoTop3)} | ${dec(linha.negativosComNota)} | ${linha.passa ? 'sim' : 'não'} |`);
    }
    md.push('');
  }
  fs.writeFileSync(path.join(pasta, `${nome}.md`), md.join('\n'));
  escreve(`  gravado em resultados/${nome}.md e resultados/${nome}.json`);
}

// Portão funcional herdado do projeto original: acerto >= 0,8 e negativos com nota <= 0,1.
const falhou = r.acertoTop3 < 0.8 || r.negativosComNota > 0.1;
process.exit(falhou ? 1 : 0);
