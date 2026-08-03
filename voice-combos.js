(() => {
  const pick = (choices) => choices[Math.floor(Math.random() * choices.length)];

  function say(text, options = {}) {
    if (!window.SnackTTS?.speak) return;
    window.SnackTTS.speak(text, options).catch((error) => {
      console.warn('Annonce de combo indisponible.', error);
    });
  }

  window.speakCombo = function speakComboNative(n) {
    if (!voiceEnabled || n < 4) return;

    let mainText = '';
    let followText = '';
    let rate = 1;
    let pitch = 1.1;

    if (n >= 10) {
      mainText = pick(['LÉGENDAIRE !', 'DINGUERIE !', 'T’es un monstre !']);
      followText = 'BOUM !';
      rate = 1.12;
      pitch = 1.28;
    } else if (n >= 8) {
      mainText = pick(['MÉGA COMBO !', 'ÉNORME !', 'OH LÀ LÀ !']);
      followText = 'Wouhou !';
      rate = 1.06;
      pitch = 1.2;
    } else if (n >= 7) {
      mainText = pick(['INCROYABLE !', 'MÉGA COMBO !']);
      rate = 1.04;
      pitch = 1.18;
    } else if (n >= 6) {
      mainText = pick(['SUPER COMBO !', 'BIEN JOUÉ !']);
      pitch = 1.15;
    } else if (n >= 5) {
      mainText = pick(['SUPER !', 'EXCELLENT !']);
    } else {
      mainText = 'COMBO !';
    }

    window.SnackTTS?.stop?.();

    setTimeout(() => {
      say(mainText, {
        rate,
        pitch,
        volume: 1,
        queueStrategy: 0
      });
    }, 80);

    if (followText) {
      setTimeout(() => {
        say(followText, {
          rate: 1.18,
          pitch: 1.35,
          volume: 0.95,
          queueStrategy: 1
        });
      }, n >= 10 ? 720 : 560);
    }

    if (multiplier >= 2) {
      setTimeout(() => {
        say(`Combo fois ${Math.floor(multiplier)} !`, {
          rate: 1.08,
          pitch: 1.14,
          volume: 0.9,
          queueStrategy: 1
        });
      }, followText ? 1180 : 720);
    }
  };

  window.announceVoiceEnabled = function announceVoiceEnabled() {
    if (!window.SnackTTS?.test) return Promise.resolve(false);
    return window.SnackTTS.test();
  };
})();
