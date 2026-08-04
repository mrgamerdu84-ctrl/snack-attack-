import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sourceAudio = resolve(root, 'audio');
const androidAudio = resolve(root, 'android/app/src/main/assets/audio');
const manifestPath = resolve(root, 'android/app/src/main/AndroidManifest.xml');

await mkdir(androidAudio, { recursive: true });

const files = [
  'music-loop.mp3',
  'music-loop.ogg',
  'pop.ogg',
  'bad.ogg',
  'bomb.ogg',
  'laser.ogg',
  'rainbow.ogg',
  'victory.ogg',
  'failure.ogg',
  'combo.ogg',
  'super.ogg',
  'mega.ogg',
  'legendary.ogg',
  'hurry.ogg',
  'unlock.ogg'
];

for (const file of files) {
  await cp(resolve(sourceAudio, file), resolve(androidAudio, file));
}

let manifest = await readFile(manifestPath, 'utf8');
const permission = '<uses-permission android:name="android.permission.VIBRATE" />';
if (!manifest.includes('android.permission.VIBRATE')) {
  const manifestStart = manifest.indexOf('<manifest');
  const manifestTagEnd = manifest.indexOf('>', manifestStart);
  if (manifestStart < 0 || manifestTagEnd < 0) {
    throw new Error('Balise <manifest> introuvable dans AndroidManifest.xml');
  }
  manifest = `${manifest.slice(0, manifestTagEnd + 1)}\n    ${permission}${manifest.slice(manifestTagEnd + 1)}`;
  await writeFile(manifestPath, manifest, 'utf8');
}

console.log('Audio copié dans les assets Android et permission VIBRATE vérifiée.');
