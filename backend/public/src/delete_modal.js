// ─── Importy ──────────────────────────────────────────────────────────────
import { API, deleteTarget, setDeleteTarget } from "./main.js";
import { authHeader } from "./session.js";
import { loadMessages } from "./messages_loading.js";
import { currentUser } from "./main.js";
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
  setDeleteTarget(id);
  document.getElementById('confirm-modal').classList.remove('hidden');
  document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal() {
  setDeleteTarget(null);
  document.getElementById('confirm-modal').classList.add('hidden');
  document.getElementById('modal-backdrop').classList.add('hidden');
}

export { setupModal, openDeleteModal, closeModal };