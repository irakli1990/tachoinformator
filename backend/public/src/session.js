// ─── Importy ──────────────────────────────────────────────────────────────
import { currentUser, setCurrentUser } from "./main.js";
import { showLogin } from "./views_login_app.js";
// ─── Sesja ────────────────────────────────────────────────────────────────
function saveSession(user) {
  localStorage.setItem('cp_user', JSON.stringify(user));
  setCurrentUser(user);
}

function restoreSession() {
  const stored = localStorage.getItem('cp_user');
  if (stored) {
    try {
      setCurrentUser(JSON.parse(stored));
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
  setCurrentUser(null);
  showLogin();
}

function authHeader() {
  if (!currentUser) return {};
  return { Authorization: 'Bearer ' + btoa(currentUser.email) };
}

export { saveSession, restoreSession, logout, authHeader };