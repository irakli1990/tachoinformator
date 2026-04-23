// ─── Importy ─────────────────────────────────────────────────────────────
import { API, authHeader } from './admin.js';
import { buildMsgCard } from './communicate_card.js';

// ─── Ładowanie komunikatów ────────────────────────────────────────────────
async function loadMessages(filter, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = `
    <div class="list-loading">
      <div class="spinner"></div>
      <span>Ładowanie…</span>
    </div>`;

  try {
    const res  = await fetch(`${API}/messages?filter=${filter}`, { headers: authHeader() });
    const list = await res.json();

    if (!res.ok) throw new Error(list.error || 'Błąd serwera');

    if (filter === 'active') {
      document.getElementById('active-count').textContent = list.length;
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
          <p>${filter === 'active' ? 'Brak aktywnych komunikatów.' : 'Archiwum jest puste.'}</p>
        </div>`;
      return;
    }

    container.innerHTML = '';
    list.forEach(msg => container.appendChild(buildMsgCard(msg, filter)));

  } catch (err) {
    container.innerHTML = `<div class="error-msg">Błąd: ${err.message}</div>`;
  }
}

export { loadMessages };