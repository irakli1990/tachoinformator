/* ════════════════════════════════════════════════════════════
   Info Tachospeed – Admin Panel SPA JavaScript
   ════════════════════════════════════════════════════════════ */

const API = 'http://localhost:3000/api';

// ─── Stan aplikacji ────────────────────────────────────────────────────────
let currentUser = null;
let currentView = 'active';
let editingId    = null;
let deleteTarget = null;
let selectedFile = null;

// ─── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  setupLoginForm();
  setupNavigation();
  setupMessageForm();
  setupGenerateKeyForm();
  setupUploadZone();
  setupModal();
});

// ─── Sesja ────────────────────────────────────────────────────────────────
function saveSession(user) {
  localStorage.setItem('cp_user', JSON.stringify(user));
  currentUser = user;
}

function restoreSession() {
  const stored = localStorage.getItem('cp_user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      showApp();
    } catch {
      localStorage.removeItem('cp_user');
      showLogin();
    }
  } else {
    showLogin();
  }
}

function logout() {
  localStorage.removeItem('cp_user');
  currentUser = null;
  showLogin();
}

function authHeader() {
  if (!currentUser) return {};
  return { Authorization: 'Bearer ' + btoa(currentUser.email) };
}

// ─── Widoki: Login / App ───────────────────────────────────────────────────
function showLogin() {
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
}

function showApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  // Uzupełnij dane użytkownika w sidebar
  const avatarEl = document.getElementById('user-avatar');
  const emailEl  = document.getElementById('user-email-display');
  const deptEl   = document.getElementById('user-dept');

  if (currentUser) {
    avatarEl.textContent = currentUser.email[0].toUpperCase();
    emailEl.textContent  = currentUser.email;
    deptEl.textContent   = currentUser.department || '';
  }

  navigateTo('active');
}

// ─── Logowanie ────────────────────────────────────────────────────────────
function setupLoginForm() {
  const form    = document.getElementById('login-form');
  const errEl   = document.getElementById('login-error');
  const btn     = document.getElementById('login-btn');
  const btnText = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.btn-spinner');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value.trim();

    errEl.classList.add('hidden');
    errEl.textContent = '';
    btnText.classList.add('hidden');
    spinner.classList.remove('hidden');
    btn.disabled = true;

    try {
      const res = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) {
        showError(errEl, data.error || 'Brak dostępu. Sprawdź czy używasz adresu @infolab.pl');
      } else {
        saveSession(data.user);
        showApp();
      }
    } catch {
      showError(errEl, 'Błąd połączenia z serwerem. Sprawdź połączenie z siecią firmową.');
    } finally {
      btnText.classList.remove('hidden');
      spinner.classList.add('hidden');
      btn.disabled = false;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
}

// ─── Nawigacja ────────────────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  document.getElementById('new-msg-shortcut').addEventListener('click', () => navigateTo('new-message'));
  document.getElementById('cancel-form-btn').addEventListener('click', () => navigateTo(currentView === 'new-message' ? 'active' : currentView));
}

function navigateTo(view) {
  // Nav items
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });

  // Views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const viewMap = {
    'active':      'view-active',
    'archived':    'view-archived',
    'generate-key':       'view-generate-key',
    'new-message': 'view-new-message'
  };

  const target = document.getElementById(viewMap[view]);
  if (target) target.classList.add('active');

  if (view !== 'new-message') currentView = view;

  // Ładowanie danych
  if (view === 'active')   loadMessages('active',   'active-list');
  if (view === 'archived') loadMessages('archived', 'archived-list');
  if (view === 'generate-key') loadKeys();
  if (view === 'new-message') resetForm();
}

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

// ─── Karta komunikatu ─────────────────────────────────────────────────────
function buildMsgCard(msg, filter) {
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

// ─── Toggle aktywności ────────────────────────────────────────────────────
async function toggleMessage(id, filter) {
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

// ─── Formularz ────────────────────────────────────────────────────────────
function setupMessageForm() {
  document.getElementById('message-form').addEventListener('submit', submitForm);
}

function setupGenerateKeyForm() {
  document.getElementById('generate-key-form').addEventListener('submit', submitGenerateKeyForm);
}

function resetForm() {
  editingId    = null;
  selectedFile = null;

  document.getElementById('form-view-title').textContent = 'Nowy komunikat';
  document.getElementById('submit-label').textContent    = 'Opublikuj komunikat';
  document.getElementById('edit-msg-id').value = '';
  document.getElementById('message-form').reset();
  document.getElementById('msg-time').value      = '10:00';
  document.getElementById('msg-duration').value  = '7';
  document.getElementById('msg-frequency').value = '1x_daily';
  document.getElementById('msg-push').checked    = true;
  document.getElementById('msg-active').checked  = true;

  clearUploadPreview();
  document.getElementById('form-error').classList.add('hidden');
  document.getElementById('form-success').classList.add('hidden');
}

async function openEditForm(id) {
  try {
    const res = await fetch(`${API}/messages/${id}`, { headers: authHeader() });
    const msg = await res.json();
    if (!res.ok) throw new Error(msg.error);

    navigateTo('new-message');

    editingId = id;
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

async function submitForm(e) {
  e.preventDefault();

  const headline    = document.getElementById('msg-headline').value.trim();
  const description = document.getElementById('msg-description').value.trim();
  const errEl       = document.getElementById('form-error');
  const successEl   = document.getElementById('form-success');
  const btn         = document.getElementById('submit-btn');

  errEl.classList.add('hidden');
  successEl.classList.add('hidden');

  if (!headline) return showError(errEl, 'Hasło główne jest wymagane.');
  if (!description) return showError(errEl, 'Opis jest wymagany.');

  btn.disabled = true;
  btn.querySelector('#submit-label').textContent = editingId ? 'Zapisywanie…' : 'Publikowanie…';

  const formData = new FormData();
  formData.append('headline',             headline);
  formData.append('description',          description);
  formData.append('display_duration_days', document.getElementById('msg-duration').value);
  formData.append('display_frequency',    document.getElementById('msg-frequency').value);
  formData.append('display_time',         document.getElementById('msg-time').value);
  formData.append('show_push',            document.getElementById('msg-push').checked);
  formData.append('is_active',            document.getElementById('msg-active').checked);

  if (selectedFile) formData.append('image', selectedFile);

  try {
    const url    = editingId ? `${API}/messages/${editingId}` : `${API}/messages`;
    const method = editingId ? 'PUT' : 'POST';

    const res  = await fetch(url, { method, headers: authHeader(), body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Błąd serwera');

    successEl.textContent = editingId ? '✅ Komunikat zaktualizowany.' : '✅ Komunikat opublikowany. Klienci zostaną powiadomieni o skonfigurowanej godzinie.';
    successEl.classList.remove('hidden');

    setTimeout(() => navigateTo('active'), 1200);

  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    document.getElementById('submit-label').textContent = editingId ? 'Zapisz zmiany' : 'Opublikuj komunikat';
  }
}

async function submitGenerateKeyForm(e) {
  e.preventDefault();

  const count = document.querySelector('input[name="key-count"]:checked').value;
  const keys = generateKeys(count); // Use the existing function to generate keys locally

  try {
    const res = await fetch(`${API}/keys/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({ keys }) // Send the generated keys to backend
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Reload all keys from database to show updated list
    await loadKeys();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// ─── Upload grafiki ───────────────────────────────────────────────────────
function setupUploadZone() {
  const zone    = document.getElementById('upload-zone');
  const input   = document.getElementById('msg-image');
  const removeBtn = document.getElementById('upload-remove');

  zone.addEventListener('click', (e) => {
    if (e.target === removeBtn || removeBtn.contains(e.target)) return;
    input.click();
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0]);
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearUploadPreview();
  });
}

function handleFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    alert('Niedozwolony format. Użyj JPG, PNG, WebP lub GIF.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('Plik jest zbyt duży. Maksymalny rozmiar to 5 MB.');
    return;
  }
  selectedFile = file;
  const url = URL.createObjectURL(file);
  showUploadPreview(url);
}

function showUploadPreview(src) {
  document.getElementById('upload-placeholder').classList.add('hidden');
  const preview = document.getElementById('upload-preview');
  preview.src = src;
  preview.classList.remove('hidden');
  document.getElementById('upload-remove').classList.remove('hidden');
}

function clearUploadPreview() {
  selectedFile = null;
  document.getElementById('upload-placeholder').classList.remove('hidden');
  const preview = document.getElementById('upload-preview');
  preview.src = '';
  preview.classList.add('hidden');
  document.getElementById('upload-remove').classList.add('hidden');
  document.getElementById('msg-image').value = '';
}

// ─── Modal usuwania ────────────────────────────────────────────────────────
function setupModal() {
  document.getElementById('confirm-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API}/messages/${deleteTarget}`, {
        method:  'DELETE',
        headers: authHeader()
      });
      if (!res.ok) throw new Error('Błąd usuwania');
      closeModal();
      await loadMessages('active',   'active-list');
      await loadMessages('archived', 'archived-list');
    } catch {
      alert('Nie udało się usunąć komunikatu.');
    }
  });
}

function openDeleteModal(id) {
  deleteTarget = id;
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  deleteTarget = null;
  document.getElementById('confirm-modal').classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
}

// ─── Generowanie kodów ────────────────────────────────────────────────────

function generateKeys(count) {
  const keys = [];
  
  const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  const keyLength = 8;
  

  for(let i = 0;i < count;i++){
    let key = '';
    do {
      for(let j = 0;j < keyLength;j++) {
        key += chars[Math.floor(Math.random() * chars.length)];
      }
    } while (keys.includes(key));

    keys.push(key);
  }

  return keys;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
