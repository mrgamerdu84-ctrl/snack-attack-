import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const sourceDir = resolve(rootDir, 'music_source');
const outputDir = resolve(rootDir, 'audio');
const parts = (await readdir(sourceDir))
  .filter((name) => /^three_tiles_left\.part\d+\.b64$/.test(name))
  .sort();

if (!parts.length) throw new Error('Aucun morceau de la musique utilisateur trouvé.');
const encoded = (await Promise.all(parts.map((name) => readFile(resolve(sourceDir, name), 'utf8')))).join('');
const audio = Buffer.from(encoded, 'base64');
if (audio.length < 700_000) throw new Error(`Musique reconstruite trop petite: ${audio.length} octets.`);
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'music-loop.mp3'), audio);
console.log(`Musique utilisateur reconstruite: ${audio.length} octets depuis ${parts.length} morceaux.`);
