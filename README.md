# Info Tachospeed

> Narzędzie do komunikacji marketingowej z klientami — instalowane wraz z produktem, działające w zasobniku systemowym Windows.
> Domena: **@infolab.pl** | Sieć: **wewnętrzna LAN**

## Architektura

```
client-pulse/
├── backend/          # Serwer API + Panel Administracyjny (Node.js + Express + SQLite)
└── client/           # Aplikacja kliencka (Electron — system tray)
```

## Szybki start

### 1. Backend (API + Panel Admin)

```bash
cd backend
npm install
npm start
```

Panel administracyjny dostępny pod: **http://localhost:3000**

**Konta testowe (zaloguj się przez przeglądarkę):**
- `admin@infolab.pl`
- `bok@infolab.pl`
- `marketing@infolab.pl`

> Każdy adres z domeną `@infolab.pl` jest automatycznie akceptowany.  
> Hasło nie jest wymagane — narzędzie wewnętrzne dostępne tylko w sieci firmowej.

### 2. Aplikacja kliencka Electron

```bash
cd client
npm install
npm start
```

Ikona **Info Tachospeed** pojawi się w zasobniku systemowym (system tray).  
✅ **Auto-start z Windows** jest włączony domyślnie.

### Budowanie instalatora Windows

```bash
cd client
npm run build:installer
# → dist/Info Tachospeed-Setup-1.0.0.exe (NSIS)
```

Silent install (dołączenie do instalatora produktu głównego):
```
"Info Tachospeed-Setup-1.0.0.exe" /S
```

---

## Konfiguracja produkcyjna

### Zmiana adresu serwera API (wdrożenie na serwerze LAN)

W `client/main.js`:
```js
const API_BASE = 'http://192.168.1.100:3000/api';  // adres serwera w sieci
```

W `client/renderer/app.js`:
```js
const API = 'http://192.168.1.100:3000';
```

### Wyłączenie auto-start

W `client/main.js` ustaw:
```js
const AUTO_START = false;
```

---

## Zmienne środowiskowe (backend)

| Zmienna            | Domyślna wartość | Opis                                      |
|--------------------|------------------|-------------------------------------------|
| `PORT`             | `3000`           | Port serwera backend                      |
| `ALLOWED_DOMAIN`   | `@infolab.pl`    | Dozwolona domena e-mail dla pracowników   |

---

## Stack technologiczny

| Komponent              | Technologia                  |
|------------------------|------------------------------|
| Backend API            | Node.js, Express             |
| Baza danych            | SQLite (better-sqlite3)      |
| Upload plików          | Multer                       |
| Panel administracyjny  | HTML/CSS/JS (SPA)            |
| Aplikacja kliencka     | Electron                     |
| Instalator             | electron-builder (NSIS)      |
