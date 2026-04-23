import { currentUser } from "./admin.js";
import { navigateTo } from "./navigation.js";

// ─── Widoki: Login / App ───────────────────────────────────────────────────
function showLogin() {
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
}

function showApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  // Uzupełnij dane użytkownika w sidebar
  const avatarEl = document.getElementById('user-avatar');
  const emailEl  = document.getElementById('user-email-display');
  const deptEl   = document.getElementById('user-dept');

  if (currentUser) {
    avatarEl.textContent = currentUser.email[0].toUpperCase();
    emailEl.textContent  = currentUser.email;
    deptEl.textContent   = currentUser.department || '';
  }

  navigateTo('active');
}

export { showLogin, showApp };