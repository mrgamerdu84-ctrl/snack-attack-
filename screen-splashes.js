(() => {
  let overlay = null;

  function ensureOverlay() {
    if (overlay?.isConnected) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'snackGlassFx';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
    return overlay;
  }

  const random = (min, max) => min + Math.random() * (max - min);
  const cleanup = (node, delay = 1500) => window.setTimeout(() => node.remove(), delay);

  function addSlash(x, y, power) {
    const slash = document.createElement('span');
    slash.className = 'slice-slash';
    slash.style.left = `${x}px`;
    slash.style.top = `${y}px`;
    slash.style.setProperty('--slash-length', `${random(150, 245) * power}px`);
    slash.style.setProperty('--slash-angle', `${random(-48, 48)}deg`);
    ensureOverlay().appendChild(slash);
    cleanup(slash, 700);
  }

  function addBurst(x, y, power) {
    const burst = document.createElement('span');
    burst.className = 'slice-burst';
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    burst.style.setProperty('--burst-size', `${random(72, 112) * power}px`);
    burst.style.setProperty('--burst-angle', `${random(-20, 20)}deg`);
    ensureOverlay().appendChild(burst);
    cleanup(burst, 1200);
  }

  function addDrop(x, y, power) {
    const angle = random(-Math.PI * 0.95, Math.PI * 0.2);
    const distance = random(55, 190) * power;
    const drop = document.createElement('span');
    drop.className = 'slice-drop';
    drop.style.left = `${x}px`;
    drop.style.top = `${y}px`;
    drop.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    drop.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    drop.style.setProperty('--fall', `${random(55, 170)}px`);
    drop.style.setProperty('--drop-size', `${random(4, 12) * Math.min(power, 1.4)}px`);
    drop.style.setProperty('--drop-rotate', `${random(-540, 540)}deg`);
    drop.style.setProperty('--drop-duration', `${random(620, 1050)}ms`);
    ensureOverlay().appendChild(drop);
    cleanup(drop, 1250);
  }

  function addShard(x, y, power) {
    const angle = random(0, Math.PI * 2);
    const distance = random(48, 155) * power;
    const shard = document.createElement('span');
    shard.className = 'slice-shard';
    shard.style.left = `${x}px`;
    shard.style.top = `${y}px`;
    shard.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    shard.style.setProperty('--dy', `${Math.sin(angle) * distance}px`);
    shard.style.setProperty('--shard-size', `${random(7, 16) * Math.min(power, 1.35)}px`);
    shard.style.setProperty('--shard-rotate', `${random(-760, 760)}deg`);
    shard.style.setProperty('--shard-duration', `${random(520, 900)}ms`);
    ensureOverlay().appendChild(shard);
    cleanup(shard, 1050);
  }

  function addMist(x, y, power) {
    const mist = document.createElement('span');
    mist.className = 'slice-mist';
    mist.style.left = `${x}px`;
    mist.style.top = `${y}px`;
    mist.style.setProperty('--mist-size', `${random(110, 175) * power}px`);
    ensureOverlay().appendChild(mist);
    cleanup(mist, 900);
  }

  function explodeAt({ x, y, intensity = 1 }) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const power = Math.max(0.8, Math.min(1.8, intensity));
    addSlash(x, y, power);
    addBurst(x, y, power);
    addMist(x, y, power);
    const drops = Math.round(12 + power * 8);
    const shards = Math.round(6 + power * 5);
    for (let i = 0; i < drops; i += 1) addDrop(x, y, power);
    for (let i = 0; i < shards; i += 1) addShard(x, y, power);
  }

  window.SnackScreenFX = { explodeAt };
})();
