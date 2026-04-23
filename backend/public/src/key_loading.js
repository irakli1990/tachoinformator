// ─── Importy ─────────────────────────────────────────────────────────────
import { API, authHeader } from './admin.js';

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
      keyRow.dataset.id = key.id;

      keyRow.innerHTML = `
        <span class="key-label">${key.secret_key}</span>
        <span class="key-status">${key.status}</span>
        <button type="button"
                class="action-btn action-copy"
                data-id="${key.id}"
                data-key="${key.secret_key}"
                title="Skopiuj">
          <i class="fa-regular fa-copy"></i>
        </button>
      `;

      if (key.status === 'Wykorzystany') {
        keyRow.style.backgroundColor = "#f3f3f3";

        const label = keyRow.querySelector('.key-label');
        label.style.backgroundColor = "#eaeaea";
        label.style.color = "#848484";

        const statusEl = keyRow.querySelector('.key-status');
        statusEl.style.backgroundColor = "#b2f5a2";
        statusEl.style.color = "#2b4c23";
      }

      keyRow.querySelector('.action-copy').addEventListener('click', async (e) => {
        e.preventDefault();
        const copyButton = e.currentTarget;

        try {
          await navigator.clipboard.writeText(key.secret_key);

          const res = await fetch(`${API}/keys/${key.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...authHeader()
            },
            body: JSON.stringify({
              status: 'Wykorzystany'
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || data.message || 'Nie udało się zaktualizować statusu');

          copyButton.innerHTML = '<i class="fa-solid fa-check"></i>';
          copyButton.disabled = true;

          keyRow.style.backgroundColor = "#f3f3f3";

          const keyLabel = keyRow.querySelector('.key-label');
          keyLabel.style.backgroundColor = "#eaeaea";
          keyLabel.style.color = "#848484";

          const keyStatus = keyRow.querySelector('.key-status');
          keyStatus.style.backgroundColor = "#b2f5a2";
          keyStatus.style.color = "#2b4c23";
          keyStatus.textContent = "Wykorzystany";

          setTimeout(() => {
            copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
            copyButton.disabled = false;
          }, 2000);

        } catch (err) {
          alert('Nie udało się skopiować lub zaktualizować klucza: ' + err.message);
        }
      });

      keyList.appendChild(keyRow);
    });

  } catch (err) {
    keyList.innerHTML = `<div class="error-msg">Błąd: ${err.message}</div>`;
  }
}

export { loadKeys };