// Opsi pengaturan yang tersedia di aplikasi.

export const PRACTICES = [
  { value: 'character', label: 'Huruf', hint: 'Membaca huruf satu per satu atau kombinasi acak.' },
  { value: 'word', label: 'Kata', hint: 'Membaca kosakata asli yang hanya memakai huruf dari kelompok terpilih.' },
];

export const WORD_COUNT_HINT = 'Jumlah kata. Unlimited = semua kata yang tersedia.';

export const SCRIPTS = [
  { value: 'hiragana', label: 'Hiragana', sample: 'あ' },
  { value: 'katakana', label: 'Katakana', sample: 'ア' },
];

export const MODES = [
  {
    value: 'grid',
    label: 'Grid',
    hint: 'Semua huruf tampil sekaligus dalam kisi.',
    countHint: 'Unlimited = semua huruf dari kelompok terpilih.',
  },
  {
    value: 'single',
    label: 'Single',
    hint: 'Satu huruf besar, berpindah satu per satu.',
    countHint: 'Unlimited = huruf acak terus tanpa batas.',
  },
  {
    value: 'combination',
    label: 'Kombinasi',
    hint: 'Gabungan 2–3 huruf untuk latihan membaca suku kata.',
    countHint: 'Jumlah kombinasi. Unlimited = bisa terus ditambah.',
  },
];

export const COUNTS = [
  { value: 10, label: '10' },
  { value: 20, label: '20' },
  { value: 30, label: '30' },
  { value: 'unlimited', label: 'Unlimited' },
];

export const DEFAULT_PREFS = Object.freeze({
  practice: 'character',
  script: 'hiragana',
  groups: ['a'],
  mode: 'grid',
  count: 20,
  showRomaji: false,
  showMeaning: false,
});

export const findOption = (options, value) => options.find((o) => o.value === value);
