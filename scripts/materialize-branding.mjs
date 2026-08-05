import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const sourceDir = resolve(rootDir, 'branding-src');
const resourcesDir = resolve(rootDir, 'resources');
const assetsDir = resolve(rootDir, 'assets');

await mkdir(resourcesDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

async function rebuild(prefix, destination) {
  const files = (await readdir(sourceDir))
    .filter((name) => name.startsWith(prefix) && name.endsWith('.txt'))
    .sort();

  if (files.length === 0) throw new Error(`Aucun morceau trouvé pour ${prefix}`);

  let encoded = '';
  for (const file of files) encoded += (await readFile(resolve(sourceDir, file), 'utf8')).trim();

  const binary = Buffer.from(encoded, 'base64');
  if (binary.length < 1024) throw new Error(`Image reconstruite trop petite pour ${prefix}`);

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, binary);

  const metadata = await sharp(destination).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Image invalide pour ${prefix}`);
  console.log(`${prefix}: ${files.length} morceaux, ${binary.length} octets, ${metadata.width}x${metadata.height}.`);
}

const iconSource = resolve(resourcesDir, 'icon-source.avif');
const splashSource = resolve(resourcesDir, 'splash-source.avif');
const iconWebp = resolve(resourcesDir, 'icon.webp');
const iconPng = resolve(resourcesDir, 'icon.png');
const splashWebp = resolve(assetsDir, 'snack-attack-splash.webp');
const splashPng = resolve(resourcesDir, 'splash.png');

await rebuild('icon-v4-avif-', iconSource);
await rebuild('splash-v4-fixed-avif-', splashSource);

await sharp(iconSource)
  .resize(1024, 1024, { fit: 'cover', position: 'centre' })
  .webp({ quality: 92 })
  .toFile(iconWebp);

await sharp(iconSource)
  .resize(1024, 1024, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9 })
  .toFile(iconPng);

// Le splash reste vertical afin de ne pas couper Chargement, 87 % et le copyright.
await sharp(splashSource)
  .resize({ width: 960, withoutEnlargement: false })
  .webp({ quality: 90 })
  .toFile(splashWebp);

// Capacitor demande une source carrée : l’image complète est centrée sur un fond assorti.
await sharp(splashSource)
  .resize(2732, 2732, { fit: 'contain', position: 'centre', background: '#16052f' })
  .png({ compressionLevel: 9 })
  .toFile(splashPng);

console.log('Icône et splash Snack Attack V4 générés et validés.');
