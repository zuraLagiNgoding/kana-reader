// Pemutar audio bawaan website via Web Audio API.
// Kunci audio = path relatif ke folder audio/ tanpa .mp3, mis. 'ka' atau 'words/neko'.
// Beberapa kunci diputar berurutan; hening di awal/akhir tiap file dipotong
// agar terdengar menyambung.

const AUDIO_DIR = new URL('../../audio/', import.meta.url);
const GAP = 0.015; // detik jeda antar suku kata
const SILENCE_THRESHOLD = 0.01;
const PAD_START = 0.01;
const PAD_END = 0.04;

let ctx = null;
const clips = new Map(); // key -> Promise<Clip|null>
let current = null; // { sources, finish }

const AudioCtx = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : undefined;

export const isSupported = () => typeof AudioCtx === 'function';

function getContext() {
  if (!ctx && isSupported()) {
    ctx = new AudioCtx();
    // iOS: agar tetap berbunyi walau tombol silent aktif (Safari 16.4+).
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  }
  return ctx;
}

function decode(context, data) {
  // Bentuk callback agar kompatibel dengan Safari lama.
  return new Promise((resolve, reject) => context.decodeAudioData(data, resolve, reject));
}

/** Cari bagian berbunyi pada buffer (buang hening di awal/akhir). */
function trim(buffer) {
  const data = buffer.getChannelData(0);
  let first = 0;
  let last = data.length - 1;
  while (first < data.length && Math.abs(data[first]) < SILENCE_THRESHOLD) first++;
  while (last > first && Math.abs(data[last]) < SILENCE_THRESHOLD) last--;
  if (first >= last) return { buffer, offset: 0, duration: buffer.duration };
  const offset = Math.max(0, first / buffer.sampleRate - PAD_START);
  const end = Math.min(buffer.duration, last / buffer.sampleRate + PAD_END);
  return { buffer, offset, duration: end - offset };
}

function load(key) {
  if (!clips.has(key)) {
    const context = getContext();
    const promise = context
      ? fetch(new URL(`${key}.mp3`, AUDIO_DIR))
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.arrayBuffer();
          })
          .then((data) => decode(context, data))
          .then(trim)
          .catch(() => {
            clips.delete(key); // boleh dicoba lagi nanti
            return null;
          })
      : Promise.resolve(null);
    clips.set(key, promise);
  }
  return clips.get(key);
}

/** Muat lebih awal agar klik pertama langsung berbunyi. */
export function preload(keys) {
  if (!isSupported()) return;
  new Set(keys).forEach(load);
}

export function stop() {
  if (!current) return;
  const { sources, finish } = current;
  current = null;
  sources.forEach((s) => {
    s.onended = null;
    try {
      s.stop();
    } catch {
      /* sudah berhenti */
    }
  });
  finish('interrupted');
}

/**
 * Putar satu atau beberapa file audio berurutan.
 * @param {string[]} keys mis. ['ka', 'sa'] atau ['words/neko']
 * @returns {Promise<'ok'|'interrupted'|'unavailable'>}
 */
export async function playClips(keys) {
  const context = getContext();
  if (!context || !keys.length) return 'unavailable';
  stop();

  // resume() dipanggil langsung (masih di dalam gesture klik) — wajib di iOS/Chrome.
  const resumed = context.state === 'suspended' ? context.resume() : Promise.resolve();
  const token = {};
  current = { sources: [], finish: () => {}, token };

  const loaded = await Promise.all(keys.map(load));
  await resumed.catch(() => {});
  if (current?.token !== token) return 'interrupted'; // ada klik lain selama memuat
  if (loaded.some((c) => !c) || context.state !== 'running') {
    current = null;
    return 'unavailable';
  }

  return new Promise((resolve) => {
    let when = context.currentTime + 0.02;
    const sources = loaded.map((clip) => {
      const src = context.createBufferSource();
      src.buffer = clip.buffer;
      src.connect(context.destination);
      src.start(when, clip.offset, clip.duration);
      when += clip.duration + GAP;
      return src;
    });
    current = { sources, finish: resolve, token };
    sources[sources.length - 1].onended = () => {
      if (current?.token === token) current = null;
      resolve('ok');
    };
  });
}
