const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

class SQLiteStorage {
  constructor() {
    const dbDir = process.env.DB_DIR || path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
    this.dbPath = path.join(dbDir, 'notes.db');
  }

  async init() {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        color TEXT DEFAULT '#6C63FF',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Seed if empty
    const { count } = this.db.prepare('SELECT COUNT(*) as count FROM notes').get();
    if (count === 0) this._seed();

    console.log(`📂 SQLite DB: ${this.dbPath}`);
  }

  _seed() {
    const insert = this.db.prepare(
      'INSERT INTO notes (id, title, content, color, createdAt, updatedAt) VALUES (?,?,?,?,?,?)'
    );
    const now = new Date().toISOString();
    const tx = this.db.transaction(() => {
      insert.run(uuidv4(), 'Welcome to Notes ✨',
        'Create, edit, delete and search your notes. Try the dark/light theme toggle!',
        '#6C63FF', now, now);
      insert.run(uuidv4(), 'Quick Tips 🎯',
        'Click any note to edit it.\nUse the search bar to find notes instantly.\nColor-code notes for easy organization.',
        '#FF6584', now, now);
      insert.run(uuidv4(), 'Stay Organized 📋',
        'Use descriptive titles and keep notes focused. Your data persists across restarts!',
        '#43E97B', now, now);
    });
    tx();
    console.log('📦 Database seeded with sample notes');
  }

  async getAll(search = '') {
    if (search) {
      const q = `%${search}%`;
      return this.db.prepare(
        'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updatedAt DESC'
      ).all(q, q);
    }
    return this.db.prepare('SELECT * FROM notes ORDER BY updatedAt DESC').all();
  }

  async getById(id) {
    return this.db.prepare('SELECT * FROM notes WHERE id = ?').get(id) || null;
  }

  async create({ title, content, color }) {
    const note = {
      id: uuidv4(), title, content, color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.db.prepare(
      'INSERT INTO notes (id, title, content, color, createdAt, updatedAt) VALUES (?,?,?,?,?,?)'
    ).run(note.id, note.title, note.content, note.color, note.createdAt, note.updatedAt);
    return note;
  }

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) return null;
    const title = data.title !== undefined ? data.title.trim() : existing.title;
    const content = data.content !== undefined ? data.content.trim() : existing.content;
    const color = data.color !== undefined ? data.color : existing.color;
    const updatedAt = new Date().toISOString();
    this.db.prepare(
      'UPDATE notes SET title=?, content=?, color=?, updatedAt=? WHERE id=?'
    ).run(title, content, color, updatedAt, id);
    return { ...existing, title, content, color, updatedAt };
  }

  async delete(id) {
    const existing = await this.getById(id);
    if (!existing) return null;
    this.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
    return existing;
  }

  close() {
    if (this.db) this.db.close();
  }
}

module.exports = SQLiteStorage;
