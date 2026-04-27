import { API, authHeader } from './api.js';

export async function loadKeys() {
  setupKeysPages();

  const keyList = document.getElementById('key-list');
  keyList.innerHTML = `
    <div class="list-loading">
      <div class="spinner"></div>
      <span>Ładowanie kodów…</span>
    </div>`;

  try {
    const res = await fetch(`${API}/keys`, { headers: authHeader() });
    const keys = await res.json();

    if (!res.ok) throw new Error(keys.error || 'Błąd serwera');

    if (keys.length === 0) {
      keyList.innerHTML = `
        <div class="empty-state">
          <p>Brak wygenerowanych kodów.</p>
        </div>`;
      return;
    }

    keyList.innerHTML = '';
    keys.forEach(key => {
      const keyRow = document.createElement('div');
      keyRow.className = 'key-row';
      keyRow.dataset.id = key.id;

      keyRow.innerHTML = `
        <span class="key-label">${key.secret_key}</span>
        <span class="key-status">${key.status}</span>
        <button type="button"
                class="action-btn action-copy"
                data-id="${key.id}"
                data-key="${key.secret_key}"
                title="Skopiuj">
          <i class="fa-regular fa-copy"></i>
        </button>
      `;

      if (key.status === 'Wykorzystany') {
        keyRow.style.backgroundColor = "#f3f3f3";

        const label = keyRow.querySelector('.key-label');
        label.style.backgroundColor = "#eaeaea";
        label.style.color = "#848484";

        const statusEl = keyRow.querySelector('.key-status');
        statusEl.style.backgroundColor = "var(--red-light)";
        statusEl.style.color = "var(--red)";
      }

      keyRow.querySelector('.action-copy').addEventListener('click', async (e) => {
        e.preventDefault();
        const copyButton = e.currentTarget;

        try {
          await navigator.clipboard.writeText(key.secret_key);

          const res = await fetch(`${API}/keys/${key.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              ...authHeader()
            },
            body: JSON.stringify({
              status: 'Wykorzystany'
            })
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || data.message || 'Nie udało się zaktualizować statusu');

          copyButton.innerHTML = '<i class="fa-solid fa-check"></i>';
          copyButton.disabled = true;

          keyRow.style.backgroundColor = "#f3f3f3";

          const keyLabel = keyRow.querySelector('.key-label');
          keyLabel.style.backgroundColor = "#eaeaea";
          keyLabel.style.color = "#848484";

          const keyStatus = keyRow.querySelector('.key-status');
          keyStatus.style.backgroundColor = "var(--red-light)";
          keyStatus.style.color = "var(--red)";
          keyStatus.textContent = "Wykorzystany";

          setTimeout(() => {
            copyButton.innerHTML = '<i class="fa-regular fa-copy"></i>';
            copyButton.disabled = false;
          }, 2000);

        } catch (err) {
          alert('Nie udało się skopiować lub zaktualizować klucza: ' + err.message);
        }
      });

      keyList.appendChild(keyRow);
    });

  } catch (err) {
    keyList.innerHTML = `<div class="error-msg">Błąd: ${err.message}</div>`;
  }
}

export function setupGenerateKeyForm() {
  document.getElementById('generate-key-form').addEventListener('submit', submitGenerateKeyForm);
}

export async function submitGenerateKeyForm(e) {
  e.preventDefault();

  const count = document.querySelector('input[name="key-count"]:checked').value;

  try {
    const res = await fetch(`${API}/keys/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify({
        count: Number(count)
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error generating keys');

     try {
      const numberRes = await fetch(`${API}/keys/overflow`, { 
        headers: authHeader() 
      });
      if (!numberRes.ok) throw new Error('Nie można sprawdzić liczby kluczy');

      const data = await numberRes.json();
      const numberOfKeys = data.count;
      console.log("Liczba kluczy: ", numberOfKeys);
      if (numberOfKeys >= 1000) {
        try {
          const deleteCount = numberOfKeys - 1000;
          const res = await fetch(`${API}/keys/overflow?limit=${deleteCount}`, {
            method: 'DELETE',
            headers: authHeader()
          });

          if (!res.ok) throw new Error('Nie można usunąć nadmiarowych kluczy');

          const data = await res.json();
          console.log(`Usunięto ${data.deleted} kluczy`);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      }

    } catch (numErr) {
      alert('Klucze zostały wygenerowane, ale nie można sprawdzić liczby kluczy w bazie: ' + numErr.message);
    }


    await loadKeys();

  } catch (err) {
    alert('Error: ' + err.message);
  }
}

let initialized = false;

async function setupKeysPages() {
   try {
      const numberRes = await fetch(`${API}/keys/overflow`, { 
        headers: authHeader() 
      });
      if (!numberRes.ok) throw new Error('Nie można sprawdzić liczby kluczy');

      const keysPerPage = document.getElementById('keys-per-page');
      const currentPage = document.getElementById('key-page');
      const pageDownBtn = document.getElementById('page-down');
      const pageUpBtn = document.getElementById('page-up');

      if (!initialized) {
        initialized = true;

        keysPerPage.addEventListener('change', () => {
          updateValues();
        });

        currentPage.addEventListener('change', () => {
          pageChanged();
        });

        pageDownBtn.addEventListener('click', () => changePageBtn(-1));

        pageUpBtn.addEventListener('click', () => changePageBtn(1));

      }

      const data = await numberRes.json();
      const numberOfKeys = data.count;

      let keyPagesMax;

      function updateValues(){
        keyPagesMax = Math.ceil(numberOfKeys / keysPerPage.value);  

        const keyAmount = document.getElementById('key-amount');
        const keysPagesAmount = document.getElementById('max-pages');

        keyAmount.innerText = (keysPerPage.value*currentPage.value + 1 - keysPerPage.value) + " - " + (keysPerPage.value*currentPage.value + numberOfKeys - Math.abs(keysPerPage.value*currentPage.value-numberOfKeys))/2 + " / " + numberOfKeys;

        keysPagesAmount.innerHTML = keyPagesMax;
      }

      updateValues();
            

      function pageChanged(){
        updateValues();
        console.log("changed the page");
      }

      function changePageBtn(value){
        const currentPage = document.getElementById('key-page');
        currentPage.value = Number(currentPage.value) + value;
        if(currentPage.value < 1) currentPage.value = 1;
        if(currentPage.value > keyPagesMax) currentPage.value = keyPagesMax;
        pageChanged();
      }


    } catch (numErr) {
      alert('Klucze zostały wygenerowane, ale nie można sprawdzić liczby kluczy w bazie: ' + numErr.message);
    }
}