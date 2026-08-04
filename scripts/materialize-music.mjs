import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const chunksDir = resolve(rootDir, 'music-data');
const audioDir = resolve(rootDir, 'audio');
const output = resolve(audioDir, 'snack-attack-music.mp3');

const chunks = (await readdir(chunksDir))
  .filter((name) => /^chunk-\d+\.txt$/.test(name))
  .sort();

if (!chunks.length) throw new Error('Aucun morceau de musique trouvé dans music-data/.');

let encoded = '';
for (const chunk of chunks) {
  encoded += (await readFile(resolve(chunksDir, chunk), 'utf8')).trim();
}

const bytes = Buffer.from(encoded, 'base64');
if (bytes.length < 100_000) throw new Error(`Musique reconstruite trop petite: ${bytes.length} octets.`);
const isId3 = bytes.subarray(0, 3).toString('ascii') === 'ID3';
const isMpeg = bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0;
if (!isId3 && !isMpeg) throw new Error('Le fichier reconstruit ne ressemble pas à un MP3 valide.');

await mkdir(audioDir, { recursive: true });
await writeFile(output, bytes);
await writeFile(
  resolve(audioDir, 'MUSIC_SOURCE.txt'),
  'Musique principale fournie par le propriétaire du projet sous le nom three_tiles_left.mp3.\n',
  'utf8',
);

console.log(`Musique Snack Attack reconstruite: ${bytes.length} octets (${chunks.length} morceaux).`);
