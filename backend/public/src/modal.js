import { API, authHeader } from './api.js';
import { state } from './state.js';
import { loadMessages } from './messages.js';

export function setupModal() {
  document.getElementById('confirm-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-backdrop').addEventListener('click', closeModal);
  document.getElementById('confirm-delete').addEventListener('click', async () => {
    if (!state.deleteTarget) return;
    try {
      const res = await fetch(`${API}/messages/${state.deleteTarget}`, {
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

export function openDeleteModal(id) {
  state.deleteTarget = id;
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

export function closeModal() {
  state.deleteTarget = null;
  document.getElementById('confirm-modal').classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
}