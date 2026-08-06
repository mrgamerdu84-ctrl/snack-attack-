(() => {
  const COMBO_WINDOW_MS = 180;
  const IMPACT_COOLDOWN_MS = 520;

  let pendingCount = 0;
  let comboTimer = null;
  let lastImpactAt = 0;

  const previous = window.SnackScreenFX?.explodeAt;
  if (!previous) return;

  function flushImpact() {
    const count = pendingCount;
    pendingCount = 0;
    comboTimer = null;

    if (count < 6) return;

    const now = performance.now();
    if (now - lastImpactAt < IMPACT_COOLDOWN_MS) return;
    lastImpactAt = now;

    // L'extension ne crée plus de deuxième couche visuelle.
    // Elle garde seulement une vibration courte pour les gros combos.
    window.SnackNativeFeedback?.impact?.(count >= 9 ? 'heavy' : 'medium');
  }

  window.SnackScreenFX.explodeAt = (payload) => {
    previous(payload);

    const { x, y, snack } = payload || {};
    if (!Number.isFinite(x) || !Number.isFinite(y) || !snack) return;

    pendingCount += 1;
    window.clearTimeout(comboTimer);
    comboTimer = window.setTimeout(flushImpact, COMBO_WINDOW_MS);
  };

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    window.clearTimeout(comboTimer);
    pendingCount = 0;
    comboTimer = null;
  });
})();
