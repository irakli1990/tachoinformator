import { API, authHeader } from './api.js';
import { state } from './state.js';
import { showError } from './utils.js';
import { navigateTo } from './navigation.js';
import { clearUploadPreview } from './upload.js';

export function setupMessageForm() {
  document.getElementById('message-form').addEventListener('submit', submitForm);
}

export function resetForm() {
  state.editingId    = null;
  state.selectedFile = null;

  document.getElementById('form-view-title').textContent = 'Nowy komunikat';
  document.getElementById('submit-label').textContent    = 'Opublikuj komunikat';
  document.getElementById('edit-msg-id').value = '';
  document.getElementById('message-form').reset();
  document.getElementById('msg-time').value      = '10:00';
  document.getElementById('msg-duration').value  = '7';
  document.getElementById('msg-frequency').value = '1x_daily';
  document.getElementById('msg-interval').value = '01:00';
  document.getElementById('msg-push').checked    = true;
  document.getElementById('msg-active').checked  = true;

  clearUploadPreview();
  document.getElementById('form-error').classList.add('hidden');
  document.getElementById('form-success').classList.add('hidden');
  document.getElementById('msg-has-image').checked = false;
  document.getElementById('image-upload-wrapper').classList.add('hidden');
}

export async function submitForm(e) {
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
  btn.querySelector('#submit-label').textContent = state.editingId ? 'Zapisywanie…' : 'Publikowanie…';

  const formData = new FormData();
  formData.append('headline',              headline);
  formData.append('description',           description);
  formData.append('display_duration_days', document.getElementById('msg-duration').value);
  formData.append('display_frequency',     document.getElementById('msg-frequency').value);
  formData.append('display_interval',      document.getElementById('msg-interval').value);
  formData.append('display_time',          document.getElementById('msg-time').value);
  formData.append('show_push',             document.getElementById('msg-push').checked);
  formData.append('is_active',             document.getElementById('msg-active').checked);

  const hasImage = document.getElementById('msg-has-image').checked;
  if (hasImage && state.selectedFile) {
    formData.append('image', state.selectedFile);
  }

  try {
    const url    = state.editingId ? `${API}/messages/${state.editingId}` : `${API}/messages`;
    const method = state.editingId ? 'PUT' : 'POST';

    const res  = await fetch(url, { method, headers: authHeader(), body: formData });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Błąd serwera');

    successEl.textContent = state.editingId ? 'Komunikat zaktualizowany.' : 'Komunikat opublikowany. Klienci zostaną powiadomieni o skonfigurowanej godzinie.';
    successEl.classList.remove('hidden');

    setTimeout(() => navigateTo('active'), 1200);

  } catch (err) {
    showError(errEl, err.message);
  } finally {
    btn.disabled = false;
    document.getElementById('submit-label').textContent = state.editingId ? 'Zapisz zmiany' : 'Opublikuj komunikat';
  }
}

export function setupImageToggle() {
  const checkbox = document.getElementById('msg-has-image');
  const wrapper  = document.getElementById('image-upload-wrapper');

  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      wrapper.classList.remove('hidden');
    } else {
      wrapper.classList.add('hidden');
      state.selectedFile = null;
      clearUploadPreview();
    }
  });
}

export function setupMessageInterval() {
  const messageFrequency = document.getElementById('msg-frequency');
  const messageInterval = document.getElementById('msg-interval');

  messageFrequency.addEventListener('change', () => {
    if (messageFrequency.selectedIndex > 0) messageInterval.parentElement.classList.remove('hidden');
    else messageInterval.parentElement.classList.add('hidden');
  })
}