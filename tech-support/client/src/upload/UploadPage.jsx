import { useSignal, useComputed } from '@preact/signals';
import { DropZone } from './DropZone';
import { FileList } from './FileList';
import { initUpload, completeUpload, uploadToS3, API, useAuth } from '../shared/api';
import './upload.css';

const MAX_RETRIES = 3;

async function retryUpload(url, file, onProgress) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await uploadToS3(url, file, onProgress);
    } catch (err) {
      if (attempt === MAX_RETRIES - 1) throw err;
      await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 6000)));
    }
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UploadPage() {
  const files      = useSignal([]);
  const progress   = useSignal({});
  const loading    = useSignal(false);
  const success    = useSignal(false);
  const error      = useSignal('');
  const nameError  = useSignal(false);
  const emailError = useSignal(false);

  const hasFiles = useComputed(() => files.value.length > 0);

  function addFiles(newFiles) {
    const existing = files.value;
    const deduped = newFiles.filter(
      f => !existing.find(e => e.name === f.name && e.size === f.size)
    );
    files.value = [...existing, ...deduped];
  }

  function removeFile(index) {
    files.value = files.value.filter((_, i) => i !== index);
  }

  function setProgress(index, pct) {
    progress.value = { ...progress.value, [index]: pct };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    error.value = '';

    const name        = e.target.name.value.trim();
    const email       = e.target.email.value.trim();
    const description = e.target.description.value.trim();
    nameError.value  = !name;
    emailError.value = !EMAIL_RE.test(email);

    if (nameError.value || emailError.value) return;
    if (!hasFiles.value) {
      error.value = 'Wybierz co najmniej jeden plik.';
      return;
    }

    loading.value = true;

    const { getAuthHeader } = useAuth(email);

    try {
      const formData = new FormData();

      formData.append('name', name);
      formData.append('email', email);
      formData.append('description', description);

      files.value.forEach(file => {
          formData.append('files', file);
      });

       const res = await fetch(`${API}/support/upload`, {
            method: 'POST',
            body: formData
        });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Błąd serwera');
      success.value = true;
    } catch (err) {
        error.value = { type: 'error', msg: err.message };
    } finally {
        e.target.description.value = '';
    }
  }

  function reset() {
    files.value    = [];
    progress.value = {};
    error.value    = '';
    loading.value  = false;
    nameError.value  = false;
    emailError.value = false;
    success.value = false;
  }

  return (
    <>
      <header class="header">
        <div class="logo">
            <img src="src\assets\logo-normal.png" alt="logo" />
        </div>
      </header>

      <main class="main">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Prześlij pliki do działu wsparcia</div>
            <div class="card-subtitle">Wypełnij formularz i dołącz pliki — nasz zespół odezwie się najszybciej jak to możliwe.</div>
          </div>

          {success.value ? (
            <div class="success-view">
              <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="#2E7D32">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div class="success-title">Pliki zostały przesłane!</div>
              <div class="success-sub">Dziękujemy. Nasz dział wsparcia otrzymał powiadomienie i skontaktuje się z Tobą wkrótce.</div>
              <button class="btn-new" onClick={reset}>Prześlij kolejne pliki</button>
            </div>
          ) : (
            <div class="card-body">
              {error.value && (
                <div class="banner error">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  <div class="banner-text">
                    <span class="banner-title">Wystąpił błąd</span>
                    <span class="banner-sub">{error.value}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} novalidate>
                <div class={`field${nameError.value ? ' has-error' : ''}`}>
                  <label for="name">Imię i nazwisko / firma <span class="required-dot" /></label>
                  <input
                    type="text" id="name" name="name"
                    placeholder="Jan Kowalski" autocomplete="name"
                    onInput={() => { nameError.value = false; }}
                  />
                  <div class="field-error">Pole wymagane.</div>
                </div>

                <div class={`field${emailError.value ? ' has-error' : ''}`}>
                  <label for="email">Adres e-mail <span class="required-dot" /></label>
                  <input
                    type="email" id="email" name="email"
                    placeholder="jan@firma.pl" autocomplete="email"
                    onInput={() => { emailError.value = false; }}
                  />
                  <div class="field-error">Podaj poprawny adres e-mail.</div>
                </div>

                <div class="field">
                  <label for="description">Opis problemu</label>
                  <textarea id="description" name="description" placeholder="Opisz krótko z czym potrzebujesz pomocy…" />
                </div>

                <hr class="divider" />

                <DropZone
                  onFiles={addFiles}
                  onError={(msg) => { error.value = msg; }}
                />

                <FileList
                  files={files.value}
                  progress={progress.value}
                  onRemove={removeFile}
                />

                <button type="submit" class="btn-submit" disabled={loading.value}>
                  {loading.value ? (
                    <><div class="spinner" /><span>Wysyłanie…</span></>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      <span>Wyślij do supportu</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer class="footer">
        Pliki są przesyłane szyfrowanym połączeniem (HTTPS) i przechowywane na zabezpieczonych serwerach AWS S3.
      </footer>
    </>
  );
}
