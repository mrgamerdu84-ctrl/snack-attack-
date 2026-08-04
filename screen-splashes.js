(() => {
  const PROFILES = {
    '🍓': { primary: '#ef233c', secondary: '#ff6b81', kind: 'juice', pieces: ['seed', 'pulp'] },
    '🍊': { primary: '#ff7a00', secondary: '#ffc145', kind: 'juice', pieces: ['pulp', 'drop'] },
    '🍇': { primary: '#7b2cbf', secondary: '#c77dff', kind: 'juice', pieces: ['drop', 'pulp'] },
    '🍋': { primary: '#ffd60a', secondary: '#fff3a3', kind: 'juice', pieces: ['pulp', 'seed'] },
    '🍒': { primary: '#d90429', secondary: '#ff4d6d', kind: 'juice', pieces: ['drop', 'pulp'] },
    '🍑': { primary: '#ff8fab', secondary: '#ffc2d1', kind: 'juice', pieces: ['pulp', 'drop'] },

    '🥕': { primary: '#f77f00', secondary: '#ffb703', kind: 'vegetable', pieces: ['chip', 'leaf'] },
    '🌽': { primary: '#ffd60a', secondary: '#8ac926', kind: 'vegetable', pieces: ['kernel', 'leaf'] },
    '🍆': { primary: '#6a1b9a', secondary: '#ab47bc', kind: 'vegetable', pieces: ['chip', 'seed'] },
    '🥒': { primary: '#43a047', secondary: '#b7e4c7', kind: 'vegetable', pieces: ['chip', 'seed'] },
    '🍅': { primary: '#e63946', secondary: '#ff758f', kind: 'vegetable', pieces: ['pulp', 'seed'] },
    '🫑': { primary: '#2d9d45', secondary: '#f94144', kind: 'vegetable', pieces: ['chip', 'seed'] },

    '🥐': { primary: '#c9792b', secondary: '#ffd089', kind: 'crumb', pieces: ['crumb', 'flake'] },
    '🥞': { primary: '#c97b2d', secondary: '#f4c27a', kind: 'crumb', pieces: ['crumb', 'syrup'] },
    '🍩': { primary: '#ff70a6', secondary: '#8d5524', kind: 'crumb', pieces: ['crumb', 'sugar'] },
    '🧇': { primary: '#c9822c', secondary: '#f2c078', kind: 'crumb', pieces: ['crumb', 'flake'] },
    '🥯': { primary: '#b66a2c', secondary: '#f0c58f', kind: 'crumb', pieces: ['crumb', 'seed'] },
    '🍪': { primary: '#9c5b2c', secondary: '#5f3216', kind: 'crumb', pieces: ['crumb', 'chip'] },

    '🍦': { primary: '#fff0f6', secondary: '#ff9fcb', kind: 'cream', pieces: ['cream', 'frost'] },
    '🍨': { primary: '#f8c8dc', secondary: '#bde0fe', kind: 'cream', pieces: ['cream', 'frost'] },
    '🍧': { primary: '#80e1ff', secondary: '#ff70a6', kind: 'ice', pieces: ['ice', 'frost'] },
    '🧁': { primary: '#ff9fcb', secondary: '#f4c27a', kind: 'cream', pieces: ['cream', 'crumb'] },
    '🍰': { primary: '#fff0d6', secondary: '#ff758f', kind: 'cake', pieces: ['sponge', 'cream'] },
    '🍭': { primary: '#ff4d6d', secondary: '#4cc9f0', kind: 'sugar', pieces: ['shard', 'sugar'] },

    '🍕': { primary: '#f94144', secondary: '#ffd166', kind: 'sauce', pieces: ['cheese', 'crumb'] },
    '🍟': { primary: '#fcbf49', secondary: '#e63946', kind: 'crumb', pieces: ['strip', 'salt'] },
    '🍔': { primary: '#8d5524', secondary: '#ffd166', kind: 'sauce', pieces: ['crumb', 'cheese'] },
    '🌮': { primary: '#d28b36', secondary: '#6a994e', kind: 'crumb', pieces: ['crumb', 'leaf'] },
    '🍿': { primary: '#fff3b0', secondary: '#e63946', kind: 'crumb', pieces: ['flake', 'salt'] },
    '🌭': { primary: '#c1121f', secondary: '#fcbf49', kind: 'sauce', pieces: ['sauce', 'crumb'] }
  };

  const DEFAULTS = {
    fruits: { primary: '#ff4d6d', secondary: '#ffb703', kind: 'juice', pieces: ['drop', 'pulp'] },
    legumes: { primary: '#55a630', secondary: '#f77f00', kind: 'vegetable', pieces: ['chip', 'leaf'] },
    petitdej: { primary: '#c97b2d', secondary: '#f4c27a', kind: 'crumb', pieces: ['crumb', 'flake'] },
    glace: { primary: '#bde0fe', secondary: '#ffafcc', kind: 'cream', pieces: ['cream', 'frost'] },
    fastfood: { primary: '#f94144', secondary: '#ffd166', kind: 'sauce', pieces: ['sauce', 'crumb'] }
  };

  let overlay = null;

  function ensureOverlay() {
    if (overlay?.isConnected) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'snackGlassFx';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    return overlay;
  }

  function currentTheme() {
    const className = [...document.body.classList].find((name) => name.startsWith('theme-'));
    return className ? className.slice(6) : 'fruits';
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function choose(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function cleanup(node, delay = 1800) {
    window.setTimeout(() => node.remove(), delay);
  }

  function createGlassSplat(x, y, profile, intensity) {
    const splat = document.createElement('span');
    splat.className = `glass-splat splat-${profile.kind}`;
    splat.style.left = `${x}px`;
    splat.style.top = `${y}px`;
    splat.style.setProperty('--primary', profile.primary);
    splat.style.setProperty('--secondary', profile.secondary);
    splat.style.setProperty('--splat-size', `${random(46, 72) * intensity}px`);
    splat.style.setProperty('--splat-rotate', `${random(-35, 35)}deg`);
    ensureOverlay().appendChild(splat);
    cleanup(splat, 1500);
  }

  function createDroplet(x, y, profile, intensity) {
    const angle = random(0, Math.PI * 2);
    const distance = random(38, 145) * intensity;
    const particle = document.createElement('span');
    const piece = choose(profile.pieces);
    particle.className = `glass-particle piece-${piece} material-${profile.kind}`;
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--primary', Math.random() > 0.35 ? profile.primary : profile.secondary);
    particle.style.setProperty('--secondary', profile.secondary);
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance - random(18, 70)}px`);
    particle.style.setProperty('--fall', `${random(45, 150)}px`);
    particle.style.setProperty('--particle-size', `${random(5, 15) * Math.min(1.4, intensity)}px`);
    particle.style.setProperty('--particle-rotate', `${random(-620, 620)}deg`);
    particle.style.setProperty('--particle-duration', `${random(650, 1180)}ms`);
    ensureOverlay().appendChild(particle);
    cleanup(particle, 1450);
  }

  function createDrip(x, y, profile, intensity) {
    if (!['juice', 'cream', 'sauce', 'vegetable'].includes(profile.kind)) return;
    const drip = document.createElement('span');
    drip.className = `glass-drip material-${profile.kind}`;
    drip.style.left = `${x + random(-26, 26) * intensity}px`;
    drip.style.top = `${y + random(-12, 18)}px`;
    drip.style.setProperty('--primary', profile.primary);
    drip.style.setProperty('--drip-width', `${random(5, 11) * intensity}px`);
    drip.style.setProperty('--drip-height', `${random(28, 78) * intensity}px`);
    ensureOverlay().appendChild(drip);
    cleanup(drip, 1900);
  }

  function createFrost(x, y, profile, intensity) {
    if (!['cream', 'ice'].includes(profile.kind)) return;
    const frost = document.createElement('span');
    frost.className = 'glass-frost';
    frost.style.left = `${x}px`;
    frost.style.top = `${y}px`;
    frost.style.setProperty('--primary', profile.primary);
    frost.style.setProperty('--frost-size', `${random(75, 125) * intensity}px`);
    ensureOverlay().appendChild(frost);
    cleanup(frost, 1700);
  }

  function explodeAt({ x, y, snack, theme = currentTheme(), intensity = 1 }) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const profile = PROFILES[snack] || DEFAULTS[theme] || DEFAULTS.fruits;
    const power = Math.max(0.8, Math.min(1.9, intensity));
    createGlassSplat(x, y, profile, power);
    createDrip(x, y, profile, power);
    createFrost(x, y, profile, power);
    const amount = Math.round(9 + power * 7);
    for (let index = 0; index < amount; index += 1) createDroplet(x, y, profile, power);
  }

  window.SnackScreenFX = { explodeAt };
})();
