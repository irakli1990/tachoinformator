import { state } from './state.js';
import { loadMessages } from './messages.js';
import { loadKeys } from './keys.js';
import { resetForm } from './form.js';

export function showLogin() {
  document.getElementById('login-screen').classList.add('active');
  document.getElementById('app-screen').classList.remove('active');
}

export function showApp() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('app-screen').classList.add('active');

  const userAvatar = document.getElementById('user-avatar');
  const userEmailDisplay  = document.getElementById('user-email-display');
  const userDept   = document.getElementById('user-dept');

  if (state.currentUser) {
    userAvatar.textContent = state.currentUser.email[0].toUpperCase();
    userEmailDisplay.textContent  = state.currentUser.email;
    userDept.textContent   = state.currentUser.department || '';
  }

  navigateTo(restoreView());
}

export function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  document.getElementById('new-msg-shortcut').addEventListener('click', () => navigateTo('new-message'));
  document.getElementById('cancel-form-btn').addEventListener('click', () => navigateTo(state.currentView === 'new-message' ? 'active' : state.currentView));
}

export function navigateTo(view) {
  localStorage.setItem('cp_view', view);

  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });

  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const viewMap = {
    'active':       'view-active',
    'archived':     'view-archived',
    'generate-key': 'view-generate-key',
    'new-message':  'view-new-message'
  };

  const target = document.getElementById(viewMap[view]);
  if (target) target.classList.add('active');

  if (view !== 'new-message') state.currentView = view;
  if (view === 'active')   loadMessages('active',   'active-list');
  if (view === 'archived') loadMessages('archived', 'archived-list');
  if (view === 'generate-key') loadKeys();
  if (view === 'new-message') resetForm();
}

function restoreView() {
  const saved = localStorage.getItem('cp_view');
  return saved || 'active';
}
