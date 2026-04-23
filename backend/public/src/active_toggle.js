// ─── Importy ──────────────────────────────────────────────────────────────
import { API, authHeader } from './admin.js';
import { loadMessages } from './communicate_loading.js';

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

export { toggleMessage };