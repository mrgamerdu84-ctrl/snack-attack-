import { Capacitor } from '@capacitor/core';
import { NativeAudio } from '@capacitor-community/native-audio';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

const ASSETS = {
  music: { file: 'music-loop.ogg', volume: 0.34, channels: 1 },
  pop: { file: 'pop.ogg', volume: 0.78, channels: 5 },
  bad: { file: 'bad.ogg', volume: 0.70, channels: 2 },
  bomb: { file: 'bomb.ogg', volume: 0.92, channels: 3 },
  laser: { file: 'laser.ogg', volume: 0.82, channels: 3 },
  rainbow: { file: 'rainbow.ogg', volume: 0.90, channels: 3 },
  victory: { file: 'victory.ogg', volume: 0.90, channels: 1 },
  failure: { file: 'failure.ogg', volume: 0.80, channels: 1 },
  combo: { file: 'combo.ogg', volume: 1.0, channels: 2 },
  super: { file: 'super.ogg', volume: 1.0, channels: 2 },
  mega: { file: 'mega.ogg', volume: 1.0, channels: 2 },
  legendary: { file: 'legendary.ogg', volume: 1.0, channels: 2 },
  hurry: { file: 'hurry.ogg', volume: 1.0, channels: 1 },
  unlock: { file: 'unlock.ogg', volume: 0.05, channels: 1 },
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

function assetPath(file) {
  return isNative ? `public/audio/${file}` : `audio/${file}`;
}

async function preloadNative(id, config) {
  try {
    await NativeAudio.preload({
      assetId: id,
      assetPath: assetPath(config.file),
      volume: config.volume,
      audioChannelNum: config.channels,
      isUrl: false,
    });
    loaded.add(id);
  } catch (error) {
    console.warn(`Audio natif non chargé: ${id}`, error);
  }
}

function preloadWeb(id, config) {
  const audio = new Audio(assetPath(config.file));
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
      await Promise.all(Object.entries(ASSETS).map(([id, config]) => preloadNative(id, config)));
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
  if (!musicEnabled || musicPlaying) return;
  musicPlaying = true;
  const ok = await play('music', { loop: true });
  if (!ok) musicPlaying = false;
}

async function stopMusic() {
  musicPlaying = false;
  await stop('music');
}

async function setMusic(enabled) {
  musicEnabled = Boolean(enabled);
  if (musicEnabled) await startMusic();
  else await stopMusic();
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

async function impact(level = 'medium') {
  if (!vibrationEnabled) return;
  try {
    const style = level === 'heavy' ? ImpactStyle.Heavy : level === 'light' ? ImpactStyle.Light : ImpactStyle.Medium;
    await Haptics.impact({ style });
  } catch (error) {
    if (navigator.vibrate) navigator.vibrate(level === 'heavy' ? 110 : level === 'light' ? 35 : 65);
  }
}

async function notify(type = 'success') {
  if (!vibrationEnabled) return;
  try {
    const nativeType = type === 'error' ? NotificationType.Error : type === 'warning' ? NotificationType.Warning : NotificationType.Success;
    await Haptics.notification({ type: nativeType });
  } catch (error) {
    if (navigator.vibrate) navigator.vibrate(type === 'error' ? [90, 50, 120] : [45, 35, 70]);
  }
}

async function testAll() {
  const count = await init();
  await effect('pop');
  await impact('medium');
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
