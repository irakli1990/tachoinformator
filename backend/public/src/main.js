/* ════════════════════════════════════════════════════════════
   Info Tachospeed – Admin Panel SPA JavaScript
   ════════════════════════════════════════════════════════════ */

// ─── Importy ───────────────────────────────────────────────────────────────
import { restoreSession } from "./session.js";
import { setupLoginForm } from "./login.js";
import { setupNavigation } from "./navigation.js";
import { setupMessageForm, setupGenerateKeyForm } from "./form.js";
import { setupUploadZone } from "./image_upload.js";
import { setupModal } from "./delete_modal.js";

const API = 'http://localhost:3000/api';

// ─── Stan aplikacji ────────────────────────────────────────────────────────
let currentUser = null;
function setCurrentUser(user) {
  currentUser = user;
}
let currentView = 'active';
function setCurrentView(view) {
  currentView = view;
}
let editingId = null;
function setEditingId(id) {
  editingId = id;
}
let deleteTarget = null;
function setDeleteTarget(id) {
  deleteTarget = id;
}
let selectedFile = null;
function setSelectedFile(file) {
  selectedFile = file;
}

// ─── Init ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  setupLoginForm();
  setupNavigation();
  setupMessageForm();
  setupGenerateKeyForm();
  setupUploadZone();
  setupModal();
});

export { API, currentUser, setCurrentUser, currentView, setCurrentView, editingId, setEditingId, deleteTarget, setDeleteTarget, selectedFile, setSelectedFile };