// ─── Importy ───────────────────────────────────────────────────────────────
import { API, authHeader, deleteTarget, updateDeleteTarget } from './admin.js';
import { loadMessages } from './communicate_loading.js';

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
  updateDeleteTarget(id);
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  updateDeleteTarget(null);
  document.getElementById('confirm-modal').classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
}

export { setupModal, openDeleteModal, closeModal };