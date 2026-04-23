// ─── Importy ──────────────────────────────────────────────────────────────
import { API, authHeader } from "./main.js";
import { loadMessages } from "./messages_loading.js";
import { currentUser } from "./main.js";
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