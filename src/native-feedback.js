import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const ASSETS = {
  music: { file: 'music-loop.mp3', volume: 0.62, channels: 1 },
  pop: { file: 'pop.ogg', volume: 0.82, channels: 5 },
  bad: { file: 'bad.ogg', volume: 0.74, channels: 2 },
  bomb: { file: 'bomb.ogg', volume: 0.94, channels: 3 },
  laser: { file: 'laser.ogg', volume: 0.86, channels: 3 },
  rainbow: { file: 'rainbow.ogg', volume: 0.94, channels: 3 },
  victory: { file: 'victory.ogg', volume: 0.94, channels: 1 },
  failure: { file: 'failure.ogg', volume: 0.84, channels: 1 },
  combo: { file: 'combo.ogg', volume: 1.0, channels: 2 },
  super: { file: 'super.ogg', volume: 1.0, channels: 2 },
  mega: { file: 'mega.ogg', volume: 1.0, channels: 2 },
  legendary: { file: 'legendary.ogg', volume: 1.0, channels: 2 },
  hurry: { file: 'hurry.ogg', volume: 1.0, channels: 1 },
  unlock: { file: 'unlock.ogg', volume: 0.08, channels: 1 },
};

const isNative = Capacitor.isNativePlatform();
const webAudio = new Map();
const loaded = new Set();
let initPromise = null;
let musicEnabled = true;
let sfxEnabled = true;
let announcerEnabled = true;
let vibrationEnabled = true;
let musicPlaying = false;

function nativePaths(file) {
  return [`audio/${file}`, `public/audio/${file}`, file];
}

function webPath(file) {
  return `audio/${file}`;
}

async function preloadNative(id, config) {
  let lastError = null;
  for (const path of nativePaths(config.file)) {
    try {
      await NativeAudio.preload({
        assetId: id,
        assetPath: path,
        volume: config.volume,
        audioChannelNum: config.channels,
        isUrl: false,
      });
      loaded.add(id);
      return;
    } catch (error) {
      lastError = error;
      try { await NativeAudio.unload({ assetId: id }); } catch (_) {}
    }
  }
  console.warn(`Audio natif non chargé: ${id}`, lastError);
}

function preloadWeb(id, config) {
  const audio = new Audio(webPath(config.file));
  audio.preload = 'auto';
  audio.volume = config.volume;
  audio.playsInline = true;
  webAudio.set(id, audio);
  loaded.add(id);
}

async function init() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (isNative) {
      try {
        await NativeAudio.configure({ fade: true, focus: false });
      } catch (error) {
        console.warn('Configuration audio native indisponible.', error);
      }
      for (const [id, config] of Object.entries(ASSETS)) {
        await preloadNative(id, config);
      }
    } else {
      Object.entries(ASSETS).forEach(([id, config]) => preloadWeb(id, config));
    }
    return loaded.size;
  })();
  return initPromise;
}

async function play(id, { loop = false } = {}) {
  await init();
  if (!loaded.has(id)) return false;
  try {
    if (isNative) {
      if (loop) await NativeAudio.loop({ assetId: id });
      else await NativeAudio.play({ assetId: id });
    } else {
      const base = webAudio.get(id);
      if (!base) return false;
      if (loop) {
        base.loop = true;
        base.currentTime = 0;
        await base.play();
      } else {
        const clone = base.cloneNode(true);
        clone.volume = base.volume;
        await clone.play();
      }
    }
    return true;
  } catch (error) {
    console.warn(`Lecture audio impossible: ${id}`, error);
    return false;
  }
}

async function stop(id) {
  await init();
  try {
    if (isNative) await NativeAudio.stop({ assetId: id });
    else {
      const audio = webAudio.get(id);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  } catch (_) {}
}

async function startMusic() {
  if (!musicEnabled || musicPlaying) return false;
  musicPlaying = true;
  const ok = await play('music', { loop: true });
  if (!ok) musicPlaying = false;
  return ok;
}

async function stopMusic() {
  musicPlaying = false;
  await stop('music');
}

async function setMusic(enabled) {
  musicEnabled = Boolean(enabled);
  if (musicEnabled) return startMusic();
  await stopMusic();
  return true;
}

function setSfx(enabled) { sfxEnabled = Boolean(enabled); }
function setAnnouncer(enabled) { announcerEnabled = Boolean(enabled); }
function setVibration(enabled) { vibrationEnabled = Boolean(enabled); }

async function effect(id) {
  if (!sfxEnabled) return false;
  return play(id);
}

async function announce(id) {
  if (!announcerEnabled) return false;
  return play(id);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function vibrateDuration(duration) {
  if (!vibrationEnabled) return false;
  let worked = false;
  try {
    await Haptics.vibrate({ duration });
    worked = true;
  } catch (_) {}
  try {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
      worked = true;
    }
  } catch (_) {}
  return worked;
}

async function impact(level = 'medium') {
  if (!vibrationEnabled) return;
  const duration = level === 'heavy' ? 145 : level === 'light' ? 45 : 85;
  await vibrateDuration(duration);
  try {
    const style = level === 'heavy' ? ImpactStyle.Heavy : level === 'light' ? ImpactStyle.Light : ImpactStyle.Medium;
    await Haptics.impact({ style });
  } catch (_) {}
}

async function notify(type = 'success') {
  if (!vibrationEnabled) return;
  const pattern = type === 'error' ? [110, 70, 160] : type === 'warning' ? [70, 55, 110] : [45, 45, 90];
  for (let index = 0; index < pattern.length; index++) {
    await vibrateDuration(pattern[index]);
    if (index < pattern.length - 1) await wait(55);
  }
}

async function testAll() {
  const count = await init();
  await effect('pop');
  await notify('success');
  return count;
}

window.SnackNativeFeedback = {
  init,
  startMusic,
  stopMusic,
  setMusic,
  setSfx,
  setAnnouncer,
  setVibration,
  effect,
  announce,
  impact,
  notify,
  testAll,
  isNative,
};
