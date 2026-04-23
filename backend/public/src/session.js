import { state } from './state.js';
import { showApp, showLogin } from './navigation.js';

export function saveSession(user) {
  localStorage.setItem('cp_user', JSON.stringify(user));
  state.currentUser = user;
}

export function restoreSession() {
  const stored = localStorage.getItem('cp_user');
  if (stored) {
    try {
      state.currentUser = JSON.parse(stored);
      showApp();
    } catch {
      localStorage.removeItem('cp_user');
      showLogin();
    }
  } else {
    showLogin();
  }
}

export function logout() {
  localStorage.removeItem('cp_user');
  localStorage.removeItem('cp_view');
  state.currentUser = null;
  showLogin();
}

