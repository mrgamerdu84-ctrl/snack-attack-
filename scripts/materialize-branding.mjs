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

async function rebuild(prefix, destination, chunkSize = null) {
  const files = (await readdir(sourceDir))
    .filter((name) => name.startsWith(prefix) && name.endsWith('.txt'))
    .sort();

  if (files.length === 0) throw new Error(`Aucun morceau trouvé pour ${prefix}`);

  let encoded = '';
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    let part = (await readFile(resolve(sourceDir, file), 'utf8')).trim();
    if (chunkSize && index < files.length - 1 && part.length > chunkSize) {
      part = part.slice(0, chunkSize);
    }
    encoded += part;
  }

  const binary = Buffer.from(encoded, 'base64');
  if (binary.length < 1024) throw new Error(`Image reconstruite trop petite pour ${prefix}`);

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, binary);

  const metadata = await sharp(destination).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Image invalide pour ${prefix}`);
  console.log(`${prefix}: ${files.length} morceau(x), ${binary.length} octets, ${metadata.width}x${metadata.height}.`);
}

const iconSource = resolve(resourcesDir, 'icon-source.avif');
const splashSource = resolve(resourcesDir, 'splash-source.avif');
const iconWebp = resolve(resourcesDir, 'icon.webp');
const iconPng = resolve(resourcesDir, 'icon.png');
const splashWebp = resolve(assetsDir, 'snack-attack-splash.webp');
const splashPng = resolve(resourcesDir, 'splash.png');

await rebuild('icon-v4-avif-', iconSource, 8000);
await rebuild('splash-v4-fixed-avif-', splashSource);

await sharp(iconSource)
  .resize(1024, 1024, { fit: 'cover', position: 'centre' })
  .webp({ quality: 92 })
  .toFile(iconWebp);

await sharp(iconSource)
  .resize(1024, 1024, { fit: 'cover', position: 'centre' })
  .png({ compressionLevel: 9 })
  .toFile(iconPng);

await sharp(splashSource)
  .resize(1024, 1536, { fit: 'cover', position: 'centre' })
  .webp({ quality: 90 })
  .toFile(splashWebp);

await sharp(splashSource)
  .resize(2732, 2732, { fit: 'contain', position: 'centre', background: '#16052f' })
  .png({ compressionLevel: 9 })
  .toFile(splashPng);

console.log('Icône et splash Snack Attack V4 générés et validés.');
