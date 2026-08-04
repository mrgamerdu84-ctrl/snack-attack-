(() => {
  const HARD_SNACKS = new Set(['🍭','🍪','🥯','🧇','🥤','🧋','🥫','🧊','🦀','🦞','🦐','🐟','🐠','🍖','🥩','🍗','🐙']);
  const STICKY_PIECES = {
    sodas: ['🥤','🧋','🥫','🧊'],
    fruitsmer: ['🦐','🦀','🦞','🦪'],
    viande: ['🥩','🍖','🍗','🥓'],
    poisson: ['🐟','🐠','🐡','🍣']
  };

  function overlay() {
    let layer = document.getElementById('snackGlassCrashFx');
    if (!layer) {
      layer = document.createElement('div');
      layer.id = 'snackGlassCrashFx';
      layer.setAttribute('aria-hidden', 'true');
      document.body.appendChild(layer);
    }
    return layer;
  }

  function themeName() {
    const cls = [...document.body.classList].find((name) => name.startsWith('theme-'));
    return cls ? cls.slice(6) : 'fruits';
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function addStuckPiece(x, y, snack, intensity) {
    const piece = document.createElement('span');
    piece.className = 'glass-stuck-piece';
    piece.textContent = snack;
    piece.style.left = `${x + rand(-34, 34) * intensity}px`;
    piece.style.top = `${y + rand(-30, 30) * intensity}px`;
    piece.style.setProperty('--piece-size', `${rand(16, 28) * Math.min(1.4, intensity)}px`);
    piece.style.setProperty('--piece-rotate', `${rand(-42, 42)}deg`);
    piece.style.setProperty('--piece-life', `${rand(2800, 5200)}ms`);
    overlay().appendChild(piece);
    window.setTimeout(() => piece.remove(), 5600);
  }

  function addCrack(x, y, intensity) {
    const crack = document.createElement('span');
    crack.className = 'glass-impact-crack';
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    crack.style.setProperty('--crack-size', `${rand(90, 155) * intensity}px`);
    crack.style.setProperty('--crack-rotate', `${rand(-24, 24)}deg`);
    overlay().appendChild(crack);
    document.body.classList.remove('glass-crash-shake');
    void document.body.offsetWidth;
    document.body.classList.add('glass-crash-shake');
    window.setTimeout(() => document.body.classList.remove('glass-crash-shake'), 420);
    window.setTimeout(() => crack.remove(), 3800);
  }

  function addImpactFlash(x, y) {
    const flash = document.createElement('span');
    flash.className = 'glass-impact-flash';
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    overlay().appendChild(flash);
    window.setTimeout(() => flash.remove(), 520);
  }

  const previous = window.SnackScreenFX?.explodeAt;
  if (!previous) return;

  window.SnackScreenFX.explodeAt = (payload) => {
    previous(payload);
    const { x, y, snack, intensity = 1 } = payload || {};
    if (!Number.isFinite(x) || !Number.isFinite(y) || !snack) return;

    const currentTheme = payload.theme || themeName();
    const visibleSnack = STICKY_PIECES[currentTheme]?.includes(snack) ? snack : snack;
    const pieceCount = Math.max(2, Math.round(2 + intensity * 2));
    for (let i = 0; i < pieceCount; i += 1) addStuckPiece(x, y, visibleSnack, intensity);

    const hardImpact = HARD_SNACKS.has(snack) || intensity >= 1.55;
    if (hardImpact) {
      addImpactFlash(x, y);
      addCrack(x, y, Math.min(1.35, intensity));
      window.SnackNativeFeedback?.vibrate?.('heavy');
    }
  };
})();
