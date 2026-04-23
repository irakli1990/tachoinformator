// ─── Importy ──────────────────────────────────────────────────────────────
import { currentView, updateCurrentView, resetForm } from "./admin.js";
import { loadMessages } from "./communicate_loading.js";
import { loadKeys } from "./key_loading.js";

// ─── Nawigacja ────────────────────────────────────────────────────────────
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });

  document.getElementById('new-msg-shortcut').addEventListener('click', () => navigateTo('new-message'));
  document.getElementById('cancel-form-btn').addEventListener('click', () => navigateTo(currentView === 'new-message' ? 'active' : currentView));
}

function navigateTo(view) {
  // Nav items
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });

  // Views
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  const viewMap = {
    'active':      'view-active',
    'archived':    'view-archived',
    'generate-key':       'view-generate-key',
    'new-message': 'view-new-message'
  };

  const target = document.getElementById(viewMap[view]);
  if (target) target.classList.add('active');

  if (view !== 'new-message') updateCurrentView(view);

  // Ładowanie danych
  if (view === 'active')   loadMessages('active',   'active-list');
  if (view === 'archived') loadMessages('archived', 'archived-list');
  if (view === 'generate-key') loadKeys();
  if (view === 'new-message') resetForm();
}

export { setupNavigation, navigateTo };