import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const sourceDir = resolve(rootDir, 'branding-src');

async function rebuild(prefix, destination) {
  const files = (await readdir(sourceDir))
    .filter((name) => name.startsWith(prefix) && name.endsWith('.txt'))
    .sort();

  if (files.length === 0) {
    throw new Error(`Aucun morceau trouvé pour ${prefix}`);
  }

  let encoded = '';
  for (const file of files) {
    encoded += (await readFile(resolve(sourceDir, file), 'utf8')).trim();
  }

  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(encoded, 'base64'));
  console.log(`${prefix}: ${files.length} morceaux reconstruits.`);
}

await rebuild('icon-', resolve(rootDir, 'resources', 'icon.jpg'));
await rebuild('splash-', resolve(rootDir, 'assets', 'snack-attack-splash.jpg'));
