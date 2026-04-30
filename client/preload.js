const { contextBridge, ipcRenderer } = require('electron');

// Bezpieczne API dostępne w renderer process przez window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // Pobierz aktywne komunikaty z backendu
  getMessages: () => ipcRenderer.invoke('get-messages'),

  // Zamknij okno (schowaj do tray)
  closeWindow: () => ipcRenderer.send('close-window'),

  // Nasłuchuj nawigacji z main process (np. po kliknięciu w notification)
  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, view) => callback(view));
  },

  // Odbierz polecenie pokazania szczegółu
  onShowDetail: (callback) => {
    ipcRenderer.on('show-detail', (event, msgId) => callback(msgId));
  },

  onMessagesUpdated: (callback) => ipcRenderer.on('messages-updated', callback),

  // URL bazowy API (dla obrazków)
  apiBase: 'http://localhost:3000'
});
