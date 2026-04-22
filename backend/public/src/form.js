// ─── Importy ──────────────────────────────────────────────────────────────
import { API, editingId, selectedFile, setEditingId, setSelectedFile } from "./main.js";
import { navigateTo } from "./navigation.js";
import { showError } from "./helpers.js";
import { showUploadPreview } from "./image_upload.js";
import { generateKeys } from "./key_generating.js";
import { authHeader } from "./session.js";
import { loadKeys } from "./key_loading.js";
import { currentUser } from "./main.js";
// ─── Formularz ────────────────────────────────────────────────────────────
function setupMessageForm() {
  document.getElementById('message-form').addEventListener('submit', submitForm);
}

function setupGenerateKeyForm() {
  document.getElementById('generate-key-form').addEventListener('submit', submitGenerateKeyForm);
}

function resetForm() {
  setEditingId(null);
  setSelectedFile(null);

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

export { setupMessageForm, setupGenerateKeyForm, resetForm, openEditForm, submitForm, submitGenerateKeyForm };