(() => {
  const CONFIG = {
    fruits: {
      label: 'Éclaboussure fruitée',
      colors: ['#ff365d', '#ff8a00', '#ffcf33', '#8d35ff', '#ff74b8'],
      fragments: ['drop', 'drop', 'pulp', 'seed'],
      symbols: ['•', '●', '◆', '✦'],
    },
    legumes: {
      label: 'Explosion croquante',
      colors: ['#3fbe47', '#8bd646', '#ff8f1f', '#f2d230', '#7e4ad7'],
      fragments: ['leaf', 'leaf', 'seed', 'strip'],
      symbols: ['◆', '❯', '•', '︱'],
    },
    petitdej: {
      label: 'Pluie de miettes',
      colors: ['#d88b3d', '#f5c16c', '#fff1c7', '#7a4028', '#ff9ec7'],
      fragments: ['crumb', 'crumb', 'sugar', 'chip'],
      symbols: ['▪', '•', '✦', '●'],
    },
    glace: {
      label: 'Souffle glacé',
      colors: ['#bff6ff', '#7bdcff', '#ffffff', '#d7b4ff', '#ff9bd5'],
      fragments: ['ice', 'snow', 'snow', 'cream'],
      symbols: ['◆', '❄', '✦', '●'],
    },
    fastfood: {
      label: 'Snack splash',
      colors: ['#ffd833', '#ff5a36', '#f59d2a', '#f5e2aa', '#8acb48'],
      fragments: ['cheese', 'sauce', 'crumb', 'crumb'],
      symbols: ['▬', '●', '▪', '•'],
    },
  };

  function currentTheme() {
    const className = [...document.body.classList].find((name) => name.startsWith('theme-'));
    return className ? className.slice(6) : 'fruits';
  }

  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function effectLayer() {
    return document.getElementById('fx') || document.querySelector('.board-frame');
  }

  function createFragment(x, y, theme, intensity = 1) {
    const config = CONFIG[theme] || CONFIG.fruits;
    const fragment = document.createElement('span');
    const kind = pick(config.fragments);
    const angle = randomBetween(0, Math.PI * 2);
    const distance = randomBetween(28, 72) * intensity;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance - randomBetween(5, 30);
    const size = randomBetween(5, kind === 'leaf' || kind === 'ice' ? 13 : 10) * Math.min(1.35, intensity);

    fragment.className = `theme-fragment theme-${theme} fragment-${kind}`;
    fragment.textContent = pick(config.symbols);
    fragment.style.left = `${x}px`;
    fragment.style.top = `${y}px`;
    fragment.style.setProperty('--dx', `${dx}px`);
    fragment.style.setProperty('--dy', `${dy}px`);
    fragment.style.setProperty('--fall', `${randomBetween(12, 42)}px`);
    fragment.style.setProperty('--rot', `${randomBetween(-420, 420)}deg`);
    fragment.style.setProperty('--size', `${size}px`);
    fragment.style.setProperty('--fragment-color', pick(config.colors));
    fragment.style.setProperty('--duration', `${randomBetween(520, 900)}ms`);

    effectLayer()?.appendChild(fragment);
    fragment.addEventListener('animationend', () => fragment.remove(), { once: true });
  }

  function createDust(x, y, theme, intensity = 1) {
    const layer = effectLayer();
    if (!layer) return;
    const config = CONFIG[theme] || CONFIG.fruits;
    const dust = document.createElement('span');
    dust.className = `theme-dust theme-${theme}`;
    dust.style.left = `${x}px`;
    dust.style.top = `${y}px`;
    dust.style.setProperty('--dust-color', pick(config.colors));
    dust.style.setProperty('--dust-size', `${48 + intensity * 28}px`);
    layer.appendChild(dust);
    dust.addEventListener('animationend', () => dust.remove(), { once: true });
  }

  function themedBurst(x, y, count = 3) {
    const theme = currentTheme();
    const intensity = Math.min(1.65, 0.85 + count / 14);
    const amount = Math.min(12, Math.max(4, Math.round(count * 0.8)));
    createDust(x, y, theme, intensity);
    for (let index = 0; index < amount; index++) {
      createFragment(x, y, theme, intensity);
    }
  }

  function screenBurst(size) {
    const frame = document.getElementById('frame');
    if (!frame) return;
    const theme = currentTheme();
    const config = CONFIG[theme] || CONFIG.fruits;
    const burst = document.createElement('div');
    burst.className = `theme-screen-burst theme-${theme}`;
    burst.style.setProperty('--burst-color-a', config.colors[0]);
    burst.style.setProperty('--burst-color-b', config.colors[1]);
    burst.style.setProperty('--burst-opacity', String(size >= 10 ? 0.72 : size >= 7 ? 0.56 : 0.38));
    frame.appendChild(burst);
    burst.addEventListener('animationend', () => burst.remove(), { once: true });

    if (size >= 7) {
      const title = document.createElement('div');
      title.className = `theme-effect-title theme-${theme}`;
      title.textContent = config.label;
      frame.appendChild(title);
      title.addEventListener('animationend', () => title.remove(), { once: true });
    }
  }

  function edgeSpray(size) {
    const layer = effectLayer();
    if (!layer) return;
    const width = layer.clientWidth;
    const height = layer.clientHeight;
    const theme = currentTheme();
    const amount = size >= 10 ? 34 : size >= 7 ? 24 : 14;
    for (let index = 0; index < amount; index++) {
      const x = index % 2 ? randomBetween(0, width * 0.22) : randomBetween(width * 0.78, width);
      const y = randomBetween(height * 0.15, height * 0.85);
      createFragment(x, y, theme, size >= 10 ? 1.6 : 1.25);
    }
  }

  const originalCreateParticles = window.createParticles;
  if (typeof originalCreateParticles === 'function') {
    window.createParticles = function createParticlesWithTheme(x, y, emoji, count) {
      originalCreateParticles(x, y, emoji, count);
      themedBurst(x, y, count);
    };
  }

  const originalCreateCombo = window.createCombo;
  if (typeof originalCreateCombo === 'function') {
    window.createCombo = function createComboWithTheme(size, points) {
      originalCreateCombo(size, points);
      if (size >= 4) screenBurst(size);
      if (size >= 7) edgeSpray(size);
    };
  }

  const originalCreateConfetti = window.createConfetti;
  if (typeof originalCreateConfetti === 'function') {
    window.createConfetti = function createThemedConfetti() {
      originalCreateConfetti();
      const layer = effectLayer();
      if (!layer) return;
      for (let index = 0; index < 16; index++) {
        createFragment(randomBetween(0, layer.clientWidth), randomBetween(-12, 30), currentTheme(), 1.35);
      }
    };
  }

  window.SnackThemeEffects = { themedBurst, screenBurst };
})();
