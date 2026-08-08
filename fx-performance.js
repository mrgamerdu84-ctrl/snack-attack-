(() => {
  const previous = window.SnackScreenFX?.explodeAt;
  if (!previous) return;

  const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  const fewCores = Number.isFinite(navigator.hardwareConcurrency) && navigator.hardwareConcurrency <= 4;
  const lowMemory = Number.isFinite(navigator.deviceMemory) && navigator.deviceMemory <= 4;
  const mobileMode = coarsePointer || fewCores || lowMemory;

  const limits = {
    glass: mobileMode ? 72 : 120,
    crash: mobileMode ? 24 : 42
  };

  let lastExplosionAt = 0;

  function trimLayer(id, maxChildren) {
    const layer = document.getElementById(id);
    if (!layer) return;
    while (layer.childElementCount > maxChildren) {
      layer.firstElementChild?.remove();
    }
  }

  function trimEffects() {
    trimLayer('snackGlassFx', limits.glass);
    trimLayer('snackGlassCrashFx', limits.crash);
  }

  window.SnackScreenFX.explodeAt = (payload = {}) => {
    if (document.hidden) return;

    const now = performance.now();
    const intensity = Number.isFinite(payload.intensity) ? payload.intensity : 1;
    const minGap = reducedMotion ? 85 : mobileMode ? 52 : 32;
    const importantImpact = intensity >= 1.5;

    if (!importantImpact && now - lastExplosionAt < minGap) return;
    lastExplosionAt = now;

    previous({
      ...payload,
      intensity: reducedMotion ? Math.min(intensity, 1.05) : intensity
    });

    requestAnimationFrame(trimEffects);
  };

  window.SnackFxPerformance = {
    mobileMode,
    reducedMotion,
    trimEffects
  };
})();
