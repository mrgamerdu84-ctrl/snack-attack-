(() => {
  const button = document.getElementById('voiceBtn');
  if (!button) return;

  button.onclick = async () => {
    voiceEnabled = !voiceEnabled;
    button.textContent = voiceEnabled ? '🔊 Voix ON' : '🔇 Voix OFF';
    button.style.background = voiceEnabled
      ? 'linear-gradient(160deg,#3ee6b0,#4fc3ff)'
      : 'linear-gradient(160deg,#666,#999)';

    if (voiceEnabled) {
      await window.announceVoiceEnabled?.();
    } else {
      await window.SnackTTS?.stop?.();
    }
  };
})();
