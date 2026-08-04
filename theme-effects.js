(() => {
  const SNACK_STYLE = {
    '🍓': { main: '#ff315f', light: '#ff8ca7', dark: '#b80e39', kind: 'juice', speck: '#fff2b8' },
    '🍊': { main: '#ff8500', light: '#ffc34a', dark: '#d45100', kind: 'juice', speck: '#ffe084' },
    '🍇': { main: '#7437d8', light: '#b47aff', dark: '#43208e', kind: 'juice', speck: '#e3c8ff' },
    '🍋': { main: '#f3d500', light: '#fff36a', dark: '#c99700', kind: 'juice', speck: '#fffbc2' },
    '🍒': { main: '#d81745', light: '#ff6580', dark: '#820d2d', kind: 'juice', speck: '#ffd3da' },
    '🍑': { main: '#ff8d78', light: '#ffc6a0', dark: '#df5c55', kind: 'juice', speck: '#ffe6c9' },

    '🥕': { main: '#ff7200', light: '#ffad35', dark: '#c94a00', kind: 'vegetable', speck: '#78c54b' },
    '🌽': { main: '#f4d529', light: '#fff08a', dark: '#d69a12', kind: 'vegetable', speck: '#6db84b' },
    '🍆': { main: '#64329d', light: '#a767dc', dark: '#3d1d68', kind: 'vegetable', speck: '#b4d76a' },
    '🥒': { main: '#43a947', light: '#8bd665', dark: '#237637', kind: 'vegetable', speck: '#d8f2a8' },
    '🍅': { main: '#ea2e31', light: '#ff7561', dark: '#a51020', kind: 'vegetable', speck: '#ffd584' },
    '🫑': { main: '#31ad5d', light: '#78dc73', dark: '#176b3c', kind: 'vegetable', speck: '#f5e78a' },

    '🥐': { main: '#c87a31', light: '#f3bd6d', dark: '#78401f', kind: 'crumb', speck: '#fff0c2' },
    '🥞': { main: '#c97f2c', light: '#f7ca72', dark: '#7f431d', kind: 'crumb', speck: '#8d4c20' },
    '🍩': { main: '#ff6da8', light: '#ffc4dc', dark: '#b13e74', kind: 'icing', speck: '#fff56b' },
    '🧇': { main: '#b86b2d', light: '#eaaa5d', dark: '#6f3a1d', kind: 'crumb', speck: '#ffe1a1' },
    '🥯': { main: '#b67a40', light: '#e9ba80', dark: '#70421f', kind: 'crumb', speck: '#fff0c7' },
    '🍪': { main: '#96592d', light: '#d99b5d', dark: '#5d321c', kind: 'crumb', speck: '#4a291a' },

    '🍦': { main: '#f3dfbe', light: '#fff7e8', dark: '#d3ad77', kind: 'cream', speck: '#ffaad2' },
    '🍨': { main: '#9edfff', light: '#f5d1ff', dark: '#6db8dc', kind: 'cream', speck: '#ffffff' },
    '🍧': { main: '#73d6ff', light: '#ff89bc', dark: '#4c99d4', kind: 'ice', speck: '#ffffff' },
    '🧁': { main: '#ff8fc7', light: '#ffd4e8', dark: '#b44f81', kind: 'cream', speck: '#f2d0a0' },
    '🍰': { main: '#f1d0a8', light: '#ffb0cf', dark: '#9e6b43', kind: 'crumb', speck: '#fff1d9' },
    '🍭': { main: '#ff5c91', light: '#67d6ff', dark: '#9b3ea7', kind: 'candy', speck: '#ffffff' },

    '🍕': { main: '#e94e35', light: '#ffd052', dark: '#9d2b20', kind: 'sauce', speck: '#73b54c' },
    '🍟': { main: '#f4cd37', light: '#fff08a', dark: '#c88120', kind: 'crumb', speck: '#e44935' },
    '🍔': { main: '#d37d2e', light: '#f2b65a', dark: '#753d1c', kind: 'sauce', speck: '#66a64d' },
    '🌮': { main: '#dda034', light: '#f6ce67', dark: '#8a511f', kind: 'crumb', speck: '#53b75c' },
    '🍿': { main: '#f3dfac', light: '#fff7d8', dark: '#b57d3d', kind: 'crumb', speck: '#d93b39' },
    '🌭': { main: '#d85b35', light: '#f4b33d', dark: '#8e2d25', kind: 'sauce', speck: '#f5e2a4' },
  };

  const FALLBACK = { main: '#ff4f9a', light: '#ffd45e', dark: '#7d2fc7', kind: 'juice', speck: '#ffffff' };
  let glassLayerElement = null;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function glassLayer() {
    if (glassLayerElement?.isConnected) return glassLayerElement;
    glassLayerElement = document.createElement('div');
    glassLayerElement.id = 'snackGlassEffects';
    glassLayerElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glassLayerElement);
    return glassLayerElement;
  }

  function exactViewportPoint(localX, localY) {
    const board = document.getElementById('board');
    if (!board) return { x: localX, y: localY };

    const boardRect = board.getBoundingClientRect();
    const approximateX = boardRect.left + localX;
    const approximateY = boardRect.top + localY;
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    board.querySelectorAll('.cell').forEach((cell) => {
      const rect = cell.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(centerX - approximateX, centerY - approximateY);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { x: centerX, y: centerY, rect };
      }
    });

    return best || { x: approximateX, y: approximateY, rect: null };
  }

  function setMaterialVariables(element, style) {
    element.style.setProperty('--snack-main', style.main);
    element.style.setProperty('--snack-light', style.light);
    element.style.setProperty('--snack-dark', style.dark);
    element.style.setProperty('--snack-speck', style.speck);
  }

  function createImpact(style, x, y, intensity) {
    const impact = document.createElement('div');
    impact.className = `glass-impact material-${style.kind}`;
    impact.style.left = `${x}px`;
    impact.style.top = `${y}px`;
    impact.style.setProperty('--impact-size', `${random(62, 88) * intensity}px`);
    impact.style.setProperty('--impact-rotate', `${random(-28, 28)}deg`);
    setMaterialVariables(impact, style);
    glassLayer().appendChild(impact);
    impact.addEventListener('animationend', () => impact.remove(), { once: true });
  }

  function createDrop(style, x, y, intensity, index) {
    const drop = document.createElement('i');
    const angle = random(0, Math.PI * 2);
    const distance = random(24, 118) * intensity;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - random(4, 42);
    const size = random(7, 22) * Math.min(1.4, intensity);

    drop.className = `glass-drop material-${style.kind}`;
    drop.style.left = `${x}px`;
    drop.style.top = `${y}px`;
    drop.style.setProperty('--drop-x', `${dx}px`);
    drop.style.setProperty('--drop-y', `${dy}px`);
    drop.style.setProperty('--drop-fall', `${random(28, 130)}px`);
    drop.style.setProperty('--drop-size', `${size}px`);
    drop.style.setProperty('--drop-delay', `${index * 9}ms`);
    drop.style.setProperty('--drop-rotate', `${random(-280, 280)}deg`);
    setMaterialVariables(drop, style);
    glassLayer().appendChild(drop);
    drop.addEventListener('animationend', () => drop.remove(), { once: true });
  }

  function createChunk(style, emoji, x, y, intensity, index) {
    const chunk = document.createElement('b');
    const angle = random(-Math.PI, 0);
    const distance = random(32, 105) * intensity;
    const size = random(8, 19) * Math.min(1.35, intensity);

    chunk.className = `glass-chunk material-${style.kind}`;
    chunk.textContent = style.kind === 'ice' ? (index % 2 ? '◆' : '❄') : style.kind === 'crumb' ? (index % 2 ? '▪' : '•') : index % 3 === 0 ? emoji : '◆';
    chunk.style.left = `${x}px`;
    chunk.style.top = `${y}px`;
    chunk.style.setProperty('--chunk-x', `${Math.cos(angle) * distance}px`);
    chunk.style.setProperty('--chunk-y', `${Math.sin(angle) * distance}px`);
    chunk.style.setProperty('--chunk-fall', `${random(70, 190)}px`);
    chunk.style.setProperty('--chunk-size', `${size}px`);
    chunk.style.setProperty('--chunk-rotate', `${random(-540, 540)}deg`);
    chunk.style.setProperty('--chunk-delay', `${index * 12}ms`);
    setMaterialVariables(chunk, style);
    glassLayer().appendChild(chunk);
    chunk.addEventListener('animationend', () => chunk.remove(), { once: true });
  }

  function createDrip(style, x, y, intensity, index) {
    if (!['juice', 'vegetable', 'cream', 'icing', 'sauce'].includes(style.kind)) return;
    const drip = document.createElement('span');
    drip.className = `glass-drip material-${style.kind}`;
    drip.style.left = `${x + random(-42, 42) * intensity}px`;
    drip.style.top = `${y + random(-8, 18)}px`;
    drip.style.setProperty('--drip-width', `${random(5, 13) * intensity}px`);
    drip.style.setProperty('--drip-length', `${random(40, 125) * intensity}px`);
    drip.style.setProperty('--drip-delay', `${80 + index * 45}ms`);
    setMaterialVariables(drip, style);
    glassLayer().appendChild(drip);
    drip.addEventListener('animationend', () => drip.remove(), { once: true });
  }

  function createFrost(style, x, y, intensity) {
    if (style.kind !== 'ice' && style.kind !== 'cream') return;
    const frost = document.createElement('div');
    frost.className = 'glass-frost';
    frost.style.left = `${x}px`;
    frost.style.top = `${y}px`;
    frost.style.setProperty('--frost-size', `${110 * intensity}px`);
    setMaterialVariables(frost, style);
    glassLayer().appendChild(frost);
    frost.addEventListener('animationend', () => frost.remove(), { once: true });
  }

  function splashSnackAtViewport(emoji, clientX, clientY, particleCount = 4) {
    const style = SNACK_STYLE[emoji] || FALLBACK;
    const intensity = Math.min(1.8, 0.86 + particleCount / 11);
    const x = Math.max(18, Math.min(window.innerWidth - 18, clientX));
    const y = Math.max(18, Math.min(window.innerHeight - 18, clientY));
    const dropCount = Math.min(20, Math.max(8, Math.round(particleCount * 1.65)));
    const chunkCount = Math.min(12, Math.max(4, Math.round(particleCount * 0.8)));

    createImpact(style, x, y, intensity);
    createFrost(style, x, y, intensity);
    for (let index = 0; index < dropCount; index++) createDrop(style, x, y, intensity, index);
    for (let index = 0; index < chunkCount; index++) createChunk(style, emoji, x, y, intensity, index);
    for (let index = 0; index < Math.min(4, Math.ceil(particleCount / 3)); index++) createDrip(style, x, y, intensity, index);
  }

  function splashFromBoard(localX, localY, emoji, particleCount) {
    const point = exactViewportPoint(localX, localY);
    splashSnackAtViewport(emoji, point.x, point.y, particleCount);
  }

  function screenBurst(size) {
    const flash = document.createElement('div');
    flash.className = 'glass-screen-flash';
    flash.style.setProperty('--flash-opacity', String(size >= 10 ? .42 : size >= 7 ? .3 : .2));
    glassLayer().appendChild(flash);
    flash.addEventListener('animationend', () => flash.remove(), { once: true });
  }

  // Déclencheur réel : cette fonction est appelée dans la boucle de suppression
  // de v2-system.js, une fois pour chaque snack cassé, avec son X, Y et son emoji.
  const originalCreateParticles = window.createParticles;
  window.createParticles = function createParticlesWithExactGlassSplash(x, y, emoji, count) {
    if (typeof originalCreateParticles === 'function') originalCreateParticles(x, y, emoji, count);
    splashFromBoard(x, y, emoji, count);
  };

  const originalCreateCombo = window.createCombo;
  window.createCombo = function createComboWithGlassFlash(size, points) {
    if (typeof originalCreateCombo === 'function') originalCreateCombo(size, points);
    if (size >= 4) screenBurst(size);
  };

  window.SnackThemeEffects = {
    splashSnackAtViewport,
    splashFromBoard,
    screenBurst,
    exactViewportPoint,
  };
})();
