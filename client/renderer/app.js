/* ════════════════════════════════════════════════════════════
   ClientPulse — Renderer JavaScript
   Logika widoków: lista komunikatów + widok szczegółowy
   ════════════════════════════════════════════════════════════ */

const API = window.electronAPI ? window.electronAPI.apiBase : 'http://localhost:3000';

let allMessages = [];
let currentDetailId = null;

// ─── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupButtons();
  setupIPCListeners();
  loadMessages();
});

// ─── Przyciski ─────────────────────────────────────────────────────────────
function setupButtons() {
  // Zamknij (schowaj do tray)
  document.getElementById('btn-close').addEventListener('click', () => {
    window.electronAPI?.closeWindow();
  });
  document.getElementById('btn-close-detail').addEventListener('click', () => {
    window.electronAPI?.closeWindow();
  });

  // Odśwież listę
  document.getElementById('btn-refresh').addEventListener('click', () => {
    loadMessages();
  });

  // Wróć do listy
  document.getElementById('btn-back').addEventListener('click', () => {
    showView('list');
  });
}

// ─── IPC z main process ────────────────────────────────────────────────────
function setupIPCListeners() {
  window.electronAPI?.onNavigate((view) => {
    if (view === 'list') showView('list');
  });

  window.electronAPI?.onShowDetail((msgId) => {
    const msg = allMessages.find(m => m.id === msgId);
    if (msg) openDetail(msg);
  });
}

// ─── Widoki ────────────────────────────────────────────────────────────────
function showView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(`view-${viewName}`);
  if (el) el.classList.add('active');
}

// ─── Ładowanie komunikatów ────────────────────────────────────────────────
async function loadMessages() {
  const content = document.getElementById('list-content');

  content.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Ładowanie komunikatów…</p>
    </div>`;

  try {
    let messages;

    if (window.electronAPI) {
      const result = await window.electronAPI.getMessages();
      if (!result.ok) throw new Error(result.error || 'Błąd serwera');
      messages = result.data;
    } else {
      // Fallback: bezpośrednie fetch (tryb przeglądarki / dev)
      const res = await fetch(`${API}/api/messages/active`);
      messages = await res.json();
      if (!res.ok) throw new Error(messages.error || 'Błąd serwera');
    }

    allMessages = messages;
    renderList(messages);

  } catch (err) {
    content.innerHTML = `
      <div class="error-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p>Nie udało się pobrać komunikatów.<br/>
           Sprawdź połączenie z serwerem.</p>
      </div>`;
  }
}

// ─── Renderowanie listy ───────────────────────────────────────────────────
function renderList(messages) {
  const content = document.getElementById('list-content');
  const countEl = document.getElementById('msg-count');

  if (messages.length === 0) {
    countEl.textContent = '';
    content.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
        <p>Brak aktywnych komunikatów.<br/>Zaglądaj tu regularnie!</p>
      </div>`;
    return;
  }

  countEl.textContent = `${messages.length} ${pluralKomunikat(messages.length)}`;

  content.innerHTML = '';

  const label = document.createElement('div');
  label.className = 'section-label';
  label.textContent = 'Aktywne komunikaty';
  content.appendChild(label);

  messages.forEach(msg => {
    content.appendChild(buildCard(msg));
  });
}

// ─── Karta komunikatu ─────────────────────────────────────────────────────
function buildCard(msg) {
  const card = document.createElement('div');
  card.className = 'msg-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  const thumbHtml = msg.image_url
    ? `<img src="${API}${msg.image_url}" alt="${escHtml(msg.headline)}" loading="lazy"/>`
    : `<div class="card-thumb-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
         </svg>
       </div>`;

  const preview = msg.description.slice(0, 90) + (msg.description.length > 90 ? '…' : '');

  card.innerHTML = `
    <div class="card-thumb">${thumbHtml}</div>
    <div class="card-body">
      <div class="card-headline">${escHtml(msg.headline)}</div>
      <div class="card-preview">${escHtml(preview)}</div>
      <span class="card-read-more">
        Czytaj dalej
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M9 5l7 7-7 7"/>
        </svg>
      </span>
    </div>
    <div class="card-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 5l7 7-7 7"/>
      </svg>
    </div>`;

  const open = () => openDetail(msg);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(); });

  return card;
}

// ─── Widok szczegółowy ────────────────────────────────────────────────────
function openDetail(msg) {
  currentDetailId = msg.id;

  const dateStr = new Date(msg.created_at).toLocaleDateString('pl-PL', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const imageHtml = msg.image_url
    ? `<img class="detail-image" src="${API}${msg.image_url}" alt="${escHtml(msg.headline)}"/>`
    : `<div class="detail-image-placeholder">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
         </svg>
       </div>`;

  document.getElementById('detail-content').innerHTML = `
    ${imageHtml}
    <div class="detail-body">
      <h1 class="detail-headline">${escHtml(msg.headline)}</h1>
      <div class="detail-meta">
        <span class="detail-date">${dateStr}</span>
      </div>
      <div class="detail-divider"></div>
      <div class="detail-description">${escHtml(msg.description)}</div>
    </div>`;

  showView('detail');
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str || '');
  return div.innerHTML;
}

function pluralKomunikat(n) {
  if (n === 1) return 'komunikat';
  if (n >= 2 && n <= 4) return 'komunikaty';
  return 'komunikatów';
}
