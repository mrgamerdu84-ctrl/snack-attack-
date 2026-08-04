(() => {
  const native = window.SnackNativeFeedback;
  if (!native) {
    console.error('SnackNativeFeedback absent : sons natifs non initialisés.');
    return;
  }

  const STORAGE_KEY = 'snackAttackV2Progress';
  const readSettings = () => {
    try {
      return {
        music: true,
        sfx: true,
        announcer: true,
        vibration: true,
        ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
      };
    } catch (_) {
      return { music: true, sfx: true, announcer: true, vibration: true };
    }
  };

  let settings = readSettings();
  let nativeMusicFallback = false;
  let startingMusic = false;
  const musicPlayer = new Audio('audio/music-loop.ogg');
  musicPlayer.loop = true;
  musicPlayer.preload = 'auto';
  musicPlayer.volume = 0.58;
  musicPlayer.playsInline = true;

  native.setSfx(settings.sfx !== false);
  native.setAnnouncer(settings.announcer !== false);
  native.setVibration(settings.vibration !== false);

  async function stopMusicEverywhere(reset = false) {
    musicPlayer.pause();
    if (reset) {
      try { musicPlayer.currentTime = 0; } catch (_) {}
    }
    await native.stopMusic();
    nativeMusicFallback = false;
    startingMusic = false;
  }

  async function playMusicFromGesture() {
    settings = readSettings();
    if (settings.music === false || startingMusic) {
      if (settings.music === false) await stopMusicEverywhere(true);
      return false;
    }

    startingMusic = true;
    musicPlayer.volume = 0.58;
    musicPlayer.loop = true;

    try {
      await musicPlayer.play();
      await native.stopMusic();
      nativeMusicFallback = false;
      startingMusic = false;
      return true;
    } catch (webError) {
      console.warn('Lecture OGG WebView indisponible, démarrage audio natif.', webError);
      try {
        await native.init();
        nativeMusicFallback = await native.startMusic() !== false;
      } catch (nativeError) {
        console.error('Musique native impossible.', nativeError);
        nativeMusicFallback = false;
      }
      startingMusic = false;
      return nativeMusicFallback;
    }
  }

  musicPlayer.addEventListener('ended', () => {
    if (readSettings().music !== false) playMusicFromGesture();
  });
  musicPlayer.addEventListener('error', async () => {
    if (readSettings().music !== false) {
      await native.init();
      nativeMusicFallback = await native.startMusic() !== false;
    }
  });

  const audioApi = window.SnackAudio;
  if (audioApi) {
    const originalSetMusic = audioApi.setMusic?.bind(audioApi);
    const originalSetSfx = audioApi.setSfx?.bind(audioApi);
    const originalStopMusic = audioApi.stopMusic?.bind(audioApi);

    try { originalStopMusic?.(); } catch (_) {}

    audioApi.startMusic = () => playMusicFromGesture();
    audioApi.stopMusic = () => stopMusicEverywhere();
    audioApi.setMusic = (enabled) => {
      try { originalSetMusic?.(enabled); } catch (_) {}
      try { originalStopMusic?.(); } catch (_) {}
      settings = readSettings();
      if (enabled) playMusicFromGesture();
      else stopMusicEverywhere(true);
    };
    audioApi.setSfx = (enabled) => {
      try { originalSetSfx?.(enabled); } catch (_) {}
      settings = readSettings();
      native.setSfx(Boolean(enabled));
    };
    audioApi.comboStinger = (size) => {
      settings = readSettings();
      if (settings.sfx !== false) native.effect(size >= 8 ? 'rainbow' : 'pop');
      if (settings.announcer !== false) {
        const voice = size >= 10 ? 'legendary' : size >= 8 ? 'mega' : size >= 5 ? 'super' : 'combo';
        native.announce(voice);
      }
      native.impact(size >= 8 ? 'heavy' : size >= 5 ? 'medium' : 'light');
    };
    audioApi.specialStinger = (type) => {
      const sound = type === 'rainbow' ? 'rainbow' : type === 'row' || type === 'col' ? 'laser' : 'bomb';
      native.effect(sound);
      native.impact(type === 'rainbow' || type === 'cross' ? 'heavy' : 'medium');
    };
    audioApi.victory = () => {
      stopMusicEverywhere(true);
      native.effect('victory');
      native.notify('success');
    };
    audioApi.failure = () => {
      stopMusicEverywhere(true);
      native.effect('failure');
      native.notify('error');
    };
    audioApi.click = () => {
      native.effect('pop');
      native.impact('light');
    };
  }

  window.sfxPop = (size) => {
    native.effect(size >= 10 ? 'rainbow' : size >= 7 ? 'laser' : size >= 5 ? 'bomb' : 'pop');
    native.impact(size >= 8 ? 'heavy' : size >= 5 ? 'medium' : 'light');
  };
  window.sfxBad = () => {
    native.effect('bad');
    native.impact('light');
  };
  window.screenShake = (power = 1) => {
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
    native.impact(power >= 2.4 ? 'heavy' : power >= 1.2 ? 'medium' : 'light');
    setTimeout(() => document.body.classList.remove('shake'), 360);
  };

  const originalStartTimer = window.startTimer;
  if (typeof originalStartTimer === 'function') {
    window.startTimer = function startTimerWithNativeAlert(...args) {
      const result = originalStartTimer.apply(this, args);
      let hurryPlayed = false;
      const watcher = setInterval(() => {
        if (typeof over !== 'undefined' && over) {
          clearInterval(watcher);
          return;
        }
        if (!hurryPlayed && typeof timeLeft === 'number' && timeLeft <= 20) {
          hurryPlayed = true;
          native.announce('hurry');
          native.notify('warning');
        }
      }, 500);
      return result;
    };
  }

  function markTest(button, successText) {
    if (!button) return;
    const original = button.textContent;
    button.textContent = successText;
    setTimeout(() => { button.textContent = original; }, 1400);
  }

  function addTestButtons() {
    const settingsCard = document.querySelector('#v2Settings .v2-modal-card');
    if (!settingsCard || document.getElementById('nativeSoundTests')) return;
    const panel = document.createElement('div');
    panel.id = 'nativeSoundTests';
    panel.style.cssText = 'margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,.2);display:grid;grid-template-columns:1fr 1fr;gap:8px';
    panel.innerHTML = `
      <button class="mainbtn" id="testMusicBtn" type="button">🎵 Tester musique</button>
      <button class="mainbtn" id="testVoiceBtn" type="button">📣 Tester annonce</button>
      <button class="mainbtn" id="testSfxBtn" type="button">💥 Tester effet</button>
      <button class="mainbtn" id="testHapticBtn" type="button">📳 Tester vibration</button>`;
    settingsCard.appendChild(panel);

    document.getElementById('testMusicBtn').onclick = async (event) => {
      const ok = await playMusicFromGesture();
      markTest(event.currentTarget, ok ? '🎵 Musique lancée' : '⚠️ Musique bloquée');
    };
    document.getElementById('testVoiceBtn').onclick = (event) => {
      native.announce('legendary');
      markTest(event.currentTarget, '📣 Annonce jouée');
    };
    document.getElementById('testSfxBtn').onclick = (event) => {
      native.effect('rainbow');
      window.SnackThemeEffects?.screenBurst?.(9);
      markTest(event.currentTarget, '💥 Effet joué');
    };
    document.getElementById('testHapticBtn').onclick = (event) => {
      native.notify('success');
      markTest(event.currentTarget, '📳 Vibration envoyée');
    };
  }

  async function initialize() {
    const count = await native.init();
    settings = readSettings();
    native.setSfx(settings.sfx !== false);
    native.setAnnouncer(settings.announcer !== false);
    native.setVibration(settings.vibration !== false);
    addTestButtons();
    console.info('Snack Attack audio natif prêt.', count);
  }

  const launchMusic = async () => {
    await native.init();
    await playMusicFromGesture();
  };

  document.addEventListener('pointerdown', () => native.init(), { once: true, capture: true });
  document.getElementById('playBtn')?.addEventListener('click', launchMusic, { capture: true });
  document.getElementById('relaxBtn')?.addEventListener('click', launchMusic, { capture: true });
  window.addEventListener('load', initialize, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopMusicEverywhere(false);
    else if (document.getElementById('gameWrap')?.style.display !== 'none' && readSettings().music !== false) playMusicFromGesture();
  });

  window.SnackMusicPlayer = {
    play: playMusicFromGesture,
    stop: () => stopMusicEverywhere(true),
    usingNativeFallback: () => nativeMusicFallback,
  };
})();
