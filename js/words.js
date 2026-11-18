// Logic Word Practice: mencocokkan kosakata dengan kelompok Kana yang dipilih.
// Murni (tanpa DOM) sehingga bisa dipakai di browser maupun skrip Node.

import { KANA_GROUPS } from './data/kana.js';
import { WORDS } from './data/words.js';

/** Di bawah angka ini, pengguna diberi tahu bahwa kosakata terbatas. */
export const LOW_WORD_THRESHOLD = 10;

// Peta huruf → { groupId, romaji } per script.
const CHAR_INFO = { hiragana: new Map(), katakana: new Map() };
for (const group of KANA_GROUPS) {
  for (const [hira, kata, romaji] of group.kana) {
    CHAR_INFO.hiragana.set(hira, { groupId: group.id, romaji });
    CHAR_INFO.katakana.set(kata, { groupId: group.id, romaji });
  }
}

/**
 * Uraikan kata menjadi suku kata.
 * @returns {{groups: string[], syllables: string[]} | null} null bila ada huruf di luar data Kana.
 */
export function analyzeWord(kana, script) {
  const map = CHAR_INFO[script];
  const groups = new Set();
  const syllables = [];
  for (const ch of kana) {
    const info = map?.get(ch);
    if (!info) return null;
    groups.add(info.groupId);
    syllables.push(info.romaji);
  }
  return { groups: [...groups], syllables };
}

/** Nama file audio kata (tanpa ekstensi), relatif terhadap folder audio/. */
export const wordAudioKey = (word) => `words/${word.romaji.replace(/'/g, '')}`;

// Indeks: kata + kelompok yang dibutuhkan. Kata dengan huruf tak dikenal dibuang.
const INDEX = Object.fromEntries(
  Object.entries(WORDS).map(([script, list]) => [
    script,
    list.flatMap((word) => {
      const info = analyzeWord(word.kana, script);
      return info ? [{ ...word, ...info, audioKey: wordAudioKey(word) }] : [];
    }),
  ]),
);

/** Kata yang SELURUH hurufnya berasal dari kelompok terpilih. */
export function getAvailableWords(script, groupIds) {
  const selected = new Set(groupIds);
  return (INDEX[script] ?? []).filter((w) => w.groups.every((g) => selected.has(g)));
}

/**
 * Kelompok yang paling banyak menambah kosakata jika ikut dipilih.
 * @returns {{id: string, label: string, gain: number}[]}
 */
export function suggestGroups(script, groupIds, limit = 2) {
  const base = getAvailableWords(script, groupIds).length;
  return KANA_GROUPS.filter((g) => !groupIds.includes(g.id))
    .map((g) => ({ id: g.id, label: g.label, gain: getAvailableWords(script, [...groupIds, g.id]).length - base }))
    .filter((s) => s.gain > 0)
    .sort((a, b) => b.gain - a.gain)
    .slice(0, limit);
}
