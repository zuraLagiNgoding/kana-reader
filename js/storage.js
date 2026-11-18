// Penyimpanan preferensi pengguna di LocalStorage (dengan validasi).

import { PRACTICES, SCRIPTS, MODES, COUNTS, DEFAULT_PREFS } from './config.js';
import { GROUP_IDS } from './data/kana.js';

const KEY = 'kana-reader.prefs.v1';

const isOneOf = (options, value) => options.some((o) => o.value === value);

function sanitize(raw) {
  const p = raw && typeof raw === 'object' ? raw : {};
  const groups = Array.isArray(p.groups)
    ? GROUP_IDS.filter((id) => p.groups.includes(id)) // urut sesuai data
    : [...DEFAULT_PREFS.groups];

  return {
    practice: isOneOf(PRACTICES, p.practice) ? p.practice : DEFAULT_PREFS.practice,
    script: isOneOf(SCRIPTS, p.script) ? p.script : DEFAULT_PREFS.script,
    groups,
    mode: isOneOf(MODES, p.mode) ? p.mode : DEFAULT_PREFS.mode,
    count: isOneOf(COUNTS, p.count) ? p.count : DEFAULT_PREFS.count,
    showRomaji: typeof p.showRomaji === 'boolean' ? p.showRomaji : DEFAULT_PREFS.showRomaji,
    showMeaning: typeof p.showMeaning === 'boolean' ? p.showMeaning : DEFAULT_PREFS.showMeaning,
  };
}

export function loadPrefs() {
  try {
    return sanitize(JSON.parse(localStorage.getItem(KEY)));
  } catch {
    return sanitize(null);
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(sanitize(prefs)));
  } catch {
    // LocalStorage tidak tersedia (mode privat / diblokir): aplikasi tetap berjalan.
  }
}
