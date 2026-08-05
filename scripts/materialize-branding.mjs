import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const sourceDir = resolve(rootDir, 'branding-src');

async function rebuild(prefix, destination) {
  const files = (await readdir(sourceDir))
    .filter((name) => name.startsWith(prefix) && name.endsWith('.txt'))
    .sort();

  if (files.length === 0) throw new Error(`Aucun morceau trouvé pour ${prefix}`);

  let encoded = '';
  for (const file of files) encoded += (await readFile(resolve(sourceDir, file), 'utf8')).trim();

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(encoded, 'base64'));
  console.log(`${prefix}: ${files.length} morceaux reconstruits.`);
}

const iconSource = resolve(rootDir, 'resources', 'icon-source.avif');
const splashSource = resolve(rootDir, 'resources', 'splash-source.avif');
const iconWebp = resolve(rootDir, 'resources', 'icon.webp');
const iconPng = resolve(rootDir, 'resources', 'icon.png');
const splashWebp = resolve(rootDir, 'assets', 'snack-attack-splash.webp');
const splashPng = resolve(rootDir, 'resources', 'splash.png');

await rebuild('icon-v4-avif-', iconSource);
await rebuild('splash-v4-tiny-avif-', splashSource);

await sharp(iconSource).resize(1024, 1024, { fit: 'cover', position: 'centre' }).webp({ quality: 92 }).toFile(iconWebp);
await sharp(iconSource).resize(1024, 1024, { fit: 'cover', position: 'centre' }).png({ compressionLevel: 9 }).toFile(iconPng);
await sharp(splashSource).resize(1024, 1536, { fit: 'cover', position: 'centre' }).webp({ quality: 90 }).toFile(splashWebp);
await sharp(splashSource).resize(2732, 2732, { fit: 'contain', position: 'centre', background: '#16052f' }).png({ compressionLevel: 9 }).toFile(splashPng);

console.log('Nouvelle icône et nouveau splash Snack Attack générés.');
