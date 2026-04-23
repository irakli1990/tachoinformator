import { API, authHeader } from './api.js';
import { escHtml } from './utils.js';
import { openDeleteModal } from './modal.js';
import { state } from './state.js';
import { navigateTo } from './navigation.js';

export async function loadMessages(filter, containerId) {
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

export function buildMsgCard(msg, filter) {
  const card = document.createElement('div');
  card.className = 'msg-card';
  card.dataset.id = msg.id;

  const isActive  = msg.is_active && (!msg.expires_at || new Date(msg.expires_at) > new Date());
  const isExpired = msg.expires_at && new Date(msg.expires_at) <= new Date();

  const badge = isExpired
    ? `<span class="msg-badge badge-expired">Wygasły</span>`
    : msg.is_active
      ? `<span class="msg-badge badge-active">Aktywny</span>`
      : `<span class="msg-badge badge-inactive">Wyłączony</span>`;

  const expires = msg.expires_at
    ? `Wygasa: ${new Date(msg.expires_at).toLocaleDateString('pl-PL')}`
    : '';

  const freq = { '1x_daily': '1× dziennie', '2x_daily': '2× dziennie', '3x_daily': '3× dziennie' };

  card.innerHTML = `
    <div class="msg-thumb">
      ${msg.image_url
        ? `<img src="http://localhost:3000${msg.image_url}" alt="${escHtml(msg.headline)}" loading="lazy"/>`
        : `<div class="msg-thumb-placeholder">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
               <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01"/>
             </svg>
           </div>`
      }
    </div>
    <div class="msg-body">
      <div class="msg-headline" title="${escHtml(msg.headline)}">${escHtml(msg.headline)}</div>
      <div class="msg-meta">
        ${badge}
        <span class="msg-info">${freq[msg.display_frequency] || msg.display_frequency} · ${msg.display_time}</span>
        ${expires ? `<span class="msg-info">${expires}</span>` : ''}
      </div>
    </div>
    <div class="msg-actions">
      ${filter !== 'archived' ? `
      <label class="toggle-status" title="${msg.is_active ? 'Wyłącz' : 'Włącz'} komunikat">
        <input type="checkbox" ${msg.is_active ? 'checked' : ''} data-action="toggle" data-id="${msg.id}"/>
        <span class="toggle-status-track"></span>
      </label>` : ''}
      <button class="action-btn action-edit" title="Edytuj" data-action="edit" data-id="${msg.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
      </button>
      <button class="action-btn action-delete" title="Usuń" data-action="delete" data-id="${msg.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>`;

  // Event delegation
  card.addEventListener('change', async (e) => {
    if (e.target.dataset.action === 'toggle') {
      await toggleMessage(Number(e.target.dataset.id), filter);
    }
  });

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'edit')   openEditForm(Number(btn.dataset.id));
    if (btn.dataset.action === 'delete') openDeleteModal(Number(btn.dataset.id));
  });

  return card;
}

export async function toggleMessage(id, filter) {
  try {
    const res = await fetch(`${API}/messages/${id}/toggle`, {
      method:  'PATCH',
      headers: authHeader()
    });
    if (!res.ok) throw new Error('Błąd');
    await loadMessages(filter, filter === 'active' ? 'active-list' : 'archived-list');
  } catch {
    alert('Nie udało się zmienić statusu komunikatu.');
  }
}

export async function openEditForm(id) {
  try {
    const res = await fetch(`${API}/messages/${id}`, { headers: authHeader() });
    const msg = await res.json();
    if (!res.ok) throw new Error(msg.error);

    navigateTo('new-message');

    state.editingId = id;
    
    document.getElementById('form-view-title').textContent = 'Edytuj komunikat';
    document.getElementById('submit-label').textContent    = 'Zapisz zmiany';
    document.getElementById('edit-msg-id').value = id;

    document.getElementById('msg-headline').value    = msg.headline;
    document.getElementById('msg-description').value = msg.description;
    document.getElementById('msg-duration').value    = msg.display_duration_days;
    document.getElementById('msg-frequency').value   = msg.display_frequency;
    document.getElementById('msg-time').value        = msg.display_time;
    document.getElementById('msg-push').checked      = !!msg.show_push;
    document.getElementById('msg-active').checked    = !!msg.is_active;

    if (msg.image_url) {
      showUploadPreview(`http://localhost:3000${msg.image_url}`);
    }
  } catch (err) {
    alert('Nie udało się załadować komunikatu: ' + err.message);
  }
}