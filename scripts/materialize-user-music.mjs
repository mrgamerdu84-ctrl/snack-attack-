import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const headDir = resolve(root, 'music-src/three-tiles-left');
const tailDir = resolve(root, 'music-src/tail-16k');
const audioDir = resolve(root, 'audio');
const sourcePath = resolve(audioDir, 'three-tiles-left.opus');
const mp3Path = resolve(audioDir, 'music-loop.mp3');
const oggPath = resolve(audioDir, 'music-loop.ogg');

const EXPECTED_BASE64_LENGTH = 96_524;
const EXPECTED_SOURCE_SIZE = 72_392;
const EXPECTED_SHA256 = '5b5a770e76e6d43895a15b834cbb382b8ca5fffad9e8cb13cbd04776fd130e11';

const orderedParts = [
  ...['part-01.b64', 'part-02.b64', 'part-03.b64'].map((name) => resolve(headDir, name)),
  ...Array.from({ length: 10 }, (_, index) => resolve(tailDir, `tail-${String(index).padStart(2, '0')}.b64`)),
];

function expectedLengthFor(path) {
  const name = basename(path);
  if (name.startsWith('part-')) return 20_000;
  if (name === 'tail-09.b64') return 524;
  return 4_000;
}

await mkdir(audioDir, { recursive: true });
const base64Parts = [];
for (const [index, path] of orderedParts.entries()) {
  const expectedLength = expectedLengthFor(path);
  const raw = await readFile(path, 'utf8');
  const compact = raw.replace(/\s+/g, '');
  if (compact.length < expectedLength) {
    throw new Error(`${basename(path)} incomplet : ${compact.length} caractères au lieu d’au moins ${expectedLength}.`);
  }

  const part = compact.slice(0, expectedLength);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(part)) {
    throw new Error(`${basename(path)} contient des caractères non valides dans sa partie utile.`);
  }
  if (compact.length > expectedLength) {
    console.warn(`${basename(path)} : ${compact.length - expectedLength} caractère(s) superflu(s) ignoré(s).`);
  }
  console.log(`Bloc ${index + 1}/${orderedParts.length} : ${basename(path)}, ${part.length} caractères utiles.`);
  base64Parts.push(part);
}

const joined = base64Parts.join('');
if (joined.length !== EXPECTED_BASE64_LENGTH) {
  throw new Error(`Musique encodée incomplète : ${joined.length} caractères au lieu de ${EXPECTED_BASE64_LENGTH}.`);
}

const source = Buffer.from(joined, 'base64');
const digest = createHash('sha256').update(source).digest('hex');
if (source.length !== EXPECTED_SOURCE_SIZE) {
  throw new Error(`Musique reconstruite invalide : ${source.length} octets au lieu de ${EXPECTED_SOURCE_SIZE}.`);
}
if (source.subarray(0, 4).toString('ascii') !== 'OggS') {
  throw new Error('La musique reconstruite n’est pas un flux Ogg/Opus valide.');
}
if (digest !== EXPECTED_SHA256) {
  throw new Error(`Empreinte musicale incorrecte : ${digest}.`);
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
  `three_tiles_left.mp3 — musique fournie par le propriétaire du projet Snack Attack, optimisée puis préparée en boucle pour le jeu.\nSHA-256 source: ${EXPECTED_SHA256}\n`,
  'utf8',
);

console.log(`Musique fournie vérifiée et reconstruite depuis ${orderedParts.length} blocs : ${source.length} octets, SHA-256 ${digest}.`);
