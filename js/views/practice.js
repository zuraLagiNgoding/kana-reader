// Halaman latihan: Character Practice (Grid / Single / Kombinasi) dan Word Practice.
// Toolbar (kembali, romaji, arti, shuffle) dipakai bersama oleh kedua jenis latihan.

import { getKanaPool, joinRomaji } from '../data/kana.js';
import { sample, shuffle, pickOne, makeCombinations } from '../randomizer.js';
import { getAvailableWords, LOW_WORD_THRESHOLD } from '../words.js';
import * as audio from '../audio/index.js';
import { showToast } from '../ui/toast.js';
import { SCRIPTS, MODES, COUNTS, findOption } from '../config.js';

const COMBO_BATCH = 30;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/**
 * Kartu yang bisa diklik untuk diputar audionya.
 * @param {object} o
 * @param {string} o.text        Kana yang ditampilkan
 * @param {string} o.romaji
 * @param {string[]} o.keys      file audio utama (relatif ke audio/, tanpa .mp3)
 * @param {string[]} [o.fallbackKeys] file audio cadangan (per suku kata)
 * @param {string} [o.meaning]   arti (Word Practice)
 */
function card({ text, romaji, keys, fallbackKeys = [], meaning = '', sizeClass, romajiClass = '' }) {
  return `<button type="button" class="kana-card ${sizeClass}" data-speak="${escapeHtml(text)}"
      data-audio="${keys.join(' ')}" data-fallback="${fallbackKeys.join(' ')}" data-romaji-text="${escapeHtml(romaji)}"
      aria-label="Putar ${escapeHtml(text)}">
    <span class="kana jp">${escapeHtml(text)}</span>
    <span class="romaji ${romajiClass}">${escapeHtml(romaji)}</span>
    ${meaning ? `<span class="meaning">${escapeHtml(meaning)}</span>` : ''}
  </button>`;
}

const charCard = (k, sizeClass, romajiClass) =>
  card({ text: k.char, romaji: k.romaji, keys: [k.romaji], sizeClass, romajiClass });

// Kata panjang memakai huruf sedikit lebih kecil agar tetap muat di layar HP.
const wordSize = (length) =>
  length >= 5 ? 'text-2xl sm:text-4xl' : length === 4 ? 'text-3xl sm:text-4xl' : 'text-4xl sm:text-5xl';

/**
 * @param {{root: HTMLElement, onBack: () => void, onPrefChange: (patch: object) => void}} deps
 */
export function createPracticeView({ root, onBack, onPrefChange }) {
  const $ = (sel) => root.querySelector(sel);
  const content = $('#practice-content');
  const titleEl = $('#practice-title');
  const noticeEl = $('#practice-notice');
  const romajiBtn = $('#romaji-btn');
  const meaningBtn = $('#meaning-btn');

  let settings = null;
  let pool = []; // huruf (Character Practice)
  let words = []; // kosakata tersedia (Word Practice)
  let single = null; // { items, index, endless }
  let active = false;

  const limit = () => (settings.count === 'unlimited' ? null : settings.count);
  const isWordPractice = () => settings.practice === 'word';

  // ---------- Toggle romaji / arti ----------
  function setToggle(btn, attr, show, label) {
    content.dataset[attr] = show ? 'on' : 'off';
    btn.setAttribute('aria-pressed', String(show));
    btn.title = `${show ? 'Sembunyikan' : 'Tampilkan'} ${label}`;
  }

  function setNotice(text) {
    noticeEl.hidden = !text;
    noticeEl.innerHTML = text ? `<div class="notice" role="status">${escapeHtml(text)}</div>` : '';
  }

  // ---------- Character Practice ----------
  function renderGrid() {
    const items = sample(pool, limit());
    content.innerHTML = `<div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
      ${items.map((k) => charCard(k, 'aspect-square text-5xl sm:text-6xl')).join('')}
    </div>`;
  }

  function renderSingle() {
    const n = limit();
    single = { items: n ? sample(pool, n) : [pickOne(pool)], index: 0, endless: !n };
    content.innerHTML = `<div class="flex flex-col items-center">
      <div id="single-slot" class="w-full max-w-[18rem] sm:max-w-sm"></div>
      <div class="mt-6 flex items-center gap-3">
        <button type="button" class="btn btn-icon" data-action="prev" aria-label="Huruf sebelumnya">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span id="single-counter" class="min-w-[5rem] text-center text-sm tabular-nums text-stone-500"></span>
        <button type="button" class="btn btn-icon" data-action="next" aria-label="Huruf berikutnya">
          <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <p class="mt-4 hidden text-xs text-stone-400 sm:block">Klik huruf untuk mendengar · ← → untuk berpindah · Spasi untuk memutar</p>
    </div>`;
    updateSingle();
  }

  function updateSingle() {
    const { items, index, endless } = single;
    $('#single-slot').innerHTML = charCard(items[index], 'w-full aspect-square text-[8rem] sm:text-[10rem]', 'text-2xl');
    $('#single-counter').textContent = endless ? `${index + 1}` : `${index + 1} / ${items.length}`;
    content.querySelector('[data-action="prev"]').disabled = index === 0;
    content.querySelector('[data-action="next"]').disabled = !endless && index === items.length - 1;
  }

  function moveSingle(delta) {
    if (!single) return;
    const { items, endless } = single;
    if (delta > 0) {
      if (single.index < items.length - 1) single.index += 1;
      else if (endless) {
        items.push(pickOne(pool, items[single.index]));
        single.index += 1;
      } else return;
    } else if (single.index > 0) single.index -= 1;
    else return;
    updateSingle();
  }

  function renderCombination() {
    const endless = limit() == null;
    content.innerHTML = `<div id="combo-list" class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"></div>
      ${endless ? '<div class="mt-6 text-center"><button type="button" class="btn" data-action="more">Tambah kombinasi</button></div>' : ''}`;
    appendCombinations(limit() ?? COMBO_BATCH);
  }

  function appendCombinations(n) {
    const combos = makeCombinations(pool, n, { canStart: (k) => k.romaji !== 'n' });
    $('#combo-list').insertAdjacentHTML(
      'beforeend',
      combos
        .map((parts) => {
          const syllables = parts.map((p) => p.romaji);
          return card({
            text: parts.map((p) => p.char).join(''),
            romaji: joinRomaji(syllables),
            keys: syllables,
            sizeClass: 'px-2 py-6 sm:py-8 text-4xl sm:text-5xl',
          });
        })
        .join(''),
    );
  }

  // ---------- Word Practice ----------
  function renderWords() {
    const n = limit();
    const items = n ? shuffle(words).slice(0, n) : shuffle(words);
    audio.preload(items.map((w) => w.audioKey));

    if (n && words.length < n) {
      setNotice(`Hanya ${words.length} kata yang tersedia dari kelompok ini — semuanya ditampilkan. Tambahkan kelompok lain untuk kosakata lebih banyak.`);
    } else if (words.length < LOW_WORD_THRESHOLD) {
      setNotice(`Kosakata terbatas: hanya ${words.length} kata dari kelompok ini.`);
    } else setNotice('');

    content.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
      ${items
        .map((w) =>
          card({
            text: w.kana,
            romaji: w.romaji,
            meaning: w.meaning,
            keys: [w.audioKey],
            fallbackKeys: w.syllables,
            sizeClass: `word-card px-2 py-6 sm:py-8 ${wordSize([...w.kana].length)}`,
          }),
        )
        .join('')}
    </div>`;
  }

  // ---------- Umum ----------
  function generate() {
    single = null;
    const empty = isWordPractice() ? !words.length : !pool.length;
    if (empty) {
      setNotice('');
      content.innerHTML = `<p class="py-16 text-center text-stone-500">${
        isWordPractice() ? 'Belum ada kata untuk kelompok ini.' : 'Tidak ada huruf.'
      } Kembali dan pilih kelompok lain.</p>`;
      return;
    }
    if (isWordPractice()) renderWords();
    else if (settings.mode === 'single') renderSingle();
    else if (settings.mode === 'combination') renderCombination();
    else renderGrid();

    content.classList.remove('fade-in');
    void content.offsetWidth; // restart animasi
    content.classList.add('fade-in');
  }

  async function play(el) {
    content.querySelectorAll('.is-playing').forEach((c) => c.classList.remove('is-playing'));
    el.classList.add('is-playing');
    const split = (s) => (s ? s.split(' ') : []);
    const result = await audio.play(split(el.dataset.audio), el.dataset.speak, {
      fallbackKeys: split(el.dataset.fallback),
    });
    el.classList.remove('is-playing');
    if (!result.ok) {
      const reason = audio.AUDIO_MESSAGES[result.reason] ?? 'audio tidak tersedia';
      showToast(`${el.dataset.speak} = ${el.dataset.romajiText} · ${reason}`);
    }
  }

  // ---------- Events ----------
  root.addEventListener('click', (e) => {
    const target = e.target.closest('[data-speak]');
    if (target) {
      play(target);
      return;
    }
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'prev') moveSingle(-1);
    else if (action === 'next') moveSingle(1);
    else if (action === 'more') appendCombinations(COMBO_BATCH);
    else if (action === 'shuffle') generate();
    else if (action === 'back') onBack();
    else if (action === 'toggle-romaji') {
      const show = content.dataset.romaji !== 'on';
      setToggle(romajiBtn, 'romaji', show, 'romaji');
      onPrefChange({ showRomaji: show });
    } else if (action === 'toggle-meaning') {
      const show = content.dataset.meaning !== 'on';
      setToggle(meaningBtn, 'meaning', show, 'arti');
      onPrefChange({ showMeaning: show });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!active || !single || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      moveSingle(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      moveSingle(-1);
    } else if (e.key === ' ' && !e.target.closest?.('button, a, input, select, textarea')) {
      e.preventDefault();
      const el = content.querySelector('[data-speak]');
      if (el) play(el);
    }
  });

  // ---------- API ----------
  function start(prefs) {
    settings = { ...prefs };
    active = true;
    setNotice('');

    if (isWordPractice()) {
      words = getAvailableWords(settings.script, settings.groups);
      pool = [];
    } else {
      pool = getKanaPool(settings.script, settings.groups);
      words = [];
      audio.preload(pool.map((k) => k.romaji));
    }

    meaningBtn.hidden = !isWordPractice();
    setToggle(romajiBtn, 'romaji', settings.showRomaji, 'romaji');
    setToggle(meaningBtn, 'meaning', settings.showMeaning, 'arti');

    titleEl.textContent = [
      findOption(SCRIPTS, settings.script).label,
      isWordPractice() ? 'Kata' : findOption(MODES, settings.mode).label,
      findOption(COUNTS, settings.count).label,
    ].join(' · ');
    generate();
  }

  function stop() {
    active = false;
    audio.stop();
  }

  return { start, stop };
}
