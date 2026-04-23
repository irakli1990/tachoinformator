// ─── Importy ──────────────────────────────────────────────────────────────
import { API } from "./main.js";
import { authHeader } from "./session.js";
import { currentUser } from "./main.js";
// ─── Ładowanie kodów ─────────────────────────────────────────────────────
async function loadKeys() {
  const keyList = document.getElementById('key-list');
  keyList.innerHTML = `
    <div class="list-loading">
      <div class="spinner"></div>
      <span>Ładowanie kodów…</span>
    </div>`;

  try {
    const res = await fetch(`${API}/keys`, { headers: authHeader() });
    const keys = await res.json();

    if (!res.ok) throw new Error(keys.error || 'Błąd serwera');

    if (keys.length === 0) {
      keyList.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p>Brak wygenerowanych kodów.</p>
        </div>`;
      return;
    }

    keyList.innerHTML = '';
    keys.forEach(key => {
      const keyRow = document.createElement('div');
      keyRow.className = 'key-row';
      keyRow.innerHTML = `
        <span class="key-label">${key.secret_key}</span>
        <span class="key-status">${key.status}</span>
        <button type="button" class="action-btn action-copy" data-key="${key.secret_key}" title="Skopiuj"><i class="fa-regular fa-copy"></i></button>
      `;

      keyRow.querySelector('.action-copy').addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(key.secret_key);
        const btn = e.target;
        const originalText = btn.textContent;
        btn.innerHTML = '<i class="fa-solid fa-check"></i>';
        setTimeout(() => btn.textContent = originalText, 2000);
      });

      keyList.appendChild(keyRow);
    });

  } catch (err) {
    keyList.innerHTML = `<div class="error-msg">Błąd: ${err.message}</div>`;
  }
}

export { loadKeys };