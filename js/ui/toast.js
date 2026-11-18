// Notifikasi singkat di bagian bawah layar.

let timer = null;

export function showToast(message, { duration = 2800 } = {}) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('is-visible'), duration);
}
