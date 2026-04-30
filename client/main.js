const { app, BrowserWindow, Tray, Menu, nativeImage, shell,
        Notification, ipcMain, screen, powerMonitor } = require('electron');
const path = require('path');
const fs   = require('fs');

// ─── Konfiguracja ─────────────────────────────────────────────────────────
const API_BASE       = 'http://localhost:3000/api';
const CHECK_INTERVAL = 15 * 60 * 1000; // Fallback: co 15 minut
const STORE_PATH     = path.join(app.getPath('userData'), 'state.json');
const APP_NAME       = 'Info Tachospeed';
const AUTO_START     = true; // Uruchamiaj automatycznie z Windows

let tray            = null;
let messagesWindow  = null;
let schedulerTimer  = null;
let isQuitting      = false;

// ─── Persystencja stanu (bez electron-store, czyste JSON) ─────────────────
function loadState() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    }
  } catch { /* ignoruj */ }
  return { shownToday: {} };
}

function saveState(state) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Błąd zapisu stanu:', err.message);
  }
}

// ─── Aplikacja – single instance ─────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (messagesWindow) {
      if (messagesWindow.isMinimized()) messagesWindow.restore();
      messagesWindow.show();
      messagesWindow.focus();
    }
  });
}

// ─── Start ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  // Ukryj z paska zadań – tylko tray
  if (process.platform === 'win32') {
    app.setAppUserModelId('pl.infolab.tachospeed');
  }

  // Na macOS ukryj ikonę z Docka – aplikacja żyje tylko w tray
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  // Auto-start
  if (AUTO_START) {
    app.setLoginItemSettings({
      openAtLogin: true,
      name: APP_NAME
    });
  }

  createTray();
  startScheduler();
});

app.on('window-all-closed', (e) => {
  // NIE zamykaj aplikacji gdy użytkownik zamknie okno – wróć do tray
  if (!isQuitting) e.preventDefault();
});

app.on('before-quit', () => { isQuitting = true; });

// ─── Tray ─────────────────────────────────────────────────────────────────
function createTray() {
  // Ikona tray – generujemy prostą ikonę SVG konwertując na nativeImage
  const iconPath = path.join(__dirname, 'assets', 'ikona.png');

  let icon;
  if (fs.existsSync(iconPath)) {
    icon = nativeImage.createFromPath(iconPath);
  } else {
    // Fallback: pusta ikona 16x16
    icon = nativeImage.createEmpty();
  }

  if (process.platform === 'win32') {
    icon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip(`${APP_NAME} — Komunikaty firmowe`);

  updateTrayMenu();

  tray.on('click', () => openMessagesWindow());
  tray.on('double-click', () => openMessagesWindow());
}

function updateTrayMenu(msgCount = 0) {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: msgCount > 0
        ? `📢 Komunikaty (${msgCount} aktywnych)`
        : `📢 ${APP_NAME}`,
      click: () => openMessagesWindow()
    },
    { type: 'separator' },
    {
      label: 'Otwórz listę komunikatów',
      click: () => openMessagesWindow()
    },
    { type: 'separator' },
    {
      label: `Zamknij ${APP_NAME}`,
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

// ─── Okno z komunikatami ──────────────────────────────────────────────────
function openMessagesWindow(startView = 'list') {
  if (messagesWindow && !messagesWindow.isDestroyed()) {
    messagesWindow.webContents.send('navigate', startView);
    messagesWindow.show();
    messagesWindow.focus();
    return;
  }

  const path = require('path');

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const mainIcon = path.join(__dirname, 'assets', 'ikona.ico');

  messagesWindow = new BrowserWindow({
    width:           480,
    height:          640,
    icon:            mainIcon,
    x:               sw - 500,
    y:               sh - 680,
    resizable:       true,
    frame:           false,        // Własna ramka
    transparent:     false,
    alwaysOnTop:     false,
    skipTaskbar:     false,
    show:            false,
    backgroundColor: '#F8F8F8',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  messagesWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  messagesWindow.once('ready-to-show', () => {
    messagesWindow.show();
    // Przekaż startowy widok
    if (startView !== 'list') {
      messagesWindow.webContents.send('navigate', startView);
    }
  });

  messagesWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      messagesWindow.hide();
    }
  });
}

// ─── IPC: Komunikacja renderer ↔ main ────────────────────────────────────
ipcMain.handle('get-messages', async () => {
  try {
    const response = await fetchMessages();
    return { ok: true, data: response };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.on('close-window', () => {
  if (messagesWindow && !messagesWindow.isDestroyed()) {
    messagesWindow.hide();
  }
});

ipcMain.on('open-detail', (event, msgId) => {
  if (messagesWindow && !messagesWindow.isDestroyed()) {
    messagesWindow.webContents.send('show-detail', msgId);
  }
});

// ─── Pobieranie komunikatów ────────────────────────────────────────────────
async function fetchMessages() {
  // Używamy natywnego https/http bez zewnętrznych zależności
  const url = `${API_BASE}/messages/active`;
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? require('https') : require('http');
    lib.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Nieprawidłowa odpowiedź serwera')); }
      });
    }).on('error', (err) => reject(err));
  });
}

// ─── SSE – real-time połączenie z serwerem ────────────────────────────────
let sseRequest      = null;
let sseReconnectTimer = null;

function connectSSE() {
  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }

  const url = `${API_BASE}/events`;
  const lib = url.startsWith('https') ? require('https') : require('http');

  console.log('[sse] łączę z', url);

  sseRequest = lib.get(url, { headers: { Accept: 'text/event-stream' } }, (res) => {
    if (res.statusCode !== 200) {
      console.warn('[sse] serwer zwrócił', res.statusCode, '– ponawiam za 10s');
      res.resume();
      sseReconnectTimer = setTimeout(connectSSE, 10_000);
      return;
    }

    console.log('[sse] połączono – nasłuchuję zdarzeń');
    res.setEncoding('utf8');

    let buffer = '';

    res.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop(); // niepełna linia zostaje w buforze

      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        try {
          const payload = JSON.parse(line.slice(5).trim());
          const type = payload.type || '';
          if (['new_message', 'messages_updated', 'message_created'].includes(type)) {
            console.log('[sse] nowe zdarzenie:', type, '– sprawdzam komunikaty');
            checkAndNotify(true); // force – pomiń okno czasowe
          }
        } catch { /* ignoruj nieparsowalne linie */ }
      }
    });

    res.on('end', () => {
      console.warn('[sse] połączenie zamknięte – ponawiam za 5s');
      sseReconnectTimer = setTimeout(connectSSE, 5_000);
    });

    res.on('error', (err) => {
      console.error('[sse] błąd strumienia:', err.message, '– ponawiam za 10s');
      sseReconnectTimer = setTimeout(connectSSE, 10_000);
    });
  });

  sseRequest.on('error', (err) => {
    console.error('[sse] błąd połączenia:', err.message, '– ponawiam za 10s');
    sseReconnectTimer = setTimeout(connectSSE, 10_000);
  });
}

// ─── Scheduler powiadomień ────────────────────────────────────────────────
function startScheduler() {
  checkAndNotify(); // Sprawdź od razu przy starcie
  schedulerTimer = setInterval(checkAndNotify, CHECK_INTERVAL);

  // Real-time: SSE
  connectSSE();

  // Sprawdź gdy komputer się wybudzi ze snu
  powerMonitor.on('resume', () => {
    console.log('[scheduler] resume – sprawdzam komunikaty');
    checkAndNotify(true);
    if (!sseRequest || sseRequest.destroyed) connectSSE();
  });

  // Sprawdź gdy użytkownik odblokuje ekran
  powerMonitor.on('unlock-screen', () => {
    console.log('[scheduler] unlock-screen – sprawdzam komunikaty');
    checkAndNotify(true);
  });
}

// force=true: SSE/resume/unlock – pomiń okno czasowe, pokaż od razu
async function checkAndNotify(force = false) {
  try {
    const messages = await fetchMessages();

     if (messagesWindow && !messagesWindow.isDestroyed()) {
      messagesWindow.webContents.send('messages-updated');
    }

    if (!messages || messages.length === 0) {
      updateTrayMenu(0);
      return;
    }

    updateTrayMenu(messages.length);

    const now      = new Date();
    const dateKey  = now.toISOString().slice(0, 10);
    const timeNow  = now.getHours() * 60 + now.getMinutes();

    const state = loadState();
    if (!state.shownToday) state.shownToday = {};

    // Wyczyść stary stan (starszy niż 2 dni)
    for (const key of Object.keys(state.shownToday)) {
      if (key < dateKey) delete state.shownToday[key];
    }

    let changed = false;

    for (const msg of messages) {
      if (!msg.show_push) continue;

      // Okno ±5 minut – tylko przy regularnym sprawdzaniu (nie force)
      if (!force) {
        const [hh, mm] = (msg.display_time || '10:00').split(':').map(Number);
        const targetMinute = hh * 60 + mm;
        if (Math.abs(timeNow - targetMinute) > 5) continue;
      }

      // Sprawdź czy już pokazano dziś
      const freqKey = `${dateKey}_${msg.id}`;
      const shownCount = state.shownToday[freqKey] || 0;

      const maxShows = {
        '1x_daily': 1,
        '2x_daily': 2,
        '3x_daily': 3
      }[msg.display_frequency] || 1;

      if (shownCount >= maxShows) continue;

      sendNotification(msg);
      state.shownToday[freqKey] = shownCount + 1;
      changed = true;
    }

    if (changed) saveState(state);

  } catch (err) {
    console.error('Błąd schedulera:', err.message);
  }
}

function sendNotification(msg) {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title:   msg.headline,
    body:    msg.description.slice(0, 120) + (msg.description.length > 120 ? '…' : ''),
    icon:    msg.image_url
      ? path.join(__dirname, 'assets', 'tray-icon.png')
      : path.join(__dirname, 'assets', 'tray-icon.png'),
    silent:  false
  });

  notification.on('click', () => {
    openMessagesWindow('list');
  });

  notification.show();
}