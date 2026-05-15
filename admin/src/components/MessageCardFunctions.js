import { API } from "../api";
import { route } from "preact-router";

export async function toggleMessage(id, getAuthHeader, setMessages) {
    try {
        const res = await fetch(`${API}/messages/${id}/toggle`, {
            method: 'PATCH',
            headers: getAuthHeader()
        });

        if (!res.ok) {
            throw new Error();
        }
        
        setMessages(prev =>
            prev.map(msg =>
                msg.id === id ? { ...msg, is_active: !msg.is_active } : msg
            )
        );

        location.reload();

    } catch {
        alert('Nie udało się zmienić statusu.');
    }
}

export async function openEditForm(id) {
    route(`/informator/edytuj-komunikat?id=${id}`);
}

export async function deleteMessage(id, getAuthHeader, setMessages) {
  if (!confirm('Na pewno usunąć komunikat?')) return;

  try {
    const res = await fetch(`${API}/messages/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });

    if (!res.ok) throw new Error();

    setMessages(prev => prev.filter(m => m.id !== id));
  } catch {
    alert('Nie udało się usunąć komunikatu.');
  }
}