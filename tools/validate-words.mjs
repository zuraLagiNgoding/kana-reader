// Validasi database kosakata: node tools/validate-words.mjs
// - setiap huruf ada di data Kana (tidak ada ー / huruf kecil / huruf asing)
// - romaji sesuai dengan huruf-hurufnya
// - tidak ada kata ganda, field wajib terisi, nama file audio unik

import { WORDS } from '../js/data/words.js';
import { joinRomaji } from '../js/data/kana.js';
import { analyzeWord, wordAudioKey } from '../js/words.js';

const errors = [];
const audioKeys = new Map();

for (const [script, list] of Object.entries(WORDS)) {
  const seen = new Set();
  for (const word of list) {
    const where = `[${script}] ${word.kana}`;
    if (!word.kana || !word.romaji || !word.meaning) errors.push(`${where}: field kana/romaji/meaning wajib diisi`);
    if (seen.has(word.kana)) errors.push(`${where}: kata ganda`);
    seen.add(word.kana);

    const info = analyzeWord(word.kana, script);
    if (!info) {
      const bad = [...word.kana].filter((ch) => !analyzeWord(ch, script));
      errors.push(`${where}: huruf di luar data Kana/script: ${bad.join(' ')}`);
      continue;
    }
    const expected = joinRomaji(info.syllables);
    if (expected !== word.romaji) errors.push(`${where}: romaji "${word.romaji}", seharusnya "${expected}"`);

    const key = wordAudioKey(word);
    if (audioKeys.has(key) && audioKeys.get(key) !== word.kana) {
      errors.push(`${where}: nama file audio "${key}" bentrok dengan ${audioKeys.get(key)}`);
    }
    audioKeys.set(key, word.kana);
  }
}

const counts = Object.entries(WORDS).map(([s, l]) => `${s}: ${l.length}`).join(', ');
if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} masalah ditemukan (${counts}).`);
  process.exit(1);
}
console.log(`OK — ${counts} kata valid.`);
