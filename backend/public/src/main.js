import { restoreSession } from './session.js';
import { setupNavigation } from './navigation.js';
import { setupMessageForm } from './form.js';
import { setupGenerateKeyForm } from './keys.js';
import { setupUploadZone } from './upload.js';
import { setupModal } from './modal.js';
import { setupLoginForm } from './login.js';

document.addEventListener('DOMContentLoaded', () => {
  restoreSession();
  setupLoginForm();
  setupNavigation();
  setupMessageForm();
  setupGenerateKeyForm();
  setupUploadZone();
  setupModal();
});