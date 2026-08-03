(() => {
  let selectedVoice = null;

  function loadVoice() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    selectedVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('fr') && voice.name?.toLowerCase().includes('google'))
      || voices.find((voice) => voice.lang?.toLowerCase().startsWith('fr'))
      || voices[0]
      || null;
  }

  function stop() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  function speak(text, options = {}) {
    if (!text || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      return Promise.resolve(false);
    }

    if ((options.queueStrategy ?? 0) === 0) stop();
    loadVoice();

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice?.lang || 'fr-FR';
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);
      window.speechSynthesis.speak(utterance);
    });
  }

  window.SnackTTS = {
    isNative: false,
    speak,
    stop,
    test: () => speak('Voix activée !', { rate: 1.05, pitch: 1.1 })
  };

  if ('speechSynthesis' in window) {
    loadVoice();
    window.speechSynthesis.onvoiceschanged = loadVoice;
  }
})();
