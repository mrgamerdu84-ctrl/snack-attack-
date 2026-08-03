(() => {
  const splash = document.getElementById('appSplash');
  if (!splash) return;

  const startedAt = performance.now();
  const minimumDuration = 1900;

  function closeSplash() {
    const wait = Math.max(0, minimumDuration - (performance.now() - startedAt));
    window.setTimeout(() => {
      splash.classList.add('hide');
      window.setTimeout(() => splash.remove(), 650);
    }, wait);
  }

  if (document.readyState === 'complete') closeSplash();
  else window.addEventListener('load', closeSplash, { once: true });

  window.setTimeout(closeSplash, 4200);
})();
