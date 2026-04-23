import { showError } from './utils.js';
import { saveSession } from './session.js';
import { showApp } from './navigation.js';
import { logout } from './session.js';
import { API } from './api.js';

export function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const loginBtn = document.getElementById('login-btn');
  const btnText = loginBtn.querySelector('.btn-text');
  const btnSpinner = loginBtn.querySelector('.btn-spinner');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email-input').value.trim();

    loginError.classList.add('hidden');
    loginError.textContent = '';
    btnText.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
    loginBtn.disabled = true;

    try {
      const res = await fetch(`${API}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) {
        showError(loginError, data.error || 'Brak dostępu. Sprawdź czy używasz adresu @infolab.pl');
      } else {
        saveSession(data.user);
        showApp();
      }
    } catch(err) {
      console.error(err);
      showError(loginError, 'Błąd połączenia z serwerem. Sprawdź połączenie z siecią firmową.');
    } finally {
      btnText.classList.remove('hidden');
      btnSpinner.classList.add('hidden');
      loginBtn.disabled = false;
    }
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
}

