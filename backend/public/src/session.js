// ─── Importy ──────────────────────────────────────────────────────────────
import { showLogin, showApp } from "./view_user-app.js";
import { currentUser, updateCurrentUser } from "../admin";

// ─── Sesja ────────────────────────────────────────────────────────────────
function saveSession(user) {
  localStorage.setItem('cp_user', JSON.stringify(user));
  updateCurrentUser(user);
}

function restoreSession() {
  const stored = localStorage.getItem('cp_user');
  if (stored) {
    try {
      updateCurrentUser(JSON.parse(stored));
      showApp();
    } catch {
      localStorage.removeItem('cp_user');
      showLogin();
    }
  } else {
    showLogin();
  }
}

function logout() {
  localStorage.removeItem('cp_user');
  updateCurrentUser(null);
  showLogin();
}

function authHeader() {
  if (!currentUser) return {};
  return { Authorization: 'Bearer ' + btoa(currentUser.email) };
}

export { saveSession, restoreSession, logout, authHeader };