// Fasad audio. Urutan:
//   1. file audio bawaan website (kata utuh / suku kata)
//   2. Web Speech API dengan suara Jepang perangkat (bila ada)
//   3. file audio cadangan per suku kata (mis. kata yang belum punya file sendiri)
//   4. gagal → pemanggil menampilkan pesan fallback

import * as player from './player.js';
import * as speech from './speech.js';

export const AUDIO_MESSAGES = {
  unavailable: 'audio gagal dimuat, periksa koneksi lalu coba lagi',
  unsupported: 'browser ini tidak mendukung pemutaran audio',
};

export const preload = player.preload;

export function stop() {
  player.stop();
  speech.stop();
}

/**
 * Putar pelafalan.
 * @param {string[]} keys file audio utama (relatif ke audio/, tanpa .mp3), diputar berurutan
 * @param {string} text teks Kana (untuk Web Speech API)
 * @param {{fallbackKeys?: string[]}} [opts]
 * @returns {Promise<{ok: boolean, reason?: keyof AUDIO_MESSAGES}>}
 */
export async function play(keys, text, { fallbackKeys = [] } = {}) {
  speech.stop();
  if ((await player.playClips(keys)) !== 'unavailable') return { ok: true };
  if (await speech.speak(text)) return { ok: true };
  if (fallbackKeys.length && (await player.playClips(fallbackKeys)) !== 'unavailable') return { ok: true };

  return {
    ok: false,
    reason: player.isSupported() || speech.isSupported() ? 'unavailable' : 'unsupported',
  };
}
