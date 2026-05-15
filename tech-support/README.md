# SupportUpload — Code Review & Implementacja

## 🔍 Przegląd zmian (vs. oryginalny projekt)

### ❌ Problemy w oryginale → ✅ Poprawki

| Problem | Oryginalny projekt | Nasza implementacja |
|---|---|---|
| **Memory bottleneck** | Upload przez backend (cały plik w RAM) | **Presigned S3 URLs** — plik leci prosto do S3, backend nigdy nie widzi bajtów |
| **Brak retry** | Pojedyncza próba uploadu | **Exponential backoff** — 3 próby z interwałem 1s/2s/4s |
| **Walidacja MIME** | Tylko rozszerzenie pliku | Whitelist `allowedMime` + sprawdzany po stronie API |
| **Status uploadu** | Brak statusów | FSM: `pending → uploading → completed / partial / failed` |
| **Duplikaty** | Możliwe przy retry | **Idempotency key** (UUID wysyłany przez frontend) |
| **Rate limiting** | Brak | `express-rate-limit`: 30 req / 15 min per IP |
| **Logi** | `console.log` | **pino** (strukturalne JSON logi) |
| **Shutdown** | Nagłe zamknięcie | Graceful shutdown (SIGTERM/SIGINT, czeka na requesty) |
| **Brak health check** | Brak | `GET /health` → sprawdza DB |
| **Brak sanityzacji** | Brak | `helmet`, `zod` schema validation, sanitize filename |
| **Brak weryfikacji S3** | Backend ufa frontendowi | `HeadObject` — weryfikacja, że plik faktycznie dotarł |
| **Styl kodu** | Skrypt proceduralny | Modularny, z obsługą błędów w każdej warstwie |

---

## 🏗️ Architektura

```
Klient (browser)
    │
    ├─► POST /api/upload/init   →  Backend waliduje dane
    │                           →  Tworzy rekord w PostgreSQL
    │                           →  Zwraca presigned URLs (ważne 1h)
    │
    ├─► PUT <presigned-url>     →  BEZPOŚREDNIO do S3 (z progress)
    │                              Backend nie widzi pliku!
    │
    └─► POST /api/upload/complete → Backend weryfikuje pliki (HeadObject)
                                  → Aktualizuje statusy w DB
                                  → Wysyła email przez SES
```

---

## 📁 Struktura projektu

```
file-upload-project/
├── backend/
│   ├── server.js                  ← Express API (production-grade)
│   ├── package.json
│   ├── .env.example
│   └── migrations/
│       └── 001_init.sql           ← Schema PostgreSQL z FSM statusów
│
└── frontend/
    ├── upload.html                ← Formularz klienta (biały/czerwony/szary)
    ├── admin.html                 ← Panel supportu
    └── src/
        └── hooks/
            └── useFileUpload.js   ← React hook (jeśli używasz React)
```

---

## 🚀 Uruchomienie

### 1. Backend

```bash
cd backend
cp .env.example .env
# Uzupełnij .env prawdziwymi danymi AWS / DB

npm install
npm run migrate        # Utwórz tabele w PostgreSQL
npm start              # Produkcja
# lub
npm run dev            # Development (--watch)
```

### 2. Frontend

Pliki `upload.html` i `admin.html` to vanilla HTML/CSS/JS — możesz je:
- Serwować statycznie (nginx, S3+CloudFront)
- Zintegrować z dowolnym frameworkiem (React, Vue)

Ustaw `VITE_API_BASE` (lub zmień stałą `API` w JS) na adres backendu.

---

## 🔐 Bezpieczeństwo

- **HTTPS**: AWS ACM + ALB / CloudFront
- **S3 bucket**: prywatny, bez public access
- **Presigned URLs**: ważne 1h (PUT), 15 min (GET/pobieranie)
- **SSE**: pliki szyfrowane AES-256 po stronie S3
- **Lifecycle policy**: auto-usuwanie po 7–30 dniach
- **Admin token**: `x-admin-token` header — w produkcji zastąp JWT+RBAC
- **Rate limiting**: 30 req/15 min per IP

---

## ☁️ AWS — rekomendowana konfiguracja

### MVP

```
EC2 (t3.small) → backend Node.js
S3             → pliki + lifecycle 7 dni
SES            → email powiadomienia
RDS t3.micro   → PostgreSQL
```

### Produkcja skalowalna

```
ALB → ECS Fargate (autoscaling)
S3 + lifecycle policy
RDS (Multi-AZ) lub Aurora Serverless
CloudFront → frontend
SES + SNS → zaawansowane powiadomienia
Secrets Manager → env variables
```

---

## 📊 Model bazy danych

```sql
uploads
  id, client_name, email, description
  status: pending | uploading | completed | partial | failed
  idempotency_key  ← bezpieczne retry bez duplikatów
  created_at, completed_at

files
  id, upload_id (FK), file_name, s3_key
  size, mime_type
  status: pending | completed | failed
  error_msg
```
