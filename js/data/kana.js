// Data Kana. Setiap entri: [hiragana, katakana, romaji (Hepburn)].
// Untuk menambah kelompok baru (mis. yōon), cukup tambahkan objek di KANA_GROUPS.

export const CATEGORIES = [
  { id: 'basic', label: 'Dasar' },
  { id: 'voiced', label: 'Dakuten & Handakuten' },
];

export const KANA_GROUPS = [
  { id: 'a', label: 'A', category: 'basic', kana: [['あ', 'ア', 'a'], ['い', 'イ', 'i'], ['う', 'ウ', 'u'], ['え', 'エ', 'e'], ['お', 'オ', 'o']] },
  { id: 'ka', label: 'KA', category: 'basic', kana: [['か', 'カ', 'ka'], ['き', 'キ', 'ki'], ['く', 'ク', 'ku'], ['け', 'ケ', 'ke'], ['こ', 'コ', 'ko']] },
  { id: 'sa', label: 'SA', category: 'basic', kana: [['さ', 'サ', 'sa'], ['し', 'シ', 'shi'], ['す', 'ス', 'su'], ['せ', 'セ', 'se'], ['そ', 'ソ', 'so']] },
  { id: 'ta', label: 'TA', category: 'basic', kana: [['た', 'タ', 'ta'], ['ち', 'チ', 'chi'], ['つ', 'ツ', 'tsu'], ['て', 'テ', 'te'], ['と', 'ト', 'to']] },
  { id: 'na', label: 'NA', category: 'basic', kana: [['な', 'ナ', 'na'], ['に', 'ニ', 'ni'], ['ぬ', 'ヌ', 'nu'], ['ね', 'ネ', 'ne'], ['の', 'ノ', 'no']] },
  { id: 'ha', label: 'HA', category: 'basic', kana: [['は', 'ハ', 'ha'], ['ひ', 'ヒ', 'hi'], ['ふ', 'フ', 'fu'], ['へ', 'ヘ', 'he'], ['ほ', 'ホ', 'ho']] },
  { id: 'ma', label: 'MA', category: 'basic', kana: [['ま', 'マ', 'ma'], ['み', 'ミ', 'mi'], ['む', 'ム', 'mu'], ['め', 'メ', 'me'], ['も', 'モ', 'mo']] },
  { id: 'ya', label: 'YA', category: 'basic', kana: [['や', 'ヤ', 'ya'], ['ゆ', 'ユ', 'yu'], ['よ', 'ヨ', 'yo']] },
  { id: 'ra', label: 'RA', category: 'basic', kana: [['ら', 'ラ', 'ra'], ['り', 'リ', 'ri'], ['る', 'ル', 'ru'], ['れ', 'レ', 're'], ['ろ', 'ロ', 'ro']] },
  { id: 'wa', label: 'WA', category: 'basic', kana: [['わ', 'ワ', 'wa'], ['を', 'ヲ', 'wo'], ['ん', 'ン', 'n']] },
  { id: 'ga', label: 'GA', category: 'voiced', kana: [['が', 'ガ', 'ga'], ['ぎ', 'ギ', 'gi'], ['ぐ', 'グ', 'gu'], ['げ', 'ゲ', 'ge'], ['ご', 'ゴ', 'go']] },
  { id: 'za', label: 'ZA', category: 'voiced', kana: [['ざ', 'ザ', 'za'], ['じ', 'ジ', 'ji'], ['ず', 'ズ', 'zu'], ['ぜ', 'ゼ', 'ze'], ['ぞ', 'ゾ', 'zo']] },
  { id: 'da', label: 'DA', category: 'voiced', kana: [['だ', 'ダ', 'da'], ['ぢ', 'ヂ', 'ji'], ['づ', 'ヅ', 'zu'], ['で', 'デ', 'de'], ['ど', 'ド', 'do']] },
  { id: 'ba', label: 'BA', category: 'voiced', kana: [['ば', 'バ', 'ba'], ['び', 'ビ', 'bi'], ['ぶ', 'ブ', 'bu'], ['べ', 'ベ', 'be'], ['ぼ', 'ボ', 'bo']] },
  { id: 'pa', label: 'PA', category: 'voiced', kana: [['ぱ', 'パ', 'pa'], ['ぴ', 'ピ', 'pi'], ['ぷ', 'プ', 'pu'], ['ぺ', 'ペ', 'pe'], ['ぽ', 'ポ', 'po']] },
];

export const GROUP_IDS = KANA_GROUPS.map((g) => g.id);

const SCRIPT_INDEX = { hiragana: 0, katakana: 1 };

/** Huruf pertama sebuah kelompok pada script tertentu (untuk label tombol). */
export function groupSample(group, script) {
  return group.kana[0][SCRIPT_INDEX[script] ?? 0];
}

/**
 * Kumpulan huruf dari kelompok yang dipilih.
 * @returns {{char: string, romaji: string, groupId: string}[]}
 */
export function getKanaPool(script, groupIds) {
  const idx = SCRIPT_INDEX[script] ?? 0;
  const selected = new Set(groupIds);
  return KANA_GROUPS.filter((g) => selected.has(g.id)).flatMap((g) =>
    g.kana.map((row) => ({ char: row[idx], romaji: row[2], groupId: g.id })),
  );
}

/** Gabungkan romaji suku kata; "n" sebelum vokal/y ditulis "n'" agar tidak ambigu. */
export function joinRomaji(parts) {
  return parts
    .map((r, i) => (r === 'n' && /^[aiueoy]/.test(parts[i + 1] ?? '') ? "n'" : r))
    .join('');
}
