// ─── Importy ──────────────────────────────────────────────────────────────
import { selectedFile, updateSelectedFile } from './admin.js';

// ─── Upload grafiki ───────────────────────────────────────────────────────
function setupUploadZone() {
  const zone    = document.getElementById('upload-zone');
  const input   = document.getElementById('msg-image');
  const removeBtn = document.getElementById('upload-remove');

  zone.addEventListener('click', (e) => {
    if (e.target === removeBtn || removeBtn.contains(e.target)) return;
    input.click();
  });

  input.addEventListener('change', () => {
    if (input.files[0]) handleFile(input.files[0]);
  });

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });

  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearUploadPreview();
  });
}

function handleFile(file) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    alert('Niedozwolony format. Użyj JPG, PNG, WebP lub GIF.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    alert('Plik jest zbyt duży. Maksymalny rozmiar to 5 MB.');
    return;
  }
  updateSelectedFile(file);
  const url = URL.createObjectURL(file);
  showUploadPreview(url);
}

function showUploadPreview(src) {
  document.getElementById('upload-placeholder').classList.add('hidden');
  const preview = document.getElementById('upload-preview');
  preview.src = src;
  preview.classList.remove('hidden');
  document.getElementById('upload-remove').classList.remove('hidden');
}

function clearUploadPreview() {
  updateSelectedFile(null);
  document.getElementById('upload-placeholder').classList.remove('hidden');
  const preview = document.getElementById('upload-preview');
  preview.src = '';
  preview.classList.add('hidden');
  document.getElementById('upload-remove').classList.add('hidden');
  document.getElementById('msg-image').value = '';
}

export { setupUploadZone, handleFile, showUploadPreview, clearUploadPreview };