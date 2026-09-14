// Single shared connection to the ported finance dataset (data/finance.db).
// Used by both the finance routes and the WhatsApp ingest (nagd group).
import { DatabaseSync } from 'node:sqlite';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIN_DB = resolve(__dirname, '..', '..', 'data', 'finance.db');

let fdb = null;
export function financeDb() {
  if (!fdb) {
    if (!existsSync(FIN_DB)) throw new Error('finance_db_missing');
    fdb = new DatabaseSync(FIN_DB);
    // Cash expenses captured from the !nagd-group WhatsApp channel (+ manual).
    fdb.exec(`CREATE TABLE IF NOT EXISTS nagd_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      category TEXT,
      source TEXT,
      image_path TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`);
  }
  return fdb;
}

export function addNagdExpense({ date, amount, description, source, category, image_path } = {}) {
  const d = financeDb();
  const info = d.prepare(
    `INSERT INTO nagd_expenses (date, amount, description, source, category, image_path)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(date || null, Number(amount) || 0, description || null, source || null, category || null, image_path || null);
  return Number(info.lastInsertRowid);
}

export function nagdTotal() {
  return Math.round((financeDb().prepare('SELECT COALESCE(SUM(amount),0) AS s FROM nagd_expenses').get().s || 0) * 100) / 100;
}

// Undo the most recent cash entry (e.g. a test) → returns the deleted row or null.
export function deleteLastNagd() {
  const d = financeDb();
  const last = d.prepare('SELECT * FROM nagd_expenses ORDER BY id DESC LIMIT 1').get();
  if (!last) return null;
  d.prepare('DELETE FROM nagd_expenses WHERE id = ?').run(last.id);
  return last;
}

// Attach a reason (description) to the most recent cash entry → returns that row or null.
// Used when a bare amount is followed by a separate text message in the group.
export function setLastNagdReason(text) {
  const d = financeDb();
  const last = d.prepare('SELECT * FROM nagd_expenses ORDER BY id DESC LIMIT 1').get();
  if (!last) return null;
  // Only attach a reason when the last entry has NO reason yet AND was created
  // in the last 15 seconds (the one immediate next message). Otherwise stay
  // silent — random group chat must not flood.
  const hasReason = last.description && last.description !== 'Çek şəkli';
  let ageMs = Infinity;
  try { ageMs = Date.now() - new Date(String(last.created_at).replace(' ', 'T') + 'Z').getTime(); } catch { /* */ }
  if (hasReason || !(ageMs < 15000)) return null;
  d.prepare('UPDATE nagd_expenses SET description = ? WHERE id = ?').run(text, last.id);
  return { ...last, description: text };
}

// Delete a specific cash entry by id (ids reflect send order; smallest = first sent).
export function deleteNagdById(id) {
  const d = financeDb();
  const row = d.prepare('SELECT * FROM nagd_expenses WHERE id = ?').get(Number(id));
  if (!row) return null;
  d.prepare('DELETE FROM nagd_expenses WHERE id = ?').run(Number(id));
  return row;
}

// Reset all cash expenses and the id sequence (next id = 1) → returns number removed.
export function clearNagd() {
  const d = financeDb();
  const n = d.prepare('SELECT COUNT(*) AS n FROM nagd_expenses').get().n;
  d.prepare('DELETE FROM nagd_expenses').run();
  try { d.prepare("DELETE FROM sqlite_sequence WHERE name = 'nagd_expenses'").run(); } catch { /* no autoinc row yet */ }
  return n;
}
