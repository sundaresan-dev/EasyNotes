const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4567;
const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ============================================
// Storage Adapter
// ============================================

let storage;

async function initStorage() {
  if (DB_TYPE === 'mysql') {
    const MySQLStorage = require('./storage/mysql');
    storage = new MySQLStorage();
  } else {
    const SQLiteStorage = require('./storage/sqlite');
    storage = new SQLiteStorage();
  }
  await storage.init();
  console.log(`💾 Storage: ${DB_TYPE.toUpperCase()}`);
}

// ============================================
// API Routes
// ============================================

// GET all notes (with optional search)
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await storage.getAll(req.query.search || '');
    res.json(notes);
  } catch (err) {
    console.error('GET /api/notes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// GET single note
app.get('/api/notes/:id', async (req, res) => {
  try {
    const note = await storage.getById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('GET /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST create note
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, color } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const note = await storage.create({
      title: title.trim(),
      content: (content || '').trim(),
      color: color || '#6C63FF',
    });
    res.status(201).json(note);
  } catch (err) {
    console.error('POST /api/notes error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// PUT update note
app.put('/api/notes/:id', async (req, res) => {
  try {
    const note = await storage.update(req.params.id, req.body);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('PUT /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// DELETE note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const note = await storage.delete(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (err) {
    console.error('DELETE /api/notes/:id error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', storage: DB_TYPE, uptime: process.uptime() });
});

// Fallback to frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================
// Start Server
// ============================================

initStorage()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✨ EasyNotes running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to initialize storage:', err);
    process.exit(1);
  });

// Graceful shutdown
const shutdown = () => {
  if (storage && storage.close) storage.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
