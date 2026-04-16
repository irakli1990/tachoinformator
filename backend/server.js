const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── SSE – podłączeni klienci ──────────────────────────────────────────────
const sseClients = new Set();

function notifyClients(type) {
  for (const res of sseClients) {
    res.write(`data: ${JSON.stringify({ type })}\n\n`);
  }
}

// ─── Multer – upload grafik ────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Niedozwolony format pliku. Akceptowane: JPG, PNG, WebP, GIF'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serwowanie grafik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Panel administracyjny (SPA)
app.use(express.static(path.join(__dirname, 'public')));

// ─── Autentykacja ──────────────────────────────────────────────────────────
// Uwaga: W środowisku produkcyjnym należy użyć SSO/OAuth.
// Tu logowanie odbywa się wyłącznie przez e-mail (narzędzie wewnętrzne).

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || '@infolab.pl';

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Podaj adres e-mail.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.endsWith(ALLOWED_DOMAIN)) {
    return res.status(403).json({ error: `Dostęp tylko dla adresów ${ALLOWED_DOMAIN}` });
  }

  let user = db.findAdminByEmail(normalizedEmail);

  if (!user) {
    // Auto-rejestracja pierwszego logowania z firmową domeną
    db.addAdmin(normalizedEmail, normalizedEmail.split('@')[0], 'BOK');
    user = db.findAdminByEmail(normalizedEmail);
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      department: user.department
    }
  });
});

// ─── Komunikaty – API klienckie (publiczne, bez auth) ──────────────────────
app.get('/api/messages/active', (req, res) => {
  try {
    const messages = db.getActiveMessages();
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

// ─── Middleware auth – prosty token sesji ─────────────────────────────────
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Brak autoryzacji' });

  const email = Buffer.from(authHeader.replace('Bearer ', ''), 'base64').toString('utf8');
  const user = db.findAdminByEmail(email);
  if (!user) return res.status(401).json({ error: 'Nieautoryzowany użytkownik' });

  req.user = user;
  next();
}

// ─── Komunikaty – API administracyjne ─────────────────────────────────────
app.get('/api/messages', requireAuth, (req, res) => {
  try {
    const { filter } = req.query;
    let messages;
    if (filter === 'active') {
      messages = db.getActiveMessages();
    } else if (filter === 'archived') {
      messages = db.getArchivedMessages();
    } else {
      messages = db.getAllMessages();
    }
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.get('/api/messages/:id', requireAuth, (req, res) => {
  try {
    const msg = db.getMessageById(Number(req.params.id));
    if (!msg) return res.status(404).json({ error: 'Nie znaleziono komunikatu' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.post('/api/messages', requireAuth, upload.single('image'), (req, res) => {
  try {
    const { headline, description, display_duration_days, display_frequency,
            display_time, show_push, is_active } = req.body;

    if (!headline || !description) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Hasło główne i opis są wymagane.' });
    }

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    const message = db.createMessage({
      headline: headline.trim(),
      description: description.trim(),
      image_url,
      display_duration_days: Number(display_duration_days) || 7,
      display_frequency: display_frequency || '1x_daily',
      display_time: display_time || '10:00',
      show_push: show_push !== 'false',
      is_active: is_active !== 'false',
      created_by: req.user.email
    });

    notifyClients('messages_updated');
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd podczas tworzenia komunikatu' });
  }
});

app.put('/api/messages/:id', requireAuth, upload.single('image'), (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = db.getMessageById(id);
    if (!existing) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Nie znaleziono komunikatu' });
    }

    let image_url = existing.image_url;
    if (req.file) {
      // Usuń starą grafikę jeśli istnieje
      if (existing.image_url) {
        const oldPath = path.join(__dirname, existing.image_url);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      image_url = `/uploads/${req.file.filename}`;
    }

    const { headline, description, display_duration_days, display_frequency,
            display_time, show_push, is_active } = req.body;

    const updated = db.updateMessage(id, {
      headline, description, image_url,
      display_duration_days: display_duration_days ? Number(display_duration_days) : undefined,
      display_frequency, display_time,
      show_push: show_push !== undefined ? show_push !== 'false' : undefined,
      is_active: is_active !== undefined ? is_active !== 'false' : undefined
    });

    notifyClients('messages_updated');
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Błąd podczas edycji komunikatu' });
  }
});

app.patch('/api/messages/:id/toggle', requireAuth, (req, res) => {
  try {
    const msg = db.toggleMessage(Number(req.params.id));
    if (!msg) return res.status(404).json({ error: 'Nie znaleziono komunikatu' });
    notifyClients('messages_updated');
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Błąd serwera' });
  }
});

app.delete('/api/messages/:id', requireAuth, (req, res) => {
  try {
    const id = Number(req.params.id);
    const msg = db.getMessageById(id);
    if (!msg) return res.status(404).json({ error: 'Nie znaleziono komunikatu' });

    // Usuń plik grafiki jeśli istnieje
    if (msg.image_url) {
      const filePath = path.join(__dirname, msg.image_url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    db.deleteMessage(id);
    notifyClients('messages_updated');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Błąd podczas usuwania komunikatu' });
  }
});

// ─── Upload grafiki (standalone endpoint) ─────────────────────────────────
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Brak pliku' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// ─── SSE – endpoint dla klientów Electron ─────────────────────────────────
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Ping co 30s żeby połączenie nie wygasło
  const ping = setInterval(() => res.write(': ping\n\n'), 30_000);

  sseClients.add(res);
  console.log(`[sse] klient podłączony (łącznie: ${sseClients.size})`);

  req.on('close', () => {
    clearInterval(ping);
    sseClients.delete(res);
    console.log(`[sse] klient rozłączony (łącznie: ${sseClients.size})`);
  });
});

// ─── Catch-all: SPA ───────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint nie istnieje' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Info Tachospeed Backend uruchomiony`);
  console.log(`   API:          http://localhost:${PORT}/api`);
  console.log(`   Panel Admin:  http://localhost:${PORT}/`);
  console.log(`   Dozwolona domena: ${ALLOWED_DOMAIN}`);
  console.log(`   Produkt:      Info Tachospeed\n`);
});
