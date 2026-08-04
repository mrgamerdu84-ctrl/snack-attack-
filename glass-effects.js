(() => {
  const MATERIALS = {
    '🍓': { family: 'juice', primary: '#e91e45', secondary: '#ff7a96', dark: '#8f1028', chunk: '#ffccd6' },
    '🍊': { family: 'juice', primary: '#ff8a00', secondary: '#ffc14d', dark: '#c65300', chunk: '#fff0ba' },
    '🍇': { family: 'juice', primary: '#7137b8', secondary: '#b16de8', dark: '#3d176f', chunk: '#d9b7ff' },
    '🍋': { family: 'juice', primary: '#f2cf24', secondary: '#fff06a', dark: '#b58f00', chunk: '#fffbc4' },
    '🍒': { family: 'juice', primary: '#d9163c', secondary: '#ff5874', dark: '#850b28', chunk: '#ffd0d8' },
    '🍑': { family: 'juice', primary: '#ff8f72', secondary: '#ffc08f', dark: '#d95d51', chunk: '#ffe0bd' },
    '🥕': { family: 'veg', primary: '#f47621', secondary: '#ffb33f', dark: '#b84200', chunk: '#ffcf75' },
    '🌽': { family: 'veg', primary: '#f2c91d', secondary: '#fff177', dark: '#a98700', chunk: '#fff4a8' },
    '🍆': { family: 'veg', primary: '#7040a8', secondary: '#a46bd4', dark: '#3e176d', chunk: '#c9a5ef' },
    '🥒': { family: 'veg', primary: '#4aaf4f', secondary: '#8bd46f', dark: '#1f6f2d', chunk: '#c5edb0' },
    '🍅': { family: 'veg', primary: '#e32929', secondary: '#ff6860', dark: '#941313', chunk: '#ffc0b4' },
    '🫑': { family: 'veg', primary: '#43a843', secondary: '#86d95d', dark: '#1b6c2d', chunk: '#c5f2a3' },
    '🥐': { family: 'crumb', primary: '#d78a35', secondary: '#f3c46f', dark: '#7e431e', chunk: '#ffe0a3' },
    '🥞': { family: 'crumb', primary: '#d59a56', secondary: '#f2c782', dark: '#825025', chunk: '#fff0c4' },
    '🍩': { family: 'cream', primary: '#ef75a8', secondary: '#ffc0d6', dark: '#8f3b66', chunk: '#d79a5e' },
    '🧇': { family: 'crumb', primary: '#c88435', secondary: '#eebc70', dark: '#754017', chunk: '#f8d59a' },
    '🥯': { family: 'crumb', primary: '#c67d3b', secondary: '#efbd75', dark: '#77411f', chunk: '#f7d7a1' },
    '🍪': { family: 'crumb', primary: '#a7622f', secondary: '#d69a5f', dark: '#5d321b', chunk: '#f0c18c' },
    '🍦': { family: 'ice', primary: '#fff3cf', secondary: '#ffc7da', dark: '#d68ba8', chunk: '#ffffff' },
    '🍨': { family: 'ice', primary: '#f4d4ff', secondary: '#9fe7ff', dark: '#8f6aae', chunk: '#ffffff' },
    '🍧': { family: 'ice', primary: '#76d9ff', secondary: '#ff789d', dark: '#3a8fad', chunk: '#eaffff' },
    '🧁': { family: 'cream', primary: '#f58fc1', secondary: '#ffe1ef', dark: '#a84878', chunk: '#d99b58' },
    '🍰': { family: 'cream', primary: '#fff0cf', secondary: '#ff7895', dark: '#a54d59', chunk: '#f1c682' },
    '🍭': { family: 'candy', primary: '#ff4c7d', secondary: '#63d9ff', dark: '#8131a4', chunk: '#fff18e' },
    '🍕': { family: 'sauce', primary: '#e84b2f', secondary: '#ffd54a', dark: '#8d251a', chunk: '#f7c66d' },
    '🍟': { family: 'oil', primary: '#f5c72a', secondary: '#ffe783', dark: '#b67a00', chunk: '#fff0a8' },
    '🍔': { family: 'sauce', primary: '#bb5c2a', secondary: '#f4c13f', dark: '#6f301c', chunk: '#72b94e' },
    '🌮': { family: 'sauce', primary: '#e3a329', secondary: '#7ac64b', dark: '#8a4b18', chunk: '#f8db7b' },
    '🍿': { family: 'crumb', primary: '#fff3c2', secondary: '#ffd866', dark: '#a46a20', chunk: '#ffffff' },
    '🌭': { family: 'sauce', primary: '#d94732', secondary: '#f4c52f', dark: '#8c201d', chunk: '#efb96f' },
  };

  let impactSequence = 0;
  const materialFor = (snack) => MATERIALS[snack] || { family: 'juice', primary: '#ff4f86', secondary: '#ffd04d', dark: '#7b285c', chunk: '#ffffff' };
  const random = (min, max) => min + Math.random() * (max - min);

  function layer() {
    let target = document.getElementById('snackGlassFx');
    if (!target) {
      target = document.createElement('div');
      target.id = 'snackGlassFx';
      target.setAttribute('aria-hidden', 'true');
      document.body.appendChild(target);
    }
    return target;
  }

  function toViewport(x, y) {
    const boardElement = document.getElementById('board');
    if (!boardElement) return { x, y };
    const rect = boardElement.getBoundingClientRect();
    const scaleX = rect.width / Math.max(1, boardElement.clientWidth);
    const scaleY = rect.height / Math.max(1, boardElement.clientHeight);
    return { x: rect.left + x * scaleX, y: rect.top + y * scaleY };
  }

  function appendAnimated(element, duration = 1500) {
    layer().appendChild(element);
    window.setTimeout(() => element.remove(), duration + 120);
  }

  function createCore(x, y, material, intensity) {
    const core = document.createElement('div');
    core.className = `glass-splat-core glass-${material.family}`;
    const size = random(34, 54) * intensity;
    core.style.left = `${x}px`;
    core.style.top = `${y}px`;
    core.style.width = `${size}px`;
    core.style.height = `${size * random(.72, 1.12)}px`;
    core.style.setProperty('--primary', material.primary);
    core.style.setProperty('--secondary', material.secondary);
    core.style.setProperty('--dark', material.dark);
    core.style.setProperty('--turn', `${random(-35, 35)}deg`);
    appendAnimated(core, 1750);
  }

  function createDroplet(x, y, material, intensity, index) {
    const drop = document.createElement('i');
    drop.className = `glass-droplet glass-${material.family}`;
    const angle = random(0, Math.PI * 2);
    const distance = random(24, 96) * intensity;
    const size = random(4, 13) * Math.min(1.35, intensity);
    drop.style.left = `${x}px`;
    drop.style.top = `${y}px`;
    drop.style.width = `${size}px`;
    drop.style.height = `${size * random(.85, 1.55)}px`;
    drop.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    drop.style.setProperty('--dy', `${Math.sin(angle) * distance - random(4, 26)}px`);
    drop.style.setProperty('--drip', `${random(16, 74)}px`);
    drop.style.setProperty('--turn', `${random(-240, 240)}deg`);
    drop.style.setProperty('--delay', `${index * 7}ms`);
    drop.style.background = index % 3 === 0 ? material.secondary : material.primary;
    appendAnimated(drop, 1550);
  }

  function createChunk(x, y, material, intensity, index) {
    const chunk = document.createElement('b');
    chunk.className = `glass-chunk glass-${material.family}`;
    const angle = random(0, Math.PI * 2);
    const distance = random(30, 110) * intensity;
    const size = random(5, 14) * Math.min(1.4, intensity);
    chunk.style.left = `${x}px`;
    chunk.style.top = `${y}px`;
    chunk.style.width = `${size}px`;
    chunk.style.height = `${size * random(.55, 1.15)}px`;
    chunk.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    chunk.style.setProperty('--dy', `${Math.sin(angle) * distance - random(12, 44)}px`);
    chunk.style.setProperty('--fall', `${random(55, 150)}px`);
    chunk.style.setProperty('--turn', `${random(-520, 520)}deg`);
    chunk.style.setProperty('--delay', `${index * 9}ms`);
    chunk.style.background = index % 2 ? material.chunk : material.secondary;
    chunk.style.borderColor = material.dark;
    appendAnimated(chunk, 1500);
  }

  function createFrost(x, y, material, intensity) {
    const frost = document.createElement('div');
    frost.className = 'glass-frost';
    const size = random(78, 124) * intensity;
    frost.style.left = `${x}px`;
    frost.style.top = `${y}px`;
    frost.style.width = `${size}px`;
    frost.style.height = `${size}px`;
    frost.style.setProperty('--ice-a', material.primary);
    frost.style.setProperty('--ice-b', material.secondary);
    appendAnimated(frost, 1800);
  }

  function createSmear(x, y, material, intensity) {
    const smear = document.createElement('div');
    smear.className = `glass-smear glass-${material.family}`;
    smear.style.left = `${x}px`;
    smear.style.top = `${y}px`;
    smear.style.width = `${random(48, 86) * intensity}px`;
    smear.style.height = `${random(16, 30) * intensity}px`;
    smear.style.setProperty('--primary', material.primary);
    smear.style.setProperty('--secondary', material.secondary);
    smear.style.setProperty('--turn', `${random(-65, 65)}deg`);
    appendAnimated(smear, 1650);
  }

  function impact(snack, localX, localY, strength = 1) {
    const point = toViewport(localX, localY);
    const material = materialFor(snack);
    const intensity = Math.min(1.65, Math.max(.72, strength));
    impactSequence += 1;
    createCore(point.x, point.y, material, intensity);
    createSmear(point.x + random(-9, 9), point.y + random(-7, 7), material, intensity);
    const droplets = Math.round(random(7, 12) * intensity);
    const chunks = Math.round(random(3, 7) * intensity);
    for (let index = 0; index < droplets; index += 1) createDroplet(point.x, point.y, material, intensity, index);
    for (let index = 0; index < chunks; index += 1) createChunk(point.x, point.y, material, intensity, index);
    if (material.family === 'ice') createFrost(point.x, point.y, material, intensity);
    if (impactSequence % 5 === 0 && strength >= 1.1) {
      const flash = document.createElement('div');
      flash.className = 'glass-impact-flash';
      flash.style.setProperty('--flash-color', material.secondary);
      appendAnimated(flash, 420);
    }
  }

  const previousCreateParticles = window.createParticles;
  if (typeof previousCreateParticles === 'function') {
    window.createParticles = function createParticlesWithExactGlassImpact(x, y, snack, count = 3) {
      previousCreateParticles(x, y, snack, count);
      impact(snack, x, y, count >= 7 ? 1.45 : count >= 5 ? 1.18 : .92);
    };
  } else {
    console.error('Snack Attack: createParticles introuvable, effet vitre non branché.');
  }

  window.SnackGlassEffects = { impact, materialFor, toViewport };
})();
