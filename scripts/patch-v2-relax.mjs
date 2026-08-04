import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = resolve(import.meta.dirname, '..', 'www', 'v2-system.js');
let source = await readFile(target, 'utf8');

function replaceOnce(search, replacement, label) {
  if (!source.includes(search)) throw new Error(`Patch Snack Attack introuvable: ${label}`);
  source = source.replace(search, replacement);
}

replaceOnce("  let usedSpecialsThisLevel = 0;\n", "  let usedSpecialsThisLevel = 0;\n  let gameMode = 'adventure';\n", 'variable gameMode');
replaceOnce("    $('playBtn').disabled = false;\n", "    $('playBtn').disabled = false;\n    if ($('relaxBtn')) $('relaxBtn').disabled = false;\n", 'activation détente');
replaceOnce("  function objectiveDisplay() {\n    if (!currentObjective) return `${score} / ${target}`;", "  function objectiveDisplay() {\n    if (gameMode === 'relax') return `${score} points libres`;\n    if (!currentObjective) return `${score} / ${target}`;", 'objectif détente');
replaceOnce("  function objectiveRatio() {\n    if (!currentObjective) return Math.min(1, score / target);", "  function objectiveRatio() {\n    if (gameMode === 'relax') return 0;\n    if (!currentObjective) return Math.min(1, score / target);", 'ratio détente');
replaceOnce("  function objectiveComplete() {\n    return objectiveRatio() >= 1;\n  }", "  function objectiveComplete() {\n    if (gameMode === 'relax') return false;\n    return objectiveRatio() >= 1;\n  }", 'fin détente');
replaceOnce("    moves--;\n", "    if (gameMode !== 'relax') moves--;\n", 'coups infinis');

replaceOnce(
`      setTimeout(() => {
        const element = board.querySelector(\`.cell[data-r="\${rr}"][data-c="\${cellColumn}"]\`);
        if (element && index !== preserveIndex) element.classList.add('pop');
        const fruit = grid[index]?.fruit;
        if (fruit && index !== preserveIndex) {
          bottles[fruit] = (bottles[fruit] || 0) + 1;
          createParticles(x, y, fruit, indices.length >= 10 ? 7 : indices.length >= 6 ? 5 : 3);
        }
        if (position === Math.floor(sorted.length / 2)) createScoreFloat(x, y, gain, multiplier > 1.1);
      }, position * 30);`,
`      setTimeout(() => {
        const element = board.querySelector(\`.cell[data-r="\${rr}"][data-c="\${cellColumn}"]\`);
        const fruit = grid[index]?.fruit;
        let screenX = x;
        let screenY = y;
        if (element) {
          const rect = element.getBoundingClientRect();
          screenX = rect.left + rect.width / 2;
          screenY = rect.top + rect.height / 2;
        }
        if (element && index !== preserveIndex) element.classList.add('pop');
        if (fruit && index !== preserveIndex) {
          bottles[fruit] = (bottles[fruit] || 0) + 1;
          createParticles(x, y, fruit, indices.length >= 10 ? 7 : indices.length >= 6 ? 5 : 3);
          window.SnackScreenFX?.explodeAt({
            x: screenX,
            y: screenY,
            snack: fruit,
            theme: selectedTheme || 'fruits',
            intensity: indices.length >= 10 ? 1.55 : indices.length >= 6 ? 1.25 : 1
          });
        }
        if (position === Math.floor(sorted.length / 2)) createScoreFloat(x, y, gain, multiplier > 1.1);
      }, position * 30);`,
  'déclencheur exact de suppression'
);

replaceOnce("      if (objectiveComplete()) {", "      if (gameMode !== 'relax' && objectiveComplete()) {", 'pas de victoire détente');
replaceOnce("      if (moves <= 0) {", "      if (gameMode !== 'relax' && moves <= 0) {", 'pas de défaite détente');

replaceOnce(
`  updHUD = function updateHudV2() {
    $('lvl').textContent = level;
    $('sc').textContent = score;
    $('mv').textContent = moves;
    $('tm').textContent = Math.floor(timeLeft / 60) + ':' + String(timeLeft % 60).padStart(2, '0');
    $('obj').textContent = objectiveDisplay();
    $('fill').style.width = (objectiveRatio() * 100) + '%';
    $('shuffleBtn').textContent = \`🔀 Mélanger (\${shuffle})\`;
    $('tm').classList.toggle('danger', timeLeft <= 20);
    const objectiveLabel = document.querySelector('.chip-row .chip:nth-child(3) .label');
    if (objectiveLabel && currentObjective) objectiveLabel.textContent = currentObjective.label;
    updatePlayerStatus();
  };`,
`  updHUD = function updateHudV2() {
    const relax = gameMode === 'relax';
    $('lvl').textContent = relax ? 'Détente' : level;
    $('sc').textContent = score;
    $('mv').textContent = relax ? '∞' : moves;
    $('tm').textContent = relax ? '∞' : Math.floor(timeLeft / 60) + ':' + String(timeLeft % 60).padStart(2, '0');
    $('obj').textContent = relax ? \`\${score} pts libres\` : objectiveDisplay();
    $('fill').style.width = relax ? '100%' : (objectiveRatio() * 100) + '%';
    $('shuffleBtn').textContent = \`🔀 Mélanger (\${shuffle})\`;
    $('tm').classList.toggle('danger', !relax && timeLeft <= 20);
    const objectiveLabel = document.querySelector('.chip-row .chip:nth-child(3) .label');
    if (objectiveLabel) objectiveLabel.textContent = relax ? 'Jeu libre' : currentObjective?.label || 'Objectif';
    updatePlayerStatus();
  };`,
  'HUD détente'
);

replaceOnce(
`  startTimer = function startTimerV2() {
    clearInterval(timer);
    timeLeft = levelDuration;
    updHUD();`,
`  startTimer = function startTimerV2() {
    clearInterval(timer);
    if (gameMode === 'relax') {
      timeLeft = Number.POSITIVE_INFINITY;
      updHUD();
      return;
    }
    timeLeft = levelDuration;
    updHUD();`,
  'chrono infini'
);

replaceOnce(
`  startLevel = function startLevelV2() {
    const world = worldForLevel(level);
    setTheme(world.theme);
    score = 0;
    moves = 24 + Math.min(8, Math.floor(level / 4));
    target = tgt(level);
    currentObjective = createObjective(level);
    levelDuration = currentObjective.type === 'special' ? 115 : currentObjective.type === 'collect' ? 105 : 90;`,
`  startLevel = function startLevelV2() {
    const relax = gameMode === 'relax';
    const world = relax
      ? { icon: '🧘', name: 'Mode détente', theme: selectedTheme || 'fruits' }
      : worldForLevel(level);
    setTheme(world.theme);
    score = 0;
    moves = relax ? Number.POSITIVE_INFINITY : 24 + Math.min(8, Math.floor(level / 4));
    target = relax ? Number.POSITIVE_INFINITY : tgt(level);
    currentObjective = relax
      ? { type: 'relax', label: 'Jeu libre', goal: Number.POSITIVE_INFINITY, progress: 0 }
      : createObjective(level);
    levelDuration = relax ? Number.POSITIVE_INFINITY : currentObjective.type === 'special' ? 115 : currentObjective.type === 'collect' ? 105 : 90;`,
  'initialisation détente'
);

replaceOnce(
`    $('msg').textContent = \`🎯 \${currentObjective.label} • Crée des boosters avec 5+ snacks !\`;
    $('welcome').textContent = \`\${world.icon} \${world.name} • Niveau \${level}\`;`,
`    $('msg').textContent = relax
      ? '🧘 Jeu libre : aucun chrono, aucun niveau, amuse-toi !'
      : \`🎯 \${currentObjective.label} • Crée des boosters avec 5+ snacks !\`;
    $('welcome').textContent = relax
      ? \`\${world.icon} \${world.name} • Score libre\`
      : \`\${world.icon} \${world.name} • Niveau \${level}\`;`,
  'messages détente'
);

replaceOnce("  function launchLevel(value) {\n    level = Math.max(1, Math.min(25, value));", "  function launchLevel(value) {\n    gameMode = 'adventure';\n    level = Math.max(1, Math.min(25, value));", 'retour aventure');
replaceOnce("  function claimDailyReward() {", "  function launchRelaxMode() {\n    gameMode = 'relax';\n    setTheme(selectedTheme || 'fruits');\n    $('startMenu').style.display = 'none';\n    $('gameWrap').style.display = 'flex';\n    comboChain = 0;\n    multiplier = 1;\n    startLevel();\n  }\n\n  function claimDailyReward() {", 'lancement détente');
replaceOnce("  function installGameButtons() {\n    $('playBtn').onclick = () => launchLevel(progress.highestLevel || 1);", "  function installGameButtons() {\n    $('playBtn').onclick = () => launchLevel(progress.highestLevel || 1);\n    $('relaxBtn').onclick = () => launchRelaxMode();", 'bouton détente');

await writeFile(target, source, 'utf8');
console.log('Mode détente et projections exactes ajoutés à www/v2-system.js.');
