import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const webDir = resolve(rootDir, 'www');

const requiredFiles = [
  'index.html',
  'style.css',
  'branding.css',
  'v2.css',
  'theme-effects.css',
  'branding.js',
  'game-core.js',
  'game-effects.js',
  'game-play.js',
  'voice-combos.js',
  'voice-controls.js',
  'v2-system.js',
  'audio-fix.js',
  'theme-effects.js'
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

await build({
  entryPoints: [resolve(rootDir, 'src/native-tts.js')],
  bundle: true,
  outfile: resolve(webDir, 'native-tts.js'),
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false
});

await build({
  entryPoints: [resolve(rootDir, 'src/native-feedback.js')],
  bundle: true,
  outfile: resolve(webDir, 'native-feedback.js'),
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false
});

console.log('Snack Attack V2, musique MP3, vibrations renforcées et effets visuels par thème préparés dans www/.');
