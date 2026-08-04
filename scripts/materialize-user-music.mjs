import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const partsDir = resolve(root, 'music-src/three-tiles-left');
const audioDir = resolve(root, 'audio');
const sourcePath = resolve(audioDir, 'three-tiles-left.opus');
const mp3Path = resolve(audioDir, 'music-loop.mp3');
const oggPath = resolve(audioDir, 'music-loop.ogg');

await mkdir(audioDir, { recursive: true });
const partNames = (await readdir(partsDir))
  .filter((name) => name.endsWith('.b64'))
  .sort();

if (!partNames.length) throw new Error('Aucun morceau de la musique fournie n’a été trouvé.');

const base64Parts = [];
for (const name of partNames) {
  let part = await readFile(resolve(partsDir, name), 'utf8');

  // Accepte les morceaux avec BOM, retours à la ligne, espaces ou préfixe data URL.
  part = part.replace(/^\uFEFF/, '').trim();
  if (part.startsWith('data:')) {
    const comma = part.indexOf(',');
    if (comma < 0) throw new Error(`Préfixe data URL invalide : ${name}`);
    part = part.slice(comma + 1);
  }
  if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'"))) {
    part = part.slice(1, -1);
  }
  part = part.replace(/\s+/g, '');

  if (!part || !/^[A-Za-z0-9+/]*={0,2}$/.test(part)) {
    const invalid = [...new Set(part.replace(/[A-Za-z0-9+/=]/g, ''))]
      .map((character) => JSON.stringify(character))
      .join(', ');
    throw new Error(`Partie musicale invalide : ${name}${invalid ? ` — caractères : ${invalid}` : ''}`);
  }
  base64Parts.push(part);
}

const encoded = base64Parts.join('');
const source = Buffer.from(encoded, 'base64');
if (source.length < 30_000 || source.subarray(0, 4).toString('ascii') !== 'OggS') {
  throw new Error(`Musique reconstruite invalide (${source.length} octets).`);
}
await writeFile(sourcePath, source);

function convert(args) {
  const result = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', sourcePath, ...args], {
    cwd: root,
    stdio: 'inherit',
  });
  if (result.status !== 0) throw new Error('Conversion de la musique fournie impossible.');
}

convert(['-codec:a', 'libmp3lame', '-b:a', '128k', '-ar', '44100', '-ac', '2', mp3Path]);
convert(['-codec:a', 'libvorbis', '-q:a', '4', '-ar', '44100', '-ac', '2', oggPath]);
await rm(sourcePath, { force: true });

await writeFile(
  resolve(audioDir, 'MUSIC_SOURCE.txt'),
  'three_tiles_left.mp3 — musique fournie par le propriétaire du projet Snack Attack, préparée en boucle pour le jeu.\n',
  'utf8',
);

console.log(`Musique fournie reconstruite depuis ${partNames.length} partie(s) : ${source.length} octets.`);
