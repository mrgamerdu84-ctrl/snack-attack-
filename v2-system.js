(() => {
  const STORAGE_KEY = 'snackAttackV2Progress';
  const TODAY_KEY = 'snackAttackDailyReward';
  const WORLDS = [
    { name: 'Royaume des fruits', icon: '🍓', theme: 'fruits', start: 1, end: 5 },
    { name: 'Jardin croquant', icon: '🥕', theme: 'legumes', start: 6, end: 10 },
    { name: 'Matin gourmand', icon: '🥐', theme: 'petitdej', start: 11, end: 15 },
    { name: 'Île glacée', icon: '🍦', theme: 'glace', start: 16, end: 20 },
    { name: 'Ville Snack', icon: '🍕', theme: 'fastfood', start: 21, end: 25 }
  ];

  const defaultProgress = {
    highestLevel: 1,
    coins: 100,
    stars: {},
    music: true,
    sfx: true,
    vibration: true,
    announcer: true
  };

  let progress = loadProgress();
  let currentObjective = null;
  let levelDuration = 90;
  let highestMultiplierThisLevel = 1;
  let createdSpecialsThisLevel = 0;
  let usedSpecialsThisLevel = 0;

  function loadProgress() {
    try {
      return { ...defaultProgress, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (_) {
      return { ...defaultProgress };
    }
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    updatePlayerStatus();
  }

  function worldForLevel(value) {
    return WORLDS.find((world) => value >= world.start && value <= world.end) || WORLDS[0];
  }

  function setTheme(theme) {
    selectedTheme = theme;
    FRUITS = THEMES[theme] || THEMES.fruits;
    document.body.className = `theme-${theme}`;
    document.querySelectorAll('.t-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.theme === theme);
    });
    $('playBtn').disabled = false;
  }

  const SnackAudio = (() => {
    let ctx = null;
    let master = null;
    let musicGain = null;
    let sfxGain = null;
    let running = false;
    let beat = 0;
    let timerId = null;

    const melody = [0, 4, 7, 11, 7, 4, 2, 7, 0, 4, 9, 7, 4, 2, 0, -1];
    const bass = [0, 0, -5, -5, -3, -3, -5, -5];
    const root = 261.63;

    function ensure() {
      if (!ctx) {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return false;
        ctx = new AudioCtor();
        master = ctx.createGain();
        musicGain = ctx.createGain();
        sfxGain = ctx.createGain();
        master.gain.value = 0.72;
        musicGain.gain.value = progress.music ? 0.17 : 0;
        sfxGain.gain.value = progress.sfx ? 0.42 : 0;
        musicGain.connect(master);
        sfxGain.connect(master);
        master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return true;
    }

    function frequency(semitones) {
      return root * Math.pow(2, semitones / 12);
    }

    function note(freq, duration, type = 'sine', gain = 0.12, delay = 0, target = 'sfx') {
      if (!ensure()) return;
      const destination = target === 'music' ? musicGain : sfxGain;
      const start = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      amp.gain.setValueAtTime(0.0001, start);
      amp.gain.exponentialRampToValueAtTime(Math.max(0.001, gain), start + 0.018);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(amp);
      amp.connect(destination);
      osc.start(start);
      osc.stop(start + duration + 0.04);
    }

    function noise(duration = 0.12, gain = 0.08, delay = 0) {
      if (!ensure()) return;
      const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = ctx.createBufferSource();
      const amp = ctx.createGain();
      const start = ctx.currentTime + delay;
      source.buffer = buffer;
      amp.gain.setValueAtTime(gain, start);
      amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(amp);
      amp.connect(sfxGain);
      source.start(start);
    }

    function scheduleBeat() {
      if (!running) return;
      const urgent = typeof timeLeft === 'number' && timeLeft <= 20;
      const beatMs = urgent ? 122 : 165;
      const melodyStep = melody[beat % melody.length];
      const bassStep = bass[Math.floor(beat / 2) % bass.length];

      if (progress.music) {
        note(frequency(melodyStep + 12), urgent ? 0.11 : 0.15, 'triangle', urgent ? 0.085 : 0.065, 0, 'music');
        if (beat % 2 === 0) note(frequency(bassStep - 12), 0.22, 'sine', 0.09, 0, 'music');
        if (beat % 4 === 0) {
          note(frequency(bassStep), 0.3, 'triangle', 0.025, 0, 'music');
          note(frequency(bassStep + 7), 0.3, 'triangle', 0.02, 0.015, 'music');
        }
      }

      beat += 1;
      timerId = setTimeout(scheduleBeat, beatMs);
    }

    function startMusic() {
      if (!ensure() || running) return;
      running = true;
      beat = 0;
      scheduleBeat();
    }

    function stopMusic() {
      running = false;
      clearTimeout(timerId);
      timerId = null;
    }

    function setMusic(enabled) {
      progress.music = enabled;
      if (ensure()) musicGain.gain.setTargetAtTime(enabled ? 0.17 : 0, ctx.currentTime, 0.05);
      if (enabled && $('gameWrap')?.style.display !== 'none') startMusic();
      saveProgress();
    }

    function setSfx(enabled) {
      progress.sfx = enabled;
      if (ensure()) sfxGain.gain.setTargetAtTime(enabled ? 0.42 : 0, ctx.currentTime, 0.03);
      saveProgress();
    }

    function comboStinger(size) {
      if (!progress.sfx || !progress.announcer) return;
      ensure();
      const tier = size >= 10 ? 4 : size >= 8 ? 3 : size >= 7 ? 2 : size >= 5 ? 1 : 0;
      const base = 330 + tier * 55;
      const chord = tier >= 3 ? [0, 4, 7, 12, 16] : tier >= 1 ? [0, 4, 7, 12] : [0, 7, 12];
      chord.forEach((step, index) => note(base * Math.pow(2, step / 12), 0.22 + tier * 0.035, index % 2 ? 'square' : 'triangle', 0.11, index * 0.055));
      noise(0.1 + tier * 0.025, 0.08 + tier * 0.015, 0.02);
      if (tier >= 2) note(95, 0.38, 'sawtooth', 0.12, 0.11);
    }

    function specialStinger(type) {
      if (!progress.sfx) return;
      const patterns = {
        bomb: [170, 90, 55],
        row: [420, 650, 950],
        col: [950, 650, 420],
        cross: [260, 520, 1040, 1560],
        rainbow: [300, 420, 600, 850, 1200, 1700]
      };
      (patterns[type] || patterns.bomb).forEach((freq, i) => note(freq, 0.13 + i * 0.015, i % 2 ? 'square' : 'triangle', 0.1, i * 0.045));
      if (type === 'bomb' || type === 'cross') noise(0.22, 0.14, 0.08);
    }

    function victory() {
      stopMusic();
      if (!progress.sfx) return;
      [523, 659, 784, 1047, 1319].forEach((freq, i) => note(freq, 0.28, 'triangle', 0.13, i * 0.11));
    }

    function failure() {
      stopMusic();
      if (!progress.sfx) return;
      [330, 277, 220, 165].forEach((freq, i) => note(freq, 0.3, 'sawtooth', 0.08, i * 0.13));
    }

    function click() {
      if (progress.sfx) note(720, 0.06, 'triangle', 0.06);
    }

    return { startMusic, stopMusic, setMusic, setSfx, comboStinger, specialStinger, victory, failure, click };
  })();

  window.SnackAudio = SnackAudio;

  speakCombo = function speakComboArcade(size) {
    if (!voiceEnabled || !progress.announcer || size < 4) return;
    SnackAudio.comboStinger(size);
    const words = size >= 10 ? 'SNACK LÉGENDAIRE !' : size >= 8 ? 'MÉGA ATTAQUE !' : size >= 7 ? 'INCROYABLE !' : size >= 5 ? 'SUPER SNACK !' : 'COMBO !';
    showAnnouncer(words, size);
  };

  function showAnnouncer(text, size) {
    const el = document.createElement('div');
    el.className = `v2-announcer tier-${size >= 10 ? 4 : size >= 8 ? 3 : size >= 7 ? 2 : size >= 5 ? 1 : 0}`;
    el.textContent = text;
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.2) rotate(-8deg)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.25) rotate(3deg)', opacity: 1, offset: .28 },
      { transform: 'translate(-50%,-50%) scale(1) rotate(0)', opacity: 1, offset: .62 },
      { transform: 'translate(-50%,-90%) scale(.85)', opacity: 0 }
    ], { duration: 1050, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => el.remove();
  }

  function createObjective(levelNumber) {
    const typeIndex = (levelNumber - 1) % 4;
    if (typeIndex === 0) {
      return { type: 'score', label: 'Atteins le score', goal: tgt(levelNumber), progress: 0 };
    }
    if (typeIndex === 1) {
      const fruit = FRUITS[(levelNumber * 3) % FRUITS.length];
      return { type: 'collect', label: `Récupère ${fruit}`, fruit, goal: 16 + Math.min(18, levelNumber), progress: 0 };
    }
    if (typeIndex === 2) {
      return { type: 'combo', label: 'Fais des combos de 5+', minSize: 5, goal: 3 + Math.floor(levelNumber / 10), progress: 0 };
    }
    return { type: 'special', label: 'Déclenche des snacks spéciaux', goal: 2 + Math.floor(levelNumber / 8), progress: 0 };
  }

  function objectiveDisplay() {
    if (!currentObjective) return `${score} / ${target}`;
    if (currentObjective.type === 'score') return `${score} / ${currentObjective.goal}`;
    if (currentObjective.type === 'collect') return `${currentObjective.fruit} ${currentObjective.progress} / ${currentObjective.goal}`;
    if (currentObjective.type === 'combo') return `Combo 5+ ${currentObjective.progress} / ${currentObjective.goal}`;
    return `Boosters ${currentObjective.progress} / ${currentObjective.goal}`;
  }

  function objectiveRatio() {
    if (!currentObjective) return Math.min(1, score / target);
    const value = currentObjective.type === 'score' ? score : currentObjective.progress;
    return Math.min(1, value / currentObjective.goal);
  }

  function objectiveComplete() {
    return objectiveRatio() >= 1;
  }

  const SPECIAL_ICON = { bomb: '💣', row: '↔️', col: '↕️', cross: '✳️', rainbow: '🌈' };

  function specialForGroup(size, indices) {
    if (size >= 9) return 'rainbow';
    if (size >= 7) return 'cross';
    if (size >= 6) {
      const rows = indices.map((i) => Math.floor(i / SIZE));
      const cols = indices.map((i) => i % SIZE);
      const rowSpan = Math.max(...rows) - Math.min(...rows);
      const colSpan = Math.max(...cols) - Math.min(...cols);
      return colSpan >= rowSpan ? 'row' : 'col';
    }
    if (size >= 5) return 'bomb';
    return null;
  }

  function specialArea(index, special, fruit) {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const result = [];
    if (special === 'bomb') {
      for (let rr = row - 1; rr <= row + 1; rr++) {
        for (let cc = col - 1; cc <= col + 1; cc++) {
          if (rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) result.push(idx(rr, cc));
        }
      }
    } else if (special === 'row') {
      for (let cc = 0; cc < SIZE; cc++) result.push(idx(row, cc));
    } else if (special === 'col') {
      for (let rr = 0; rr < SIZE; rr++) result.push(idx(rr, col));
    } else if (special === 'cross') {
      for (let cc = 0; cc < SIZE; cc++) result.push(idx(row, cc));
      for (let rr = 0; rr < SIZE; rr++) result.push(idx(rr, col));
    } else if (special === 'rainbow') {
      grid.forEach((cell, i) => {
        if (cell?.fruit === fruit) result.push(i);
      });
    }
    return result;
  }

  function expandSpecials(initialIndices) {
    const affected = new Set(initialIndices);
    const triggered = new Set();
    const queue = [...initialIndices];
    while (queue.length) {
      const current = queue.shift();
      const cell = grid[current];
      if (!cell?.special || triggered.has(current)) continue;
      triggered.add(current);
      specialArea(current, cell.special, cell.fruit).forEach((next) => {
        if (!affected.has(next)) {
          affected.add(next);
          queue.push(next);
        }
      });
    }
    return { affected: [...affected], triggered: [...triggered] };
  }

  render = function renderV2(withFall = false) {
    board.innerHTML = '';
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const i = idx(r, c);
        const data = grid[i];
        const el = document.createElement('div');
        el.className = `cell${withFall ? ' fall' : ''}${data?.special ? ` special special-${data.special}` : ''}`;
        el.dataset.r = r;
        el.dataset.c = c;
        if (data) {
          const snack = document.createElement('span');
          snack.className = 'snack-symbol';
          snack.textContent = data.fruit;
          el.appendChild(snack);
          if (data.special) {
            const badge = document.createElement('span');
            badge.className = 'special-badge';
            badge.textContent = SPECIAL_ICON[data.special];
            el.appendChild(badge);
            el.setAttribute('aria-label', `${data.fruit}, snack spécial ${data.special}`);
          }
          if (withFall) el.style.animationDelay = ((SIZE - 1 - r) * 0.05 + Math.random() * 0.07) + 's';
        } else {
          el.style.visibility = 'hidden';
        }
        el.addEventListener('pointerenter', () => { if (!busy && !over) highlight(r, c); });
        el.addEventListener('click', () => { if (!busy && !over) tap(r, c); });
        board.appendChild(el);
      }
    }
  };

  highlight = function highlightV2(r, c) {
    fx.querySelectorAll('.laser').forEach((element) => element.remove());
    board.querySelectorAll('.cell').forEach((element) => element.classList.remove('hl', 'special-preview'));
    const cell = grid[idx(r, c)];
    const group = getGroup(r, c);
    let preview = group;
    if (cell?.special) preview = expandSpecials(group.length >= 2 ? group : [idx(r, c)]).affected;
    if (preview.length >= 2 || cell?.special) {
      preview.forEach((i) => {
        const rr = Math.floor(i / SIZE);
        const cc = i % SIZE;
        const element = board.querySelector(`.cell[data-r="${rr}"][data-c="${cc}"]`);
        if (element) element.classList.add(cell?.special ? 'special-preview' : 'hl');
      });
      $('msg').textContent = cell?.special
        ? `${SPECIAL_ICON[cell.special]} Active le snack spécial : ${preview.length} cases !`
        : `💥 Groupe ${group.length} → +${calcBase(group.length)} pts • Multi x${multiplier.toFixed(1)}`;
    } else {
      $('msg').textContent = 'Il faut 2+ collées 🙃';
    }
  };

  tap = function tapV2(r, c) {
    const current = grid[idx(r, c)];
    const group = getGroup(r, c);
    if (group.length < 2 && !current?.special) {
      sfxBad();
      const element = board.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
      if (element) {
        element.classList.add('shake');
        setTimeout(() => element.classList.remove('shake'), 300);
      }
      return;
    }
    doRemove(group.length >= 2 ? group : [idx(r, c)], r, c, Boolean(current?.special && group.length < 2));
  };

  doRemove = function doRemoveV2(initialIndices, cr, cc, forcedSpecial = false) {
    busy = true;
    moves--;
    updateMultiplier();
    highestMultiplierThisLevel = Math.max(highestMultiplierThisLevel, multiplier);

    const originalSize = initialIndices.length;
    const originalFruit = grid[idx(cr, cc)]?.fruit || randF();
    const expanded = expandSpecials(initialIndices);
    const indices = expanded.affected;
    const triggeredSpecials = expanded.triggered;
    const newSpecial = !forcedSpecial && !grid[idx(cr, cc)]?.special ? specialForGroup(originalSize, initialIndices) : null;
    const preserveIndex = newSpecial ? idx(cr, cc) : -1;

    if (newSpecial) createdSpecialsThisLevel++;
    if (triggeredSpecials.length) {
      usedSpecialsThisLevel += triggeredSpecials.length;
      triggeredSpecials.forEach((index) => SnackAudio.specialStinger(grid[index]?.special || 'bomb'));
    }

    const extra = Math.max(0, indices.length - originalSize);
    const base = forcedSpecial ? 120 + indices.length * 24 : calcBase(Math.max(2, originalSize)) + extra * 24;
    const gain = Math.floor(base * multiplier);
    score += gain;

    if (currentObjective.type === 'score') currentObjective.progress = score;
    if (currentObjective.type === 'collect') {
      const collected = indices.filter((index) => index !== preserveIndex && grid[index]?.fruit === currentObjective.fruit).length;
      currentObjective.progress += collected;
    }
    if (currentObjective.type === 'combo' && originalSize >= currentObjective.minSize) currentObjective.progress++;
    if (currentObjective.type === 'special') currentObjective.progress += triggeredSpecials.length;

    const cellSize = board.clientWidth / SIZE;
    const centerX = cc * cellSize + cellSize / 2;
    const centerY = cr * cellSize + cellSize / 2;
    createRing(centerX, centerY);

    const sorted = [...indices].sort((a, b) => {
      const ar = Math.floor(a / SIZE), ac = a % SIZE;
      const br = Math.floor(b / SIZE), bc = b % SIZE;
      return (Math.abs(ar - cr) + Math.abs(ac - cc)) - (Math.abs(br - cr) + Math.abs(bc - cc));
    });

    sorted.forEach((index, position) => {
      const rr = Math.floor(index / SIZE);
      const cellColumn = index % SIZE;
      const x = cellColumn * cellSize + cellSize / 2;
      const y = rr * cellSize + cellSize / 2;
      setTimeout(() => {
        const element = board.querySelector(`.cell[data-r="${rr}"][data-c="${cellColumn}"]`);
        if (element && index !== preserveIndex) element.classList.add('pop');
        const fruit = grid[index]?.fruit;
        if (fruit && index !== preserveIndex) {
          bottles[fruit] = (bottles[fruit] || 0) + 1;
          createParticles(x, y, fruit, indices.length >= 10 ? 7 : indices.length >= 6 ? 5 : 3);
        }
        if (position === Math.floor(sorted.length / 2)) createScoreFloat(x, y, gain, multiplier > 1.1);
      }, position * 30);
    });

    setTimeout(() => {
      if (originalSize >= 4) createCombo(originalSize, gain);
      if (newSpecial) showSpecialCreated(newSpecial);
    }, Math.max(70, originalSize * 16));

    if (originalSize >= 5 || triggeredSpecials.length) screenShake(originalSize >= 8 ? 2.6 : 1.3);
    if (originalSize >= 7 || triggeredSpecials.length >= 2) {
      slowMo(originalSize >= 10 ? 700 : 430);
      setTimeout(createConfetti, 60);
    }
    sfxPop(Math.max(2, originalSize));
    speakCombo(originalSize);

    $('msg').textContent = newSpecial
      ? `${SPECIAL_ICON[newSpecial]} Snack spécial créé • +${gain}`
      : triggeredSpecials.length
        ? `⚡ ${triggeredSpecials.length} snack(s) spécial(aux) déclenché(s) • +${gain}`
        : originalSize >= 7
          ? `🔥 MÉGA x${originalSize} • x${multiplier.toFixed(1)} +${gain}`
          : originalSize >= 5
            ? `💥 SUPER x${originalSize} • x${multiplier.toFixed(1)} +${gain}`
            : `💥 ${originalSize} → +${gain}`;

    const totalDelay = sorted.length * 30 + 360;
    setTimeout(() => {
      indices.forEach((index) => {
        if (index !== preserveIndex) grid[index] = null;
      });
      if (preserveIndex >= 0) grid[preserveIndex] = { fruit: originalFruit, special: newSpecial };

      for (let c = 0; c < SIZE; c++) {
        let write = SIZE - 1;
        for (let r = SIZE - 1; r >= 0; r--) {
          const index = idx(r, c);
          if (grid[index]) {
            if (write !== r) {
              grid[idx(write, c)] = grid[index];
              grid[index] = null;
            }
            write--;
          }
        }
        for (let r = write; r >= 0; r--) grid[idx(r, c)] = { fruit: randF() };
      }

      render(true);
      updBottles();
      updHUD();
      if (objectiveComplete()) {
        win();
        busy = false;
        return;
      }
      if (moves <= 0) {
        lose();
        busy = false;
        return;
      }
      if (!hasGroup(grid)) {
        $('msg').textContent = 'Plus de groupe → mélange automatique 🔀';
        setTimeout(() => { shuffleGrid(false); busy = false; }, 600);
      } else {
        busy = false;
      }
    }, totalDelay);
  };

  function showSpecialCreated(type) {
    const toast = document.createElement('div');
    toast.className = 'v2-special-toast';
    toast.innerHTML = `<span>${SPECIAL_ICON[type]}</span><b>${type === 'rainbow' ? 'SNACK ARC-EN-CIEL' : type === 'cross' ? 'SNACK CROIX' : type === 'row' || type === 'col' ? 'SNACK LASER' : 'SNACK BOMBE'}</b>`;
    document.body.appendChild(toast);
    toast.animate([
      { transform: 'translate(-50%,30px) scale(.7)', opacity: 0 },
      { transform: 'translate(-50%,0) scale(1.08)', opacity: 1, offset: .3 },
      { transform: 'translate(-50%,-20px) scale(.95)', opacity: 0 }
    ], { duration: 1100, easing: 'ease-out' }).onfinish = () => toast.remove();
  }

  updHUD = function updateHudV2() {
    $('lvl').textContent = level;
    $('sc').textContent = score;
    $('mv').textContent = moves;
    $('tm').textContent = Math.floor(timeLeft / 60) + ':' + String(timeLeft % 60).padStart(2, '0');
    $('obj').textContent = objectiveDisplay();
    $('fill').style.width = (objectiveRatio() * 100) + '%';
    $('shuffleBtn').textContent = `🔀 Mélanger (${shuffle})`;
    $('tm').classList.toggle('danger', timeLeft <= 20);
    const objectiveLabel = document.querySelector('.chip-row .chip:nth-child(3) .label');
    if (objectiveLabel && currentObjective) objectiveLabel.textContent = currentObjective.label;
    updatePlayerStatus();
  };

  startTimer = function startTimerV2() {
    clearInterval(timer);
    timeLeft = levelDuration;
    updHUD();
    timer = setInterval(() => {
      if (over) return;
      timeLeft--;
      updHUD();
      if (timeLeft === 20) showAnnouncer('VITE !', 7);
      if (timeLeft <= 0) lose();
    }, 1000);
  };

  startLevel = function startLevelV2() {
    const world = worldForLevel(level);
    setTheme(world.theme);
    score = 0;
    moves = 24 + Math.min(8, Math.floor(level / 4));
    target = tgt(level);
    currentObjective = createObjective(level);
    levelDuration = currentObjective.type === 'special' ? 115 : currentObjective.type === 'collect' ? 105 : 90;
    bottles = {};
    over = false;
    busy = false;
    shuffle = 2;
    highestMultiplierThisLevel = 1;
    createdSpecialsThisLevel = 0;
    usedSpecialsThisLevel = 0;
    grid = makeGrid();
    render(true);
    updBottles();
    updHUD();
    startTimer();
    SnackAudio.startMusic();
    $('msg').textContent = `🎯 ${currentObjective.label} • Crée des boosters avec 5+ snacks !`;
    $('welcome').textContent = `${world.icon} ${world.name} • Niveau ${level}`;
  };

  function calculateStars() {
    const moveBonus = moves >= 12 ? 1 : 0;
    const timeBonus = timeLeft >= Math.floor(levelDuration * 0.35) ? 1 : 0;
    return Math.min(3, 1 + moveBonus + timeBonus);
  }

  win = function winV2() {
    if (over) return;
    over = true;
    stopTimer();
    SnackAudio.victory();
    createConfetti();
    setTimeout(createConfetti, 180);
    setTimeout(createConfetti, 360);

    const stars = calculateStars();
    const coinReward = 20 + stars * 15 + Math.min(40, usedSpecialsThisLevel * 5);
    const previousStars = Number(progress.stars[level] || 0);
    progress.stars[level] = Math.max(previousStars, stars);
    progress.highestLevel = Math.max(progress.highestLevel, Math.min(25, level + 1));
    progress.coins += coinReward;
    saveProgress();

    $('winLvl').textContent = level;
    $('winTxt').innerHTML = `
      <div class="v2-win-stars">${[1, 2, 3].map((star) => `<span class="${star <= stars ? 'earned' : ''}">★</span>`).join('')}</div>
      <div><b>${currentObjective.label} terminé !</b></div>
      <div>${score} points • meilleur multiplicateur x${highestMultiplierThisLevel.toFixed(1)}</div>
      <div class="v2-reward">🪙 +${coinReward} pièces • ${createdSpecialsThisLevel} booster(s) créé(s)</div>`;
    $('ovWin').classList.add('show');
    updateMap();
  };

  lose = function loseV2() {
    if (over) return;
    over = true;
    stopTimer();
    SnackAudio.failure();
    $('loseTxt').innerHTML = `<b>${currentObjective.label}</b><br>${objectiveDisplay()}<br><span class="v2-tip">Astuce : un groupe de 5 crée une bombe, 9 crée un arc-en-ciel.</span>`;
    $('ovLose').classList.add('show');
  };

  const originalSfxPop = sfxPop;
  const originalSfxBad = sfxBad;
  const originalScreenShake = screenShake;
  sfxPop = function sfxPopV2(size) { if (progress.sfx) originalSfxPop(size); };
  sfxBad = function sfxBadV2() { if (progress.sfx) originalSfxBad(); };
  screenShake = function screenShakeV2(power = 1) {
    if (progress.vibration) originalScreenShake(power);
    else {
      document.body.classList.remove('shake');
      void document.body.offsetWidth;
      document.body.classList.add('shake');
      setTimeout(() => document.body.classList.remove('shake'), 360);
    }
  };

  function buildInterface() {
    const startCard = document.querySelector('.start-card');
    if (startCard && !document.getElementById('v2PlayerBar')) {
      const bar = document.createElement('div');
      bar.id = 'v2PlayerBar';
      bar.className = 'v2-player-bar';
      bar.innerHTML = '<span id="v2Stars">⭐ 0</span><span id="v2Coins">🪙 0</span><button id="mapBtn" type="button">🗺️ Carte</button><button id="settingsBtn" type="button">⚙️ Son</button>';
      startCard.insertBefore(bar, $('playBtn'));
    }

    const banner = document.querySelector('.banner');
    if (banner && !document.getElementById('v2MiniStatus')) {
      const status = document.createElement('div');
      status.id = 'v2MiniStatus';
      status.className = 'v2-mini-status';
      banner.appendChild(status);
    }

    if (!document.getElementById('v2Map')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div class="v2-modal" id="v2Map" aria-hidden="true">
          <div class="v2-modal-card v2-map-card">
            <button class="v2-close" data-close="v2Map">✕</button>
            <h2>🗺️ Carte de Snack Attack</h2>
            <p>Termine les niveaux pour débloquer les mondes.</p>
            <div id="v2Worlds"></div>
          </div>
        </div>
        <div class="v2-modal" id="v2Settings" aria-hidden="true">
          <div class="v2-modal-card">
            <button class="v2-close" data-close="v2Settings">✕</button>
            <h2>⚙️ Sons et sensations</h2>
            <div class="v2-setting"><span>🎵 Musique de jeu</span><button id="musicToggle"></button></div>
            <div class="v2-setting"><span>💥 Effets sonores</span><button id="sfxToggle"></button></div>
            <div class="v2-setting"><span>📣 Annonces arcade</span><button id="announcerToggle"></button></div>
            <div class="v2-setting"><span>📳 Vibrations</span><button id="vibrationToggle"></button></div>
          </div>
        </div>`);
    }

    $('mapBtn')?.addEventListener('click', () => { SnackAudio.click(); openModal('v2Map'); updateMap(); });
    $('settingsBtn')?.addEventListener('click', () => { SnackAudio.click(); openModal('v2Settings'); updateSettings(); });
    document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => closeModal(button.dataset.close)));
    document.querySelectorAll('.v2-modal').forEach((modal) => modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal.id); }));

    $('musicToggle')?.addEventListener('click', () => { SnackAudio.setMusic(!progress.music); updateSettings(); });
    $('sfxToggle')?.addEventListener('click', () => { SnackAudio.setSfx(!progress.sfx); updateSettings(); });
    $('announcerToggle')?.addEventListener('click', () => { progress.announcer = !progress.announcer; voiceEnabled = progress.announcer; saveProgress(); updateSettings(); updateVoiceButton(); });
    $('vibrationToggle')?.addEventListener('click', () => { progress.vibration = !progress.vibration; saveProgress(); updateSettings(); });

    const mapWinButton = document.createElement('button');
    mapWinButton.className = 'mainbtn v2-map-after-win';
    mapWinButton.textContent = '🗺️ Retour à la carte';
    mapWinButton.onclick = () => {
      $('ovWin').classList.remove('show');
      stopTimer();
      SnackAudio.stopMusic();
      $('gameWrap').style.display = 'none';
      $('startMenu').style.display = 'flex';
      openModal('v2Map');
      updateMap();
    };
    document.querySelector('#ovWin .o-card')?.appendChild(mapWinButton);

    updatePlayerStatus();
    updateSettings();
    updateMap();
    updateVoiceButton();
  }

  function totalStars() {
    return Object.values(progress.stars).reduce((sum, value) => sum + Number(value || 0), 0);
  }

  function updatePlayerStatus() {
    if ($('v2Stars')) $('v2Stars').textContent = `⭐ ${totalStars()}`;
    if ($('v2Coins')) $('v2Coins').textContent = `🪙 ${progress.coins}`;
    if ($('v2MiniStatus')) $('v2MiniStatus').textContent = `⭐ ${totalStars()}  •  🪙 ${progress.coins}`;
  }

  function openModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(id) {
    const modal = $(id);
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  function updateSettings() {
    const setButton = (id, enabled) => {
      const button = $(id);
      if (!button) return;
      button.textContent = enabled ? 'ON' : 'OFF';
      button.classList.toggle('on', enabled);
    };
    setButton('musicToggle', progress.music);
    setButton('sfxToggle', progress.sfx);
    setButton('announcerToggle', progress.announcer);
    setButton('vibrationToggle', progress.vibration);
  }

  function updateVoiceButton() {
    const button = $('voiceBtn');
    if (!button) return;
    button.textContent = progress.announcer ? '📣 Annonce ON' : '🔕 Annonce OFF';
    button.style.background = progress.announcer ? 'linear-gradient(160deg,#3ee6b0,#4fc3ff)' : 'linear-gradient(160deg,#666,#999)';
    button.onclick = () => {
      progress.announcer = !progress.announcer;
      voiceEnabled = progress.announcer;
      saveProgress();
      updateVoiceButton();
      updateSettings();
      if (progress.announcer) {
        SnackAudio.comboStinger(5);
        showAnnouncer('ANNONCES ACTIVÉES !', 5);
      }
    };
  }

  function updateMap() {
    const container = $('v2Worlds');
    if (!container) return;
    container.innerHTML = '';
    WORLDS.forEach((world) => {
      const worldLocked = progress.highestLevel < world.start;
      const section = document.createElement('section');
      section.className = `v2-world${worldLocked ? ' locked' : ''}`;
      section.innerHTML = `<h3>${world.icon} ${world.name} ${worldLocked ? '🔒' : ''}</h3><div class="v2-levels"></div>`;
      const levels = section.querySelector('.v2-levels');
      for (let value = world.start; value <= world.end; value++) {
        const unlocked = value <= progress.highestLevel;
        const button = document.createElement('button');
        button.className = `v2-level${unlocked ? '' : ' locked'}`;
        const stars = Number(progress.stars[value] || 0);
        button.innerHTML = `<b>${value}</b><small>${unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '🔒'}</small>`;
        button.disabled = !unlocked;
        if (unlocked) button.onclick = () => { closeModal('v2Map'); launchLevel(value); };
        levels.appendChild(button);
      }
      container.appendChild(section);
    });
  }

  function launchLevel(value) {
    level = Math.max(1, Math.min(25, value));
    const world = worldForLevel(level);
    setTheme(world.theme);
    $('startMenu').style.display = 'none';
    $('gameWrap').style.display = 'flex';
    comboChain = 0;
    multiplier = 1;
    startLevel();
  }

  function claimDailyReward() {
    const today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem(TODAY_KEY) === today) return;
    localStorage.setItem(TODAY_KEY, today);
    progress.coins += 50;
    saveProgress();
    const reward = document.createElement('div');
    reward.className = 'v2-modal show';
    reward.innerHTML = `<div class="v2-modal-card v2-daily"><div class="v2-gift">🎁</div><h2>Cadeau quotidien !</h2><p>Reviens chaque jour pour récupérer une récompense.</p><div class="v2-daily-coins">🪙 +50</div><button class="mainbtn">Récupérer</button></div>`;
    reward.querySelector('button').onclick = () => reward.remove();
    document.body.appendChild(reward);
  }

  function installGameButtons() {
    $('playBtn').onclick = () => launchLevel(progress.highestLevel || 1);
    $('restartBtn').onclick = () => { comboChain = 0; multiplier = 1; startLevel(); };
    $('backBtn').onclick = () => {
      stopTimer();
      SnackAudio.stopMusic();
      $('gameWrap').style.display = 'none';
      $('startMenu').style.display = 'flex';
      $('ovWin').classList.remove('show');
      $('ovLose').classList.remove('show');
      updatePlayerStatus();
    };
    $('nextBtn').onclick = () => {
      $('ovWin').classList.remove('show');
      level = Math.min(25, level + 1);
      startLevel();
    };
    $('retryBtn').onclick = () => { $('ovLose').classList.remove('show'); startLevel(); };
  }

  buildInterface();
  installGameButtons();
  setTheme(worldForLevel(progress.highestLevel).theme);
  setTimeout(claimDailyReward, 1200);
})();
