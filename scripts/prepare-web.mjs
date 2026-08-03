import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const webDir = resolve(rootDir, 'www');

const requiredFiles = [
  'index.html',
  'style.css',
  'game-core.js',
  'game-effects.js',
  'game-play.js'
];

const optionalDirectories = ['assets', 'images', 'audio'];

await rm(webDir, { recursive: true, force: true });
await mkdir(webDir, { recursive: true });

for (const file of requiredFiles) {
  const source = resolve(rootDir, file);
  await stat(source);
  await cp(source, resolve(webDir, file));
}

for (const directory of optionalDirectories) {
  const source = resolve(rootDir, directory);
  try {
    await stat(source);
    await cp(source, resolve(webDir, directory), { recursive: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

console.log('Fichiers web préparés dans www/.');
