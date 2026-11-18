// Utilitas pengacakan. Tidak bergantung pada DOM maupun data Kana.

const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/** Salinan array yang diacak (Fisher–Yates). */
export function shuffle(items) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Ambil `count` item acak dari pool.
 * - count null  → seluruh pool, diacak.
 * - count > pool → pool diulang secara merata (tiap putaran diacak),
 *   tanpa item yang sama bersebelahan di sambungan putaran.
 */
export function sample(pool, count = null) {
  if (!pool.length) return [];
  if (count == null) return shuffle(pool);

  const out = [];
  while (out.length < count) {
    const round = shuffle(pool);
    if (out.length && round.length > 1 && round[0] === out[out.length - 1]) {
      [round[0], round[1]] = [round[1], round[0]];
    }
    out.push(...round);
  }
  return out.slice(0, count);
}

/** Satu item acak, sebisa mungkin berbeda dari `exclude`. */
export function pickOne(pool, exclude) {
  const candidates = pool.length > 1 ? pool.filter((x) => x !== exclude) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Buat `count` kombinasi acak, masing-masing berisi minLength–maxLength item.
 * `canStart(item)` menentukan item yang boleh berada di posisi pertama.
 * @returns {Array<Array<*>>}
 */
export function makeCombinations(pool, count, { minLength = 2, maxLength = 3, canStart = () => true } = {}) {
  if (!pool.length) return [];
  const starters = pool.filter(canStart);
  const combos = [];

  for (let i = 0; i < count; i++) {
    const length = randInt(minLength, maxLength);
    const parts = [pickOne(starters.length ? starters : pool)];
    while (parts.length < length) parts.push(pickOne(pool, parts[parts.length - 1]));
    combos.push(parts);
  }
  return combos;
}
