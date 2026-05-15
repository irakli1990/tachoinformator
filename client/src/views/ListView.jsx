import Header from '../components/Header';
import LoadingState from '../components/LoadingState';

export default function ListView({ onOpenDetail }) {
  return (
    <div id="view-list" class="view active">

      <Header
        leftContent={
          <div class="app-logo">
            <img
              className="logo"
              src="./assets/logo-white.png"
              alt="logo"
            />
          </div>
        }

        rightContent={
          <>
            <span id="msg-count" class="msg-count">
              0 wiadomości
            </span>

            <button
              id="btn-refresh"
              class="icon-btn"
              title="Odśwież"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>

            <button
              id="btn-close"
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
          </>
        }
      />

      <div id="list-content" class="list-content">
        <LoadingState />

        <button onClick={onOpenDetail}>
          Otwórz szczegóły
        </button>
      </div>
    </div>
  );
}