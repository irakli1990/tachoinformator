// ─── Importy ──────────────────────────────────────────────────────────────
import { API, authHeader, saveSession, logout, showError } from './admin.js';
import { showApp } from './view_user-app.js';

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

export { setupLoginForm };