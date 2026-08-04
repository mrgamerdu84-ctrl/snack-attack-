import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const www = resolve(root, 'www');

async function patch(path, transform) {
  const full = resolve(www, path);
  const before = await readFile(full, 'utf8');
  const after = transform(before);
  if (after === before) throw new Error(`Aucune modification appliquée à ${path}`);
  await writeFile(full, after, 'utf8');
}

await patch('game-core.js', (text) => text.replace(
  "fastfood:['🍕','🍟','🍔','🌮','🍿','🌭']};",
  "fastfood:['🍕','🍟','🍔','🌮','🍿','🌭'], sodas:['🥤','🧋','🥫','🧊','🍹','🫧'], fruitsmer:['🦐','🦀','🦞','🦪','🐙','🦑'], viande:['🥩','🍖','🍗','🥓','🌭','🍔'], poisson:['🐟','🐠','🐡','🍣','🍥','🥫']};"
));

await patch('index.html', (text) => {
  let out = text;
  const cards = `\n<button class="t-card" data-theme="sodas"><span style="font-size:22px">🥤🧋🥫</span>Sodas</button>\n<button class="t-card" data-theme="fruitsmer"><span style="font-size:22px">🦐🦀🦞</span>Fruits de mer</button>\n<button class="t-card" data-theme="viande"><span style="font-size:22px">🥩🍖🍗</span>Viande</button>\n<button class="t-card" data-theme="poisson"><span style="font-size:22px">🐟🐠🍣</span>Poisson</button>`;
  out = out.replace('</div>\n<button class="mainbtn" id="playBtn"', `${cards}\n</div>\n<button class="mainbtn" id="playBtn"`);
  out = out.replace('</head>', '<link rel="stylesheet" href="glass-crash-extension.css">\n</head>');
  out = out.replace('<script src="v2-system.js"></script>', '<script src="v2-system.js"></script>\n<script src="glass-crash-extension.js"></script>');
  return out;
});

await patch('v2-system.js', (text) => text.replace(
  "{ name: 'Ville Snack', icon: '🍕', theme: 'fastfood', start: 21, end: 25 }",
  "{ name: 'Ville Snack', icon: '🍕', theme: 'fastfood', start: 21, end: 25 },\n    { name: 'Bulles Party', icon: '🥤', theme: 'sodas', start: 26, end: 30 },\n    { name: 'Port gourmand', icon: '🦐', theme: 'fruitsmer', start: 31, end: 35 },\n    { name: 'Barbecue Park', icon: '🥩', theme: 'viande', start: 36, end: 40 },\n    { name: 'Océan Snack', icon: '🐟', theme: 'poisson', start: 41, end: 45 }"
));

await patch('screen-splashes.js', (text) => text.replace(
  "fastfood: { primary: '#f94144', secondary: '#ffd166', kind: 'sauce', pieces: ['sauce', 'crumb'] }",
  "fastfood: { primary: '#f94144', secondary: '#ffd166', kind: 'sauce', pieces: ['sauce', 'crumb'] },\n    sodas: { primary: '#43c6ff', secondary: '#ff4d9d', kind: 'juice', pieces: ['drop', 'ice'] },\n    fruitsmer: { primary: '#ff7f50', secondary: '#9ad7ff', kind: 'sauce', pieces: ['chip', 'drop'] },\n    viande: { primary: '#a83232', secondary: '#ff9f68', kind: 'sauce', pieces: ['chip', 'drop'] },\n    poisson: { primary: '#3da5d9', secondary: '#b8f2e6', kind: 'juice', pieces: ['chip', 'drop'] }"
));

console.log('Catégories et effets de vitre ajoutés au build web.');
