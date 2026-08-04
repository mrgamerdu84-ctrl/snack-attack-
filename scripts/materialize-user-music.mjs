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
const partNames = (await readdir(partsDir)).filter((name) => name.endsWith('.b64')).sort();
if (!partNames.length) throw new Error('Aucun morceau de la musique fournie.');

const encoded = [];
for (const name of partNames) {
  const part = (await readFile(resolve(partsDir, name), 'utf8')).trim();
  if (!/^[A-Za-z0-9+/=]+$/.test(part)) throw new Error(`Morceau musical invalide : ${name}`);
  encoded.push(part);
}

const source = Buffer.from(encoded.join(''), 'base64');
if (source.length < 20_000 || source.subarray(0, 4).toString('ascii') !== 'OggS') {
  throw new Error(`Musique reconstruite invalide : ${source.length} octets.`);
}
await writeFile(sourcePath, source);

function ffmpeg(args) {
  const result = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', sourcePath, ...args], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Conversion de la musique impossible.');
}

ffmpeg(['-codec:a', 'libmp3lame', '-b:a', '160k', '-ar', '44100', '-ac', '2', mp3Path]);
ffmpeg(['-codec:a', 'libvorbis', '-q:a', '5', '-ar', '44100', '-ac', '2', oggPath]);
await rm(sourcePath, { force: true });
await writeFile(resolve(audioDir, 'MUSIC_SOURCE.txt'), 'three_tiles_left.mp3 — musique fournie par le propriétaire de Snack Attack et utilisée en boucle dans le jeu.\n', 'utf8');

console.log(`Musique fournie reconstruite : ${source.length} octets, ${partNames.length} partie(s).`);
