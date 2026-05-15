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

const supportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');

    const safeName = file.originalname.replace(
      /[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ._ -]/g,
      '_'
    );

    const ext = path.extname(safeName);
    const baseName = path.basename(safeName, ext);

    let finalName = safeName;
    let counter = 1;

    while (fs.existsSync(path.join(uploadDir, finalName))) {
      finalName = `${baseName} (${counter})${ext}`;
      counter++;
    }

    cb(null, finalName);
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

const supportUpload = multer({
  storage: supportStorage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
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

    const {
      headline,
      description,
      display_duration_days,
      display_frequency,
      display_time,
      show_push,
      is_active
    } = req.body;

    let image_url = existing.image_url;

    const removeImage = req.body.remove_image === 'true';

    if (removeImage) {
      if (existing.image_url) {
        const oldPath = path.join(__dirname, existing.image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      image_url = null;
    }

    if (req.file) {
      if (existing.image_url) {
        const oldPath = path.join(__dirname, existing.image_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      image_url = `/uploads/${req.file.filename}`;
    }

    const updated = db.updateMessage(id, {
      headline,
      description,
      image_url,
      display_duration_days: display_duration_days
        ? Number(display_duration_days)
        : undefined,
      display_frequency,
      display_time,
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

// ─── Keys API ─────────────────────────────────────────────────────────────
function generateKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 8; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

app.post('/api/keys/generate', requireAuth, (req, res) => {
  try {
    const { count } = req.body;
    
    const inserted = [];

    const stmt = db.getDb().prepare(`
      INSERT INTO keys (status, secret_key)
      VALUES (?, ?)
    `);

    while (inserted.length < Number(count)) {
      const key = generateKey();

      try {
        const result = stmt.run('Wygenerowany', key);

        inserted.push({
          id: result.lastInsertRowid,
          secret_key: key,
          status: 'Wygenerowany'
        });

      } catch (err) {
        if (err.code !== 'SQLITE_CONSTRAINT') {
          throw err;
        }
      }
    }

    res.status(201).json({
      inserted,
      count: inserted.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating keys' });
  }
});

app.post('/api/keys', requireAuth, (req, res) => {
  const { page, limit } = req.body;
  try {
    const keys = db.getDb().prepare(`
    SELECT 
      id, 
      status, 
      secret_key,
      created_at,
      ROW_NUMBER() OVER (ORDER BY status ASC, id DESC) AS row_num
    FROM keys
    ORDER BY status ASC, id DESC
    LIMIT ? OFFSET ?;
  `).all(limit, (page - 1) * limit);
    res.json(keys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching keys' });
  }
});


app.patch("/api/keys/:id", requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Brak statusu" });
    }

    const stmt = db.getDb().prepare(`
      UPDATE keys
      SET status = ?
      WHERE id = ?
    `);

    const result = stmt.run(status, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Key not found" });
    }

    res.json({
      message: "Updated successfully",
      id,
      status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Keys tabs API ────────────────────────────────────────────────────────
app.post('/api/keys/tabs', requireAuth, (req, res) => {
  try {
    const {currentTab, keysPerTab} = req.body;
    const keysAmount = db.getDb().prepare(`
      SELECT 
        COUNT(*) AS count
      FROM keys
    `).get().count;
    const maxForTab = Math.min(currentTab * keysPerTab, keysAmount);
    const tabStart = keysPerTab * (currentTab - 1) + 1;
    const numberOfTabs = Math.ceil(keysAmount / keysPerTab);

    res.json({
      keysAmount,
      maxForTab,
      tabStart,
      numberOfTabs
    });
  }catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching keys' });
  }
});


// ─── Keys overflow API ────────────────────────────────────────────────────
app.get('/api/keys/overflow', requireAuth, (req, res) => {
  try {
    const keys = db.getDb().prepare(`
    SELECT COUNT(*) AS count
    FROM keys
  `).get();
    res.json(keys);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching keys' });
  }
});

app.delete('/api/keys/overflow', requireAuth, (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);

    if (!limit || limit <= 0) {
      return res.status(400).json({ error: 'Invalid limit' });
    }

    const result = db.getDb().prepare(`
      DELETE FROM keys
      WHERE id IN (
        SELECT id FROM keys
        ORDER BY id ASC
        LIMIT ?
      )
    `).run(limit);

    res.json({ deleted: result.changes });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting keys' });
  }
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

// ─── Start ────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\nInfo Tachospeed Backend uruchomiony`);
  console.log(`   API:          http://localhost:${PORT}/api`);
//   console.log(`   Panel Admin:  http://localhost:${PORT}/`);
  console.log(`   Dozwolona domena: ${ALLOWED_DOMAIN}`);
  console.log(`   Produkt:      Info Tachospeed\n`);
});

// ─── Support Center ───────────────────────────────────────────────────────
app.post(
  '/api/support/upload',
  supportUpload.array('files'),
  (req, res) => {
    try {
      const { name, email, description } = req.body;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          error: 'No files uploaded'
        });
      }

      const nextId = db.getDb().prepare(`
        SELECT COALESCE(MAX(report_id), 0) + 1 AS id
        FROM supportFiles
      `).get().id;

      const stmt = db.getDb().prepare(`
        INSERT INTO supportFiles
        (report_id, created_by, created_by_email, description, file_path)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const file of files) {
        stmt.run(
          nextId,
          name,
          email,
          req.body.description,
          `/uploads/${file.filename}`
        );
      }

      res.status(201).json({
        success: true,
        uploaded: files.length
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: 'Error sending files'
      });
    }
});

app.get('/api/support/uploads', requireAuth, (req, res) => {
  try {
    const files = db.getDb().prepare(`
    SELECT 
      id, 
      report_id,
      created_by, 
      created_by_email,
      description,
      file_path,
      status,
      created_at
    FROM supportFiles;
  `).all();
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching files' });
  }
});

app.get('/download/:filename', (req, res) => {
    const file = path.join(__dirname, 'uploads', req.params.filename);
    res.download(file);
});

app.patch('/api/support/reports/:reportId/read', (req, res) => {
    const reportId = req.params.reportId;

    const stmt = db.getDb().prepare(`
        UPDATE supportFiles
        SET status = 'Odczytane'
        WHERE report_id = ?
    `);

    stmt.run(reportId);

    res.sendStatus(200);
});

app.get('/api/support/uploadCount', requireAuth, (req, res) => {
  try {
    const files = db.getDb().prepare(`
    SELECT 
      count(DISTINCT report_id) AS total,
      count(DISTINCT CASE WHEN status = 'Odczytane' THEN report_id END) AS read,
      count(DISTINCT CASE WHEN status != 'Odczytane' THEN report_id END) AS new
    FROM supportFiles;
  `).get();
    res.json(files);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching files' });
  }
});

app.delete('/api/support/reports/:id', requireAuth, (req, res) => {
  try {
    const reportId = req.params.id;

    const database = db.getDb();

    const files = database.prepare(`
      SELECT file_path FROM supportFiles WHERE report_id = ?
    `).all(reportId);

    database.prepare(`
      DELETE FROM supportFiles WHERE report_id = ?
    `).run(reportId);

    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(__dirname, '..', 'uploads');

    for (const f of files) {
        if (!f.file_path) continue;

        const fullPath = path.join(__dirname, f.file_path);

        try {
            fs.unlinkSync(fullPath);
        } catch (e) {
            console.warn("File not found:", fullPath);
        }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});
