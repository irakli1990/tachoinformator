import { formatSize } from '../shared/formatters';

export function FileList({ files, progress, onRemove }) {
  if (!files.length) return null;

  return (
    <div class="file-list">
      {files.map((f, i) => (
        <div class="file-item" key={`${f.name}-${f.size}`}>
          <div class="file-icon">
          </div>
          <div class="file-info">
            <div class="file-name" title={f.name}>{f.name}</div>
            <div class="file-size">{formatSize(f.size)}</div>
            {progress[i] != null && (
              <div class="file-progress-wrap">
                <div class="file-progress-bar" style={{ width: `${progress[i]}%` }} />
              </div>
            )}
          </div>
          <button
            type="button"
            class="remove-btn"
            onClick={() => onRemove(i)}
            title="Usuń plik"
            disabled={progress[i] != null}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
