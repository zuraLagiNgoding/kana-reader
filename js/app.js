// Titik masuk aplikasi: state, navigasi antar halaman, dan wiring modul.

import { loadPrefs, savePrefs } from './storage.js';
import { createSetupView } from './views/setup.js';
import { createPracticeView } from './views/practice.js';

const PRACTICE_HASH = '#latihan';

const setupRoot = document.getElementById('view-setup');
const practiceRoot = document.getElementById('view-practice');

let state = loadPrefs();

function setState(patch) {
  state = { ...state, ...patch };
  savePrefs(state);
  setup.update(state);
}

const setup = createSetupView({
  root: setupRoot,
  onChange: setState,
  onStart: () => {
    history.pushState({ view: 'practice' }, '', PRACTICE_HASH);
    showPractice();
  },
});

const practice = createPracticeView({
  root: practiceRoot,
  onBack: () => {
    // Kembali lewat riwayat agar tombol Back browser/HP konsisten.
    if (history.state?.view === 'practice') history.back();
    else showSetup();
  },
  onPrefChange: setState,
});

function showPractice() {
  if (!state.groups.length) return showSetup();
  setupRoot.hidden = true;
  practiceRoot.hidden = false;
  practice.start(state);
  window.scrollTo(0, 0);
}

function showSetup() {
  practice.stop();
  practiceRoot.hidden = true;
  setupRoot.hidden = false;
  if (location.hash === PRACTICE_HASH) history.replaceState(null, '', location.pathname + location.search);
}

window.addEventListener('popstate', () => {
  if (location.hash === PRACTICE_HASH && state.groups.length) showPractice();
  else showSetup();
});

// ---------- Init ----------
setup.update(state);
showSetup();
