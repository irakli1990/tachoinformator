const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'clientpulse.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL DEFAULT 'BOK',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      headline TEXT NOT NULL,
      description TEXT NOT NULL,
      image_url TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      display_duration_days INTEGER NOT NULL DEFAULT 7,
      display_frequency TEXT NOT NULL DEFAULT '1x_daily',
      display_time TEXT NOT NULL DEFAULT '10:00',
      show_push INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_by TEXT NOT NULL
    );
  `);

  // Seed: Predefiniowane domeny / użytkownicy firmowi
  const seedUsers = [
    { email: 'bok@infolab.pl', name: 'Biuro Obsługi Klienta', department: 'BOK' },
    { email: 'marketing@infolab.pl', name: 'Dział Marketingu', department: 'Marketing' },
    { email: 'admin@infolab.pl', name: 'Administrator', department: 'Admin' }
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO admin_users (email, name, department)
    VALUES (@email, @name, @department)
  `);

  for (const user of seedUsers) {
    insertUser.run(user);
  }
}

// ─── Admin Users ─────────────────────────────────────────────────────────────

function findAdminByEmail(email) {
  const d = getDb();
  return d.prepare('SELECT * FROM admin_users WHERE email = ?').get(email);
}

function getAllAdmins() {
  const d = getDb();
  return d.prepare('SELECT * FROM admin_users ORDER BY department, name').all();
}

function addAdmin(email, name, department) {
  const d = getDb();
  return d.prepare('INSERT INTO admin_users (email, name, department) VALUES (?, ?, ?)').run(email, name, department);
}

// ─── Messages ─────────────────────────────────────────────────────────────────

function getAllMessages() {
  const d = getDb();
  return d.prepare(`
    SELECT * FROM messages ORDER BY created_at DESC
  `).all();
}

function getActiveMessages() {
  const d = getDb();
  const now = new Date().toISOString();
  return d.prepare(`
    SELECT * FROM messages
    WHERE is_active = 1
      AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY created_at DESC
  `).all(now);
}

function getArchivedMessages() {
  const d = getDb();
  const now = new Date().toISOString();
  return d.prepare(`
    SELECT * FROM messages
    WHERE is_active = 0
       OR (expires_at IS NOT NULL AND expires_at <= ?)
    ORDER BY created_at DESC
  `).all(now);
}

function getMessageById(id) {
  const d = getDb();
  return d.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

function createMessage(data) {
  const d = getDb();
  const expiresAt = data.display_duration_days
    ? new Date(Date.now() + data.display_duration_days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const stmt = d.prepare(`
    INSERT INTO messages
      (headline, description, image_url, is_active, display_duration_days,
       display_frequency, display_time, show_push, expires_at, created_by)
    VALUES
      (@headline, @description, @image_url, @is_active, @display_duration_days,
       @display_frequency, @display_time, @show_push, @expires_at, @created_by)
  `);

  const result = stmt.run({
    headline: data.headline,
    description: data.description,
    image_url: data.image_url || null,
    is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    display_duration_days: data.display_duration_days || 7,
    display_frequency: data.display_frequency || '1x_daily',
    display_time: data.display_time || '10:00',
    show_push: data.show_push !== undefined ? (data.show_push ? 1 : 0) : 1,
    expires_at: expiresAt,
    created_by: data.created_by
  });

  return getMessageById(result.lastInsertRowid);
}

function updateMessage(id, data) {
  const d = getDb();
  const existing = getMessageById(id);
  if (!existing) return null;

  const durationDays = data.display_duration_days !== undefined
    ? data.display_duration_days
    : existing.display_duration_days;

  const expiresAt = durationDays
    ? new Date(new Date(existing.created_at).getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  d.prepare(`
    UPDATE messages SET
      headline = @headline,
      description = @description,
      image_url = @image_url,
      is_active = @is_active,
      display_duration_days = @display_duration_days,
      display_frequency = @display_frequency,
      display_time = @display_time,
      show_push = @show_push,
      expires_at = @expires_at
    WHERE id = @id
  `).run({
    id,
    headline: data.headline !== undefined ? data.headline : existing.headline,
    description: data.description !== undefined ? data.description : existing.description,
    image_url: data.image_url !== undefined ? data.image_url : existing.image_url,
    is_active: data.is_active !== undefined ? (data.is_active ? 1 : 0) : existing.is_active,
    display_duration_days: durationDays,
    display_frequency: data.display_frequency || existing.display_frequency,
    display_time: data.display_time || existing.display_time,
    show_push: data.show_push !== undefined ? (data.show_push ? 1 : 0) : existing.show_push,
    expires_at: expiresAt
  });

  return getMessageById(id);
}

function toggleMessage(id) {
  const d = getDb();
  const msg = getMessageById(id);
  if (!msg) return null;
  const newStatus = msg.is_active ? 0 : 1;
  d.prepare('UPDATE messages SET is_active = ? WHERE id = ?').run(newStatus, id);
  return getMessageById(id);
}

function deleteMessage(id) {
  const d = getDb();
  const msg = getMessageById(id);
  if (!msg) return false;
  d.prepare('DELETE FROM messages WHERE id = ?').run(id);
  return true;
}

module.exports = {
  getDb,
  findAdminByEmail,
  getAllAdmins,
  addAdmin,
  getAllMessages,
  getActiveMessages,
  getArchivedMessages,
  getMessageById,
  createMessage,
  updateMessage,
  toggleMessage,
  deleteMessage
};
