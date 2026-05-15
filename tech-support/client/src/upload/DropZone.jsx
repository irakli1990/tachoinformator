import { useRef } from 'preact/hooks';
import { useSignal } from '@preact/signals';

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

export function DropZone({ onFiles, onError }) {
  const dragOver = useSignal(false);
  const inputRef = useRef(null);

  function handleFiles(files) {
    const valid = [];
    for (const f of files) {
      if (f.size > MAX_FILE_SIZE) {
        onError(`Plik "${f.name}" jest za duży (maks. 5 GB).`);
      } else {
        valid.push(f);
      }
    }
    if (valid.length) onFiles(valid);
  }

  return (
    <div
      class={`dropzone${dragOver.value ? ' drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); dragOver.value = true; }}
      onDragLeave={() => { dragOver.value = false; }}
      onDrop={(e) => {
        e.preventDefault();
        dragOver.value = false;
        handleFiles(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          handleFiles(Array.from(e.target.files));
          e.target.value = '';
        }}
      />
      <div class="drop-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <div class="drop-title">Przeciągnij pliki tutaj</div>
      <div class="drop-sub">lub <strong>kliknij aby wybrać</strong> · maks. 5 GB / plik</div>
    </div>
  );
}
