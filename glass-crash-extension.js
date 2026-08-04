(() => {
  const HARD_SNACKS = new Set(['🍭','🍪','🥯','🧇','🥤','🧋','🥫','🧊','🦀','🦞','🦐','🐟','🐠','🍖','🥩','🍗','🐙']);
  const MAX_EFFECT_NODES = 14;
  const COMBO_WINDOW_MS = 230;

  let pending = [];
  let comboTimer = null;
  let lastImpactAt = 0;

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

  function trimOverlay() {
    const layer = overlay();
    while (layer.childElementCount > MAX_EFFECT_NODES) {
      layer.firstElementChild?.remove();
    }
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function addPiece(x, y, snack, intensity, delay = 0) {
    window.setTimeout(() => {
      const piece = document.createElement('span');
      piece.className = 'glass-stuck-piece';
      piece.textContent = snack;
      piece.style.left = `${x + rand(-30, 30) * intensity}px`;
      piece.style.top = `${y + rand(-26, 26) * intensity}px`;
      piece.style.setProperty('--piece-size', `${rand(15, 23) * Math.min(1.25, intensity)}px`);
      piece.style.setProperty('--piece-rotate', `${rand(-36, 36)}deg`);
      piece.style.setProperty('--piece-life', `${rand(900, 1500)}ms`);
      overlay().appendChild(piece);
      trimOverlay();
      window.setTimeout(() => piece.remove(), 1650);
    }, delay);
  }

  function addCrack(x, y, intensity) {
    const oldCrack = overlay().querySelector('.glass-impact-crack');
    oldCrack?.remove();

    const crack = document.createElement('span');
    crack.className = 'glass-impact-crack';
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    crack.style.setProperty('--crack-size', `${Math.min(175, rand(105, 145) * intensity)}px`);
    crack.style.setProperty('--crack-rotate', `${rand(-18, 18)}deg`);
    overlay().appendChild(crack);
    trimOverlay();
    window.setTimeout(() => crack.remove(), 1500);
  }

  function addFlash(x, y) {
    const oldFlash = overlay().querySelector('.glass-impact-flash');
    oldFlash?.remove();

    const flash = document.createElement('span');
    flash.className = 'glass-impact-flash';
    flash.style.left = `${x}px`;
    flash.style.top = `${y}px`;
    overlay().appendChild(flash);
    trimOverlay();
    window.setTimeout(() => flash.remove(), 360);
  }

  function flushCombo() {
    const batch = pending;
    pending = [];
    comboTimer = null;

    // Aucun effet lourd pour les groupes ordinaires.
    if (batch.length < 4) return;

    const now = performance.now();
    if (now - lastImpactAt < 320) return;
    lastImpactAt = now;

    const center = batch[Math.floor(batch.length / 2)];
    const intensity = batch.length >= 9 ? 1.3 : batch.length >= 7 ? 1.16 : 1;
    const maxPieces = window.innerWidth < 430 ? 3 : 4;
    const pieceCount = Math.min(maxPieces, Math.max(2, Math.floor(batch.length / 2)));

    for (let index = 0; index < pieceCount; index += 1) {
      const item = batch[Math.floor(index * batch.length / pieceCount)] || center;
      addPiece(item.x, item.y, item.snack, intensity, index * 45);
    }

    const hardImpact = batch.length >= 6 || batch.some((item) => HARD_SNACKS.has(item.snack));
    if (hardImpact) {
      addFlash(center.x, center.y);
      addCrack(center.x, center.y, intensity);
      document.body.classList.remove('glass-crash-shake');
      void document.body.offsetWidth;
      document.body.classList.add('glass-crash-shake');
      window.setTimeout(() => document.body.classList.remove('glass-crash-shake'), 220);
      window.SnackNativeFeedback?.impact?.(batch.length >= 8 ? 'heavy' : 'medium');
    }
  }

  const previous = window.SnackScreenFX?.explodeAt;
  if (!previous) return;

  window.SnackScreenFX.explodeAt = (payload) => {
    // Le moteur principal conserve ses propres effets de combo.
    previous(payload);

    const { x, y, snack } = payload || {};
    if (!Number.isFinite(x) || !Number.isFinite(y) || !snack) return;

    pending.push({ x, y, snack });
    window.clearTimeout(comboTimer);
    comboTimer = window.setTimeout(flushCombo, COMBO_WINDOW_MS);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.clearTimeout(comboTimer);
      pending = [];
      overlay().replaceChildren();
    }
  });
})();
