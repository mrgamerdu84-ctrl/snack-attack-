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
  native.setMusic(false);
  native.setSfx(settings.sfx !== false);
  native.setAnnouncer(settings.announcer !== false);
  native.setVibration(settings.vibration !== false);

  const audioApi = window.SnackAudio;
  if (audioApi) {
    const originalSetMusic = audioApi.setMusic?.bind(audioApi);
    const originalSetSfx = audioApi.setSfx?.bind(audioApi);
    const originalStopMusic = audioApi.stopMusic?.bind(audioApi);

    try { originalStopMusic?.(); } catch (_) {}

    audioApi.startMusic = () => {
      settings = readSettings();
      native.setMusic(settings.music !== false);
    };
    audioApi.stopMusic = () => native.stopMusic();
    audioApi.setMusic = (enabled) => {
      try { originalSetMusic?.(enabled); } catch (_) {}
      try { originalStopMusic?.(); } catch (_) {}
      settings = readSettings();
      native.setMusic(Boolean(enabled));
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
      native.stopMusic();
      native.effect('victory');
      native.notify('success');
    };
    audioApi.failure = () => {
      native.stopMusic();
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

    document.getElementById('testMusicBtn').onclick = async () => {
      await native.setMusic(true);
      setTimeout(() => native.stopMusic(), 3500);
    };
    document.getElementById('testVoiceBtn').onclick = () => native.announce('legendary');
    document.getElementById('testSfxBtn').onclick = () => native.effect('rainbow');
    document.getElementById('testHapticBtn').onclick = () => native.notify('success');
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

  document.addEventListener('pointerdown', () => native.init(), { once: true, capture: true });
  window.addEventListener('load', initialize, { once: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) native.stopMusic();
    else if (document.getElementById('gameWrap')?.style.display !== 'none' && readSettings().music !== false) native.setMusic(true);
  });
})();
