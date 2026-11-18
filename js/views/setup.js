// Halaman pengaturan: jenis latihan, aksara, kelompok huruf, mode, dan jumlah.

import { KANA_GROUPS, CATEGORIES, GROUP_IDS, groupSample, getKanaPool } from '../data/kana.js';
import { PRACTICES, SCRIPTS, MODES, COUNTS, WORD_COUNT_HINT, findOption } from '../config.js';
import { getAvailableWords, suggestGroups, LOW_WORD_THRESHOLD } from '../words.js';

const OPTIONS = { practice: PRACTICES, script: SCRIPTS, mode: MODES, count: COUNTS };

function segmentedButtons(options) {
  return options
    .map(
      (o) =>
        `<button type="button" data-value="${o.value}" aria-pressed="false">${
          o.sample ? `<span class="jp mr-1.5">${o.sample}</span>` : ''
        }${o.label}</button>`,
    )
    .join('');
}

function groupChips() {
  return CATEGORIES.map((cat) => {
    const chips = KANA_GROUPS.filter((g) => g.category === cat.id)
      .map(
        (g) =>
          `<button type="button" class="chip" data-group="${g.id}" aria-pressed="false" aria-label="Kelompok ${g.label}">
             <span class="chip-kana jp"></span><span class="chip-label">${g.label}</span>
           </button>`,
      )
      .join('');
    return `<div>
      <p class="mb-2 text-xs text-stone-400">${cat.label}</p>
      <div class="grid grid-cols-5 sm:grid-cols-10 gap-2">${chips}</div>
    </div>`;
  }).join('');
}

/** Pesan bila kosakata untuk kelompok terpilih sedikit, plus saran kelompok tambahan. */
function wordNotice(state, available) {
  if (!state.groups.length || available >= LOW_WORD_THRESHOLD) return '';
  const head = available
    ? `Hanya ${available} kata yang bisa dibentuk dari kelompok ini.`
    : 'Belum ada kata yang bisa dibentuk hanya dari kelompok ini.';
  const tips = suggestGroups(state.script, state.groups)
    .map(
      (s) =>
        `<button type="button" class="notice-chip" data-add-group="${s.id}">+ ${s.label} <span class="opacity-70">(+${s.gain} kata)</span></button>`,
    )
    .join('');
  return `<div class="notice" role="status">
    <p class="notice-title">${head}</p>
    ${tips ? `<p>Tambahkan kelompok untuk kosakata lebih banyak:</p><div class="mt-2 flex flex-wrap gap-2">${tips}</div>` : ''}
  </div>`;
}

/**
 * @param {{root: HTMLElement, onChange: (patch: object) => void, onStart: () => void}} deps
 */
export function createSetupView({ root, onChange, onStart }) {
  const $ = (sel) => root.querySelector(sel);
  const segments = Object.fromEntries(Object.keys(OPTIONS).map((k) => [k, $(`[data-setting="${k}"]`)]));
  const groupList = $('#group-list');
  const summary = $('#selection-summary');
  const startBtn = $('#start-btn');
  const practiceHint = $('#practice-hint');
  const modeSection = $('#mode-section');
  const modeHint = $('#mode-hint');
  const countHint = $('#count-hint');
  const notice = $('#word-notice');

  for (const [key, el] of Object.entries(segments)) el.innerHTML = segmentedButtons(OPTIONS[key]);
  groupList.innerHTML = groupChips();

  let state = null;
  let canStart = false;

  const setGroups = (set) => onChange({ groups: GROUP_IDS.filter((g) => set.has(g)) });

  root.addEventListener('click', (e) => {
    const segBtn = e.target.closest('[data-setting] [data-value]');
    if (segBtn) {
      const key = segBtn.parentElement.dataset.setting;
      const option = OPTIONS[key].find((o) => String(o.value) === segBtn.dataset.value);
      if (option) onChange({ [key]: option.value });
      return;
    }

    const chip = e.target.closest('[data-group]');
    if (chip) {
      const set = new Set(state.groups);
      const id = chip.dataset.group;
      set.has(id) ? set.delete(id) : set.add(id);
      setGroups(set);
      return;
    }

    const add = e.target.closest('[data-add-group]');
    if (add) {
      setGroups(new Set([...state.groups, add.dataset.addGroup]));
      return;
    }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'select-all') onChange({ groups: [...GROUP_IDS] });
    else if (action === 'clear-groups') onChange({ groups: [] });
    else if (action === 'start' && canStart) onStart();
  });

  function update(next) {
    state = next;
    const isWord = state.practice === 'word';

    for (const [key, el] of Object.entries(segments)) {
      el.querySelectorAll('[data-value]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.value === String(state[key])));
      });
    }

    groupList.querySelectorAll('[data-group]').forEach((chip) => {
      const group = KANA_GROUPS.find((g) => g.id === chip.dataset.group);
      chip.querySelector('.chip-kana').textContent = groupSample(group, state.script);
      chip.setAttribute('aria-pressed', String(state.groups.includes(group.id)));
    });

    practiceHint.textContent = findOption(PRACTICES, state.practice).hint;
    modeSection.hidden = isWord;
    const mode = findOption(MODES, state.mode);
    modeHint.textContent = mode.hint;
    countHint.textContent = isWord ? WORD_COUNT_HINT : mode.countHint;

    const groupsText = `${state.groups.length} kelompok`;
    if (isWord) {
      const available = getAvailableWords(state.script, state.groups).length;
      notice.innerHTML = wordNotice(state, available);
      notice.hidden = !notice.innerHTML;
      summary.textContent = state.groups.length ? `${groupsText} · ${available} kata` : 'Pilih minimal satu kelompok';
      canStart = available > 0;
    } else {
      notice.hidden = true;
      notice.innerHTML = '';
      const total = getKanaPool(state.script, state.groups).length;
      summary.textContent = state.groups.length ? `${groupsText} · ${total} huruf` : 'Pilih minimal satu kelompok';
      canStart = total > 0;
    }
    startBtn.disabled = !canStart;
  }

  return { update };
}
