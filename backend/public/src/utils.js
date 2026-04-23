export function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

export function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}