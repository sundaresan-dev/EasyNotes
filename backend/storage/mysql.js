const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

class MySQLStorage {
  constructor() {
    this.config = {
      host: process.env.MYSQL_HOST || 'mysql',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'notes_user',
      password: process.env.MYSQL_PASSWORD || 'notes_pass',
      database: process.env.MYSQL_DATABASE || 'notes_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  async init() {
    // Retry connection (MySQL may take time to start)
    let retries = 20;
    while (retries > 0) {
      try {
        this.pool = mysql.createPool(this.config);
        await this.pool.query('SELECT 1');
        break;
      } catch (err) {
        retries--;
        if (retries === 0) throw err;
        console.log(`⏳ Waiting for MySQL... (${retries} retries left)`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }

    // Create table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT DEFAULT '',
        color VARCHAR(10) DEFAULT '#6C63FF',
        createdAt DATETIME(3) NOT NULL,
        updatedAt DATETIME(3) NOT NULL,
        INDEX idx_updated (updatedAt DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Seed if empty
    const [[{ count }]] = await this.pool.query('SELECT COUNT(*) as count FROM notes');
    if (count === 0) await this._seed();

    console.log(`📂 MySQL: ${this.config.host}:${this.config.port}/${this.config.database}`);
  }

  async _seed() {
    const now = new Date().toISOString().slice(0, 23).replace('T', ' ');
    const notes = [
      [uuidv4(), 'Welcome to Notes ✨',
        'Create, edit, delete and search your notes. Try the dark/light theme toggle!',
        '#6C63FF', now, now],
      [uuidv4(), 'Quick Tips 🎯',
        'Click any note to edit it.\nUse the search bar to find notes instantly.\nColor-code notes for easy organization.',
        '#FF6584', now, now],
      [uuidv4(), 'Stay Organized 📋',
        'Use descriptive titles and keep notes focused. Your data persists across restarts!',
        '#43E97B', now, now],
    ];
    for (const n of notes) {
      await this.pool.query(
        'INSERT INTO notes (id, title, content, color, createdAt, updatedAt) VALUES (?,?,?,?,?,?)', n
      );
    }
    console.log('📦 Database seeded with sample notes');
  }

  async getAll(search = '') {
    if (search) {
      const q = `%${search}%`;
      const [rows] = await this.pool.query(
        'SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? ORDER BY updatedAt DESC', [q, q]
      );
      return rows;
    }
    const [rows] = await this.pool.query('SELECT * FROM notes ORDER BY updatedAt DESC');
    return rows;
  }

  async getById(id) {
    const [rows] = await this.pool.query('SELECT * FROM notes WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async create({ title, content, color }) {
    const note = {
      id: uuidv4(), title, content, color,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ca = note.createdAt.slice(0, 23).replace('T', ' ');
    const ua = note.updatedAt.slice(0, 23).replace('T', ' ');
    await this.pool.query(
      'INSERT INTO notes (id, title, content, color, createdAt, updatedAt) VALUES (?,?,?,?,?,?)',
      [note.id, note.title, note.content, note.color, ca, ua]
    );
    return note;
  }

  async update(id, data) {
    const existing = await this.getById(id);
    if (!existing) return null;
    const title = data.title !== undefined ? data.title.trim() : existing.title;
    const content = data.content !== undefined ? data.content.trim() : existing.content;
    const color = data.color !== undefined ? data.color : existing.color;
    const updatedAt = new Date().toISOString();
    const ua = updatedAt.slice(0, 23).replace('T', ' ');
    await this.pool.query(
      'UPDATE notes SET title=?, content=?, color=?, updatedAt=? WHERE id=?',
      [title, content, color, ua, id]
    );
    return { ...existing, title, content, color, updatedAt };
  }

  async delete(id) {
    const existing = await this.getById(id);
    if (!existing) return null;
    await this.pool.query('DELETE FROM notes WHERE id = ?', [id]);
    return existing;
  }

  async close() {
    if (this.pool) await this.pool.end();
  }
}

module.exports = MySQLStorage;
