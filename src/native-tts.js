import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

let nativeLanguage = null;
let selectedWebVoice = null;

function loadWebVoice() {
  if (!('speechSynthesis' in window)) return;
  const voices = window.speechSynthesis.getVoices();
  selectedWebVoice = voices.find((voice) => voice.lang?.toLowerCase().startsWith('fr') && voice.name?.toLowerCase().includes('google'))
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith('fr'))
    || voices[0]
    || null;
}

async function resolveNativeLanguage() {
  if (nativeLanguage) return nativeLanguage;

  try {
    const { languages } = await TextToSpeech.getSupportedLanguages();
    nativeLanguage = languages.find((language) => language.toLowerCase() === 'fr-fr')
      || languages.find((language) => language.toLowerCase().startsWith('fr'))
      || languages[0]
      || 'fr-FR';
  } catch {
    nativeLanguage = 'fr-FR';
  }

  return nativeLanguage;
}

function webStop() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

function webSpeak(text, options = {}) {
  if (!text || !('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
    return Promise.resolve(false);
  }

  if ((options.queueStrategy ?? 0) === 0) webStop();
  loadWebVoice();

  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedWebVoice;
    utterance.lang = selectedWebVoice?.lang || 'fr-FR';
    utterance.rate = options.rate ?? 1;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.onend = () => resolve(true);
    utterance.onerror = () => resolve(false);
    window.speechSynthesis.speak(utterance);
  });
}

async function stop() {
  if (Capacitor.isNativePlatform()) {
    try {
      await TextToSpeech.stop();
    } catch {
      // Le moteur natif peut ne pas être initialisé lors du premier lancement.
    }
  }
  webStop();
}

async function speak(text, options = {}) {
  if (!text) return false;

  if (Capacitor.isNativePlatform()) {
    try {
      const queueStrategy = options.queueStrategy ?? 0;
      if (queueStrategy === 0) await TextToSpeech.stop().catch(() => undefined);

      await TextToSpeech.speak({
        text,
        lang: await resolveNativeLanguage(),
        rate: options.rate ?? 1,
        pitch: options.pitch ?? 1,
        volume: options.volume ?? 1,
        queueStrategy
      });
      return true;
    } catch (error) {
      console.warn('Synthèse vocale Android indisponible, utilisation du secours web.', error);
    }
  }

  return webSpeak(text, options);
}

window.SnackTTS = {
  isNative: Capacitor.isNativePlatform(),
  speak,
  stop,
  test: () => speak('Voix activée !', { rate: 1.05, pitch: 1.1, queueStrategy: 0 })
};

if ('speechSynthesis' in window) {
  loadWebVoice();
  window.speechSynthesis.onvoiceschanged = loadWebVoice;
}
