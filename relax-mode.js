(() => {
  const BEST_KEY = 'snackAttackRelaxBest';
  const state = {
    active: false,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    selectedTheme: 'fruits',
  };

  const original = {
    startLevel: window.startLevel,
    startTimer: window.startTimer,
    updateHud: window.updHUD,
    win: window.win,
    lose: window.lose,
    remove: window.doRemove,
  };

  function currentSelectedTheme() {
    if (typeof selectedTheme === 'string' && THEMES[selectedTheme]) return selectedTheme;
    const bodyTheme = [...document.body.classList].find((name) => name.startsWith('theme-'))?.slice(6);
    return THEMES[bodyTheme] ? bodyTheme : 'fruits';
  }

  function applyTheme(theme) {
    const safeTheme = THEMES[theme] ? theme : 'fruits';
    state.selectedTheme = safeTheme;
    selectedTheme = safeTheme;
    FRUITS = THEMES[safeTheme];
    document.body.className = `theme-${safeTheme} relax-active`;
    document.querySelectorAll('.t-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.theme === safeTheme);
    });
  }

  function saveBest() {
    if (!state.active) return;
    state.best = Math.max(state.best, Number(score || 0));
    localStorage.setItem(BEST_KEY, String(state.best));
  }

  function applyRelaxHud() {
    if (!state.active) return;
    const levelValue = document.getElementById('lvl');
    const movesValue = document.getElementById('mv');
    const timeValue = document.getElementById('tm');
    const objectiveValue = document.getElementById('obj');
    const objectiveLabel = document.querySelector('.chip-row .chip:nth-child(3) .label');
    const fill = document.getElementById('fill');
    const badge = document.querySelector('.mode-badge');
    const welcome = document.getElementById('welcome');

    if (levelValue) levelValue.textContent = 'ZEN';
    if (movesValue) movesValue.textContent = '∞';
    if (timeValue) {
      timeValue.textContent = '∞';
      timeValue.classList.remove('danger');
    }
    if (objectiveLabel) objectiveLabel.textContent = 'Mode';
    if (objectiveValue) objectiveValue.textContent = `Détente • record ${state.best}`;
    if (fill) fill.style.width = `${Math.min(100, (Number(score || 0) % 5000) / 50)}%`;
    if (badge) badge.textContent = '🌿 MODE DÉTENTE • PARTIE INFINIE';
    if (welcome) welcome.textContent = `Aucun chrono • Aucun niveau • Record ${state.best}`;

    const backButton = document.getElementById('backBtn');
    if (backButton) backButton.textContent = '↩️ Quitter détente';
  }

  function restoreAdventureLabels() {
    document.body.classList.remove('relax-active');
    const badge = document.querySelector('.mode-badge');
    const backButton = document.getElementById('backBtn');
    if (badge) badge.textContent = '🌟 V2 • BOOSTERS • COMBOS • AVENTURE';
    if (backButton) backButton.textContent = '↩️ Menu';
  }

  function ensurePlayableBoard() {
    if (!state.active || typeof hasGroup !== 'function') return;
    if (!hasGroup(grid)) {
      shuffleGrid(false);
      busy = false;
    }
    if (moves < 100000) moves = 999999999;
    applyRelaxHud();
  }

  function startRelaxSession() {
    state.active = true;
    state.selectedTheme = currentSelectedTheme();

    level = 1;
    comboChain = 0;
    multiplier = 1;
    original.startLevel();

    clearInterval(timer);
    timer = null;
    timeLeft = 0;
    moves = 999999999;
    score = 0;
    target = Number.MAX_SAFE_INTEGER;
    shuffle = 999999;
    over = false;
    busy = false;

    applyTheme(state.selectedTheme);
    grid = makeGrid();
    render(true);
    updBottles();
    window.updHUD();
    SnackAudio.startMusic();

    const message = document.getElementById('msg');
    if (message) message.textContent = '🌿 Détends-toi : joue aussi longtemps que tu veux.';
  }

  window.startTimer = function startTimerWithRelaxMode(...args) {
    if (!state.active) return original.startTimer.apply(this, args);
    clearInterval(timer);
    timer = null;
    timeLeft = 0;
    applyRelaxHud();
  };

  window.updHUD = function updateHudWithRelaxMode(...args) {
    const result = original.updateHud.apply(this, args);
    applyRelaxHud();
    return result;
  };

  window.win = function winWithRelaxMode(...args) {
    if (!state.active) return original.win.apply(this, args);
    saveBest();
    over = false;
    busy = false;
    document.getElementById('ovWin')?.classList.remove('show');
    applyRelaxHud();
    return undefined;
  };

  window.lose = function loseWithRelaxMode(...args) {
    if (!state.active) return original.lose.apply(this, args);
    saveBest();
    over = false;
    busy = false;
    moves = 999999999;
    document.getElementById('ovLose')?.classList.remove('show');
    applyRelaxHud();
    return undefined;
  };

  window.doRemove = function removeWithRelaxMode(...args) {
    const result = original.remove.apply(this, args);
    if (state.active) {
      setTimeout(() => {
        saveBest();
        ensurePlayableBoard();
      }, 2600);
    }
    return result;
  };

  window.startLevel = function startLevelWithRelaxMode(...args) {
    if (state.active) return startRelaxSession();
    restoreAdventureLabels();
    return original.startLevel.apply(this, args);
  };

  function installRelaxButton() {
    const playButton = document.getElementById('playBtn');
    if (!playButton || document.getElementById('relaxBtn')) return;

    const button = document.createElement('button');
    button.id = 'relaxBtn';
    button.type = 'button';
    button.className = 'mainbtn relax-mode-button';
    button.innerHTML = '<span>🌿 MODE DÉTENTE</span><small>Sans niveau, sans chrono, partie infinie</small>';
    playButton.insertAdjacentElement('afterend', button);

    button.addEventListener('click', () => {
      state.active = true;
      state.selectedTheme = currentSelectedTheme();
      document.getElementById('startMenu').style.display = 'none';
      document.getElementById('gameWrap').style.display = 'flex';
      startRelaxSession();
    });

    playButton.addEventListener('click', () => {
      state.active = false;
      restoreAdventureLabels();
    }, { capture: true });

    document.getElementById('backBtn')?.addEventListener('click', () => {
      saveBest();
      state.active = false;
      restoreAdventureLabels();
    }, { capture: true });
  }

  document.querySelectorAll('.t-card').forEach((card) => {
    card.addEventListener('click', () => {
      if (THEMES[card.dataset.theme]) state.selectedTheme = card.dataset.theme;
    });
  });

  installRelaxButton();
  window.SnackRelaxMode = {
    start: startRelaxSession,
    isActive: () => state.active,
    bestScore: () => state.best,
  };
})();
