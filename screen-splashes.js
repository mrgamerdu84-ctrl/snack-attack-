(() => {
  const PROFILES = {
    '🍓': { color: '#e63946', accent: '#ff758f', shape: 'pulp' },
    '🍊': { color: '#ff7a00', accent: '#ffc145', shape: 'pulp' },
    '🍇': { color: '#7b2cbf', accent: '#c77dff', shape: 'berry' },
    '🍋': { color: '#ffd60a', accent: '#fff3a3', shape: 'pulp' },
    '🍒': { color: '#c1121f', accent: '#ff4d6d', shape: 'berry' },
    '🍑': { color: '#ff8fab', accent: '#ffd0dc', shape: 'pulp' },
    '🥕': { color: '#f77f00', accent: '#ffb703', shape: 'chip' },
    '🌽': { color: '#ffd60a', accent: '#8ac926', shape: 'kernel' },
    '🍆': { color: '#6a1b9a', accent: '#ab47bc', shape: 'chip' },
    '🥒': { color: '#43a047', accent: '#b7e4c7', shape: 'chip' },
    '🍅': { color: '#e63946', accent: '#ff758f', shape: 'pulp' },
    '🫑': { color: '#2d9d45', accent: '#f94144', shape: 'chip' },
    '🥐': { color: '#c9792b', accent: '#ffd089', shape: 'crumb' },
    '🥞': { color: '#c97b2d', accent: '#f4c27a', shape: 'crumb' },
    '🍩': { color: '#ff70a6', accent: '#8d5524', shape: 'crumb' },
    '🧇': { color: '#c9822c', accent: '#f2c078', shape: 'crumb' },
    '🥯': { color: '#b66a2c', accent: '#f0c58f', shape: 'crumb' },
    '🍪': { color: '#9c5b2c', accent: '#5f3216', shape: 'crumb' },
    '🍦': { color: '#fff0f6', accent: '#ff9fcb', shape: 'cream' },
    '🍨': { color: '#f8c8dc', accent: '#bde0fe', shape: 'cream' },
    '🍧': { color: '#80e1ff', accent: '#ff70a6', shape: 'ice' },
    '🧁': { color: '#ff9fcb', accent: '#f4c27a', shape: 'cream' },
    '🍰': { color: '#fff0d6', accent: '#ff758f', shape: 'cake' },
    '🍭': { color: '#ff4d6d', accent: '#4cc9f0', shape: 'sugar' },
    '🍕': { color: '#f94144', accent: '#ffd166', shape: 'sauce' },
    '🍟': { color: '#fcbf49', accent: '#e63946', shape: 'strip' },
    '🍔': { color: '#8d5524', accent: '#ffd166', shape: 'crumb' },
    '🌮': { color: '#d28b36', accent: '#6a994e', shape: 'crumb' },
    '🍿': { color: '#fff3b0', accent: '#e63946', shape: 'crumb' },
    '🌭': { color: '#c1121f', accent: '#fcbf49', shape: 'sauce' }
  };

  let overlay = null;
  const random = (min, max) => min + Math.random() * (max - min);
  const cleanup = (node, delay) => window.setTimeout(() => node.remove(), delay);

  function ensureOverlay() {
    if (overlay?.isConnected) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'snackGlassFx';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    return overlay;
  }

  function addFoodChunk(x, y, snack, intensity) {
    const profile = PROFILES[snack] || { color: '#ff5964', accent: '#ffd166', shape: 'pulp' };
    const angle = random(-Math.PI * 0.92, -Math.PI * 0.08);
    const distance = random(90, 235) * intensity;
    const chunk = document.createElement('span');
    chunk.className = `food-impact-chunk food-${profile.shape}`;
    chunk.textContent = snack;
    chunk.style.left = `${x}px`;
    chunk.style.top = `${y}px`;
    chunk.style.setProperty('--food-color', profile.color);
    chunk.style.setProperty('--food-accent', profile.accent);
    chunk.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    chunk.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    chunk.style.setProperty('--fall', `${random(90, 210)}px`);
    chunk.style.setProperty('--size', `${random(18, 32) * Math.min(intensity, 1.45)}px`);
    chunk.style.setProperty('--spin', `${random(-760, 760)}deg`);
    chunk.style.setProperty('--duration', `${random(760, 1120)}ms`);
    ensureOverlay().appendChild(chunk);
    cleanup(chunk, 1300);
  }

  function addSplat(x, y, snack, intensity) {
    const profile = PROFILES[snack] || { color: '#ff5964', accent: '#ffd166' };
    const splat = document.createElement('span');
    splat.className = 'food-impact-splat';
    splat.style.left = `${x}px`;
    splat.style.top = `${y}px`;
    splat.style.setProperty('--food-color', profile.color);
    splat.style.setProperty('--food-accent', profile.accent);
    splat.style.setProperty('--splat-size', `${random(74, 120) * intensity}px`);
    splat.style.setProperty('--splat-rotate', `${random(-30, 30)}deg`);
    ensureOverlay().appendChild(splat);
    cleanup(splat, 1450);
  }

  function addGlassCrack(x, y, comboSize) {
    const crack = document.createElement('span');
    crack.className = `combo-glass-crack crack-tier-${comboSize >= 9 ? 3 : comboSize >= 7 ? 2 : 1}`;
    crack.style.left = `${x}px`;
    crack.style.top = `${y}px`;
    crack.style.setProperty('--crack-size', `${Math.min(285, 145 + comboSize * 13)}px`);
    crack.style.setProperty('--crack-rotate', `${random(-24, 24)}deg`);
    ensureOverlay().appendChild(crack);
    cleanup(crack, comboSize >= 9 ? 1900 : 1450);
  }

  function comboImpact({ x, y, snack, comboSize = 4, crack = false, intensity = 1 }) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || comboSize < 4) return;
    const power = Math.max(0.85, Math.min(1.6, intensity));
    addFoodChunk(x, y, snack, power);
    if (Math.random() > 0.35) addFoodChunk(x, y, snack, power * 0.82);
    if (crack) {
      addSplat(x, y, snack, power);
      addGlassCrack(x, y, comboSize);
      document.body.classList.add('combo-impact-focus');
      window.setTimeout(() => document.body.classList.remove('combo-impact-focus'), 260);
    }
  }

  window.SnackScreenFX = { comboImpact };
})();
