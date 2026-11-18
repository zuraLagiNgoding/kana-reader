// Cadangan: Web Speech API (suara Jepang dari perangkat), hanya dipakai bila file
// audio bawaan gagal dimuat. Tidak pernah memakai suara non-Jepang.

const LANG = 'ja-JP';
let voice = null;

export const isSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

function findVoice() {
  const japanese = window.speechSynthesis.getVoices().filter((v) => /^ja([-_]|$)/i.test(v.lang));
  voice = japanese.find((v) => /google/i.test(v.name)) ?? japanese[0] ?? null;
}

if (isSupported()) {
  findVoice();
  window.speechSynthesis.addEventListener?.('voiceschanged', findVoice);
}

export function stop() {
  if (isSupported()) window.speechSynthesis.cancel();
}

/** @returns {Promise<boolean>} true bila berhasil diucapkan */
export function speak(text) {
  return new Promise((resolve) => {
    if (!isSupported()) return resolve(false);
    if (!voice) findVoice();
    if (!voice) return resolve(false);

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG;
    utterance.voice = voice;
    utterance.rate = 0.8;
    const guard = setTimeout(() => resolve(true), 5000); // sebagian browser tidak memicu onend
    utterance.onend = () => {
      clearTimeout(guard);
      resolve(true);
    };
    utterance.onerror = (e) => {
      clearTimeout(guard);
      resolve(e.error === 'interrupted' || e.error === 'canceled');
    };
    synth.cancel();
    synth.speak(utterance);
  });
}
