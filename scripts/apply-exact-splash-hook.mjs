import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const gamePath = resolve(root, 'v2-system.js');
const effectsPath = resolve(root, 'theme-effects.js');

let game = await readFile(gamePath, 'utf8');
let effects = await readFile(effectsPath, 'utf8');

const exactMarker = 'SnackThemeEffects.splashSnackAtViewport(fruit, clientX, clientY, particleCount)';

if (!game.includes(exactMarker)) {
  const oldBlock = `        const element = board.querySelector(\`.cell[data-r="\${rr}"][data-c="\${cellColumn}"]\`);\n        if (element && index !== preserveIndex) element.classList.add('pop');\n        const fruit = grid[index]?.fruit;\n        if (fruit && index !== preserveIndex) {\n          bottles[fruit] = (bottles[fruit] || 0) + 1;\n          createParticles(x, y, fruit, indices.length >= 10 ? 7 : indices.length >= 6 ? 5 : 3);\n        }`;

  const newBlock = `        const element = board.querySelector(\`.cell[data-r="\${rr}"][data-c="\${cellColumn}"]\`);\n        if (element && index !== preserveIndex) element.classList.add('pop');\n        const fruit = grid[index]?.fruit;\n        if (fruit && index !== preserveIndex) {\n          bottles[fruit] = (bottles[fruit] || 0) + 1;\n          const particleCount = indices.length >= 10 ? 7 : indices.length >= 6 ? 5 : 3;\n          createParticles(x, y, fruit, particleCount);\n\n          // Déclencheur exact intégré dans la boucle réelle de suppression.\n          // Les coordonnées sont celles du snack DOM au moment où il casse.\n          if (element && window.SnackThemeEffects?.splashSnackAtViewport) {\n            const snackRect = element.getBoundingClientRect();\n            const clientX = snackRect.left + snackRect.width / 2;\n            const clientY = snackRect.top + snackRect.height / 2;\n            window.SnackThemeEffects.splashSnackAtViewport(fruit, clientX, clientY, particleCount);\n          }\n        }`;

  if (!game.includes(oldBlock)) {
    throw new Error('Boucle de suppression attendue introuvable dans v2-system.js.');
  }
  game = game.replace(oldBlock, newBlock);
  await writeFile(gamePath, game, 'utf8');
}

const wrapperStart = `  // Déclencheur réel : cette fonction est appelée dans la boucle de suppression\n  // de v2-system.js, une fois pour chaque snack cassé, avec son X, Y et son emoji.\n  const originalCreateParticles = window.createParticles;\n  window.createParticles = function createParticlesWithExactGlassSplash(x, y, emoji, count) {\n    if (typeof originalCreateParticles === 'function') originalCreateParticles(x, y, emoji, count);\n    splashFromBoard(x, y, emoji, count);\n  };\n\n`;

if (effects.includes(wrapperStart)) {
  effects = effects.replace(wrapperStart, '');
  await writeFile(effectsPath, effects, 'utf8');
}

const patchedGame = await readFile(gamePath, 'utf8');
const patchedEffects = await readFile(effectsPath, 'utf8');

if (!patchedGame.includes(exactMarker)) {
  throw new Error('Le déclencheur exact n’a pas été intégré dans doRemoveV2.');
}
if (patchedEffects.includes('createParticlesWithExactGlassSplash')) {
  throw new Error('Un ancien déclencheur générique est encore actif et créerait un doublon.');
}

console.log('Déclencheur exact intégré dans sorted.forEach() avec getBoundingClientRect().');
