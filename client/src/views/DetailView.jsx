import Header from '../components/Header';

export default function DetailView({ onBack }) {
  return (
    <div id="view-detail" class="view active">

      <Header
        leftContent={
          <button
            id="btn-back"
            class="back-btn"
            onClick={onBack}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M15 19l-7-7 7-7"/>
            </svg>

            Wróć do listy
          </button>
        }

        rightContent={
          <button
            id="btn-close-detail"
            class="icon-btn close-btn"
            title="Zamknij"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        }
      />

      <div id="detail-content" class="detail-content">
        <h2>Szczegóły komunikatu</h2>
        <p>Tutaj będzie treść komunikatu.</p>
      </div>
    </div>
  );
}