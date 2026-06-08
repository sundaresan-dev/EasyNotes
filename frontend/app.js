const API = '/api/notes';
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

// DOM
const grid = $('#notes-grid'), empty = $('#empty-state'), count = $('#notes-count');
const searchInput = $('#search-input'), searchClear = $('#search-clear');
const modalOverlay = $('#modal-overlay'), modalTitle = $('#modal-title');
const form = $('#note-form'), titleInput = $('#note-title-input'), contentInput = $('#note-content-input');
const deleteOverlay = $('#delete-overlay');
const toast = $('#toast'), toastMsg = $('#toast-message');

let editId = null, deleteId = null, color = '#6C63FF', debounce = null;

// ============ THEME ============
function initTheme() {
  const saved = localStorage.getItem('easynotes-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}
$('#btn-theme').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('easynotes-theme', next);
});
initTheme();

// ============ API ============
async function api(method, path = '', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API + path, opts);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

// ============ RENDER ============
function fmtDate(d) {
  const ms = Date.now() - new Date(d).getTime();
  const m = Math.floor(ms / 60000), h = Math.floor(ms / 3600000), dy = Math.floor(ms / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (dy < 7) return `${dy}d ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

function card(n, i) {
  const el = document.createElement('div');
  el.className = 'note-card';
  el.style.setProperty('--note-color', n.color);
  el.style.animationDelay = `${i * 50}ms`;
  el.innerHTML = `
    <div class="note-card-header">
      <div class="note-card-title">${esc(n.title)}</div>
      <div class="note-card-actions">
        <button class="note-action-btn edit" data-id="${n.id}" title="Edit">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="note-action-btn delete" data-id="${n.id}" title="Delete">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    </div>
    ${n.content ? `<div class="note-card-content">${esc(n.content)}</div>` : ''}
    <div class="note-card-footer">
      <span class="note-card-date">${fmtDate(n.updatedAt || n.createdAt)}</span>
      <span class="note-card-dot" style="background:${n.color};box-shadow:0 0 8px ${n.color}"></span>
    </div>`;
  el.addEventListener('click', (e) => { if (!e.target.closest('.note-action-btn')) openEdit(n); });
  el.querySelector('.edit').addEventListener('click', (e) => { e.stopPropagation(); openEdit(n); });
  el.querySelector('.delete').addEventListener('click', (e) => { e.stopPropagation(); openDel(n.id); });
  return el;
}

async function render() {
  try {
    const q = searchInput.value.trim();
    const url = q ? `?search=${encodeURIComponent(q)}` : '';
    const notes = await api('GET', url);
    grid.innerHTML = '';
    if (notes.length === 0) {
      empty.style.display = 'block'; grid.style.display = 'none';
      count.textContent = q ? `No results for "${q}"` : '';
    } else {
      empty.style.display = 'none'; grid.style.display = 'grid';
      count.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
      notes.forEach((n, i) => grid.appendChild(card(n, i)));
    }
  } catch { showToast('Failed to load notes'); }
}

// ============ MODALS ============
function setColor(c) { color = c; $$('.color-swatch').forEach(s => s.classList.toggle('active', s.dataset.color === c)); }

function openCreate() {
  editId = null; modalTitle.textContent = 'New Note';
  titleInput.value = ''; contentInput.value = ''; setColor('#6C63FF');
  $('#btn-save').textContent = 'Save Note';
  modalOverlay.classList.add('active');
  setTimeout(() => titleInput.focus(), 150);
}

function openEdit(n) {
  editId = n.id; modalTitle.textContent = 'Edit Note';
  titleInput.value = n.title; contentInput.value = n.content || ''; setColor(n.color);
  $('#btn-save').textContent = 'Update Note';
  modalOverlay.classList.add('active');
  setTimeout(() => titleInput.focus(), 150);
}

function closeModal() { modalOverlay.classList.remove('active'); editId = null; }
function openDel(id) { deleteId = id; deleteOverlay.classList.add('active'); }
function closeDel() { deleteOverlay.classList.remove('active'); deleteId = null; }

// ============ TOAST ============
let toastT;
function showToast(msg) {
  toastMsg.textContent = msg; toast.classList.add('visible');
  clearTimeout(toastT); toastT = setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ============ EVENTS ============
$('#btn-add-note').addEventListener('click', openCreate);
$('#btn-cancel').addEventListener('click', closeModal);
$('#modal-close').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });
$('#btn-delete-cancel').addEventListener('click', closeDel);
deleteOverlay.addEventListener('click', (e) => { if (e.target === deleteOverlay) closeDel(); });

$('#btn-delete-confirm').addEventListener('click', async () => {
  if (!deleteId) return;
  try { await api('DELETE', `/${deleteId}`); showToast('Note deleted'); closeDel(); render(); }
  catch { showToast('Failed to delete'); }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = { title: titleInput.value.trim(), content: contentInput.value.trim(), color };
  if (!data.title) return titleInput.focus();
  try {
    if (editId) { await api('PUT', `/${editId}`, data); showToast('Note updated ✓'); }
    else { await api('POST', '', data); showToast('Note created ✓'); }
    closeModal(); render();
  } catch { showToast('Failed to save'); }
});

$('#color-picker').addEventListener('click', (e) => {
  const s = e.target.closest('.color-swatch');
  if (s) setColor(s.dataset.color);
});

searchInput.addEventListener('input', () => {
  searchClear.classList.toggle('visible', searchInput.value.length > 0);
  clearTimeout(debounce); debounce = setTimeout(render, 250);
});
searchClear.addEventListener('click', () => {
  searchInput.value = ''; searchClear.classList.remove('visible');
  searchInput.focus(); render();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (deleteOverlay.classList.contains('active')) closeDel();
    else if (modalOverlay.classList.contains('active')) closeModal();
  }
});

document.addEventListener('DOMContentLoaded', render);
