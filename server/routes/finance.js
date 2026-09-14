// Appina Finance Management — gated finance section.
// Reads the ported finance dataset (data/finance.db) and serves the CAPEX
// dashboard with the corrected formulas requested by the owner:
//   • top-5 debtors  → by "Qalıq borc" = total - advance - remaining_1 - remaining_2
//   • Ümumi CAPEX    → SUM(total_amount) over all projects
//   • Qalıq Məbləğ   → SUM(Qalıq borc) over rows with status 'davam edir'
import express, { Router } from 'express';
import ExcelJS from 'exceljs';
import { authenticate } from '../middleware/auth.js';
import { isFullAccess } from '../middleware/rbac.js';
import * as whatsapp from '../lib/whatsapp.js';
import { financeDb as db, nagdTotal, clearNagd } from '../lib/finance-db.js';
import { sendFinanceDigest } from '../lib/finance-digest.js';
import { listPendingDeploys, approvePendingDeploys, canFinanceDev } from '../lib/finance-claude.js';
import { canFinanceSection, financeSectionsFor, FINANCE_SECTIONS, FINANCE_SECTION_LABELS } from '../lib/access.js';
import { upload } from '../lib/upload.js';

// "Qalıq borc" (remaining debt) — the single source of truth for the dashboard.
const DEBT = '(COALESCE(total_amount,0) - COALESCE(advance_amount,0) - COALESCE(remaining_amount_1,0) - COALESCE(remaining_amount_2,0))';

const r = Router();
r.use(authenticate);

// Hard gate — no bypass. Full-access roles, or users explicitly granted finance_access.
r.use((req, res, next) => {
  const u = req.user;
  // Role alone never opens finance: developer, or an explicit finance_access grant.
  if (u && (u.role === 'developer' || u.finance_access)) return next();
  return res.status(403).json({ error: 'no_finance_access', message: 'Bu bölməyə girişiniz yoxdur' });
});

// Per-section gate — a finance user may be limited to a subset of sections.
const requireSection = (section) => (req, res, next) => {
  if (canFinanceSection(req.user, section)) return next();
  return res.status(403).json({ error: 'no_section_access', section, message: 'Bu maliyyə bölməsinə girişiniz yoxdur' });
};

// Which finance sections the current user may work in (client hides the rest).
r.get('/sections', (req, res) => {
  res.json({ all: FINANCE_SECTIONS, labels: FINANCE_SECTION_LABELS, allowed: financeSectionsFor(req.user) });
});

// ── Finance dev-deploy approval — SÜLEYMAN ONLY (id 16). Backend changes never
// auto-deploy; only Süleyman sees the queue and activates it (others can build via
// !dev, but cannot approve their own server changes). ──
r.get('/dev/pending', (req, res) => {
  if (req.user.id !== 16) return res.json({ pending: [] });
  res.json({ pending: listPendingDeploys() });
});
r.post('/dev/approve', (req, res) => {
  if (req.user.id !== 16) return res.status(403).json({ error: 'forbidden' });
  const restarting = approvePendingDeploys();
  res.json({ ok: true, restarting });
});

// GET /api/finance/dashboard
r.get('/dashboard', (_req, res) => {
  const d = db();
  const total_capex = d.prepare('SELECT COALESCE(SUM(total_amount),0) AS s FROM capex_projects').get().s;
  // Qalıq Məbləğ — SUM of the "Qalıq borc" column over rows with status 'davam edir'.
  const remaining_amount = d.prepare(
    `SELECT COALESCE(SUM(${DEBT}),0) AS s FROM capex_projects WHERE status = 'davam edir'`,
  ).get().s;
  // CAPEX top debtors — by the "Qalıq borc" column of the CAPEX section (all rows, as shown in the table).
  const top_debtors = d.prepare(
    `SELECT customer_name, ROUND(SUM(${DEBT}),2) AS debt
     FROM capex_projects
     GROUP BY customer_name HAVING debt > 0 ORDER BY debt DESC LIMIT 5`,
  ).all();
  const capex_count = d.prepare('SELECT COUNT(*) AS n FROM capex_projects').get().n;
  const active_count = d.prepare("SELECT COUNT(*) AS n FROM capex_projects WHERE status = 'davam edir'").get().n;
  const done_count = d.prepare("SELECT COUNT(*) AS n FROM capex_projects WHERE status = 'tamamlanıb'").get().n;

  // Licenses (debtor = not paid)
  const license_top_debtors = d.prepare(
    `SELECT customer_name, ROUND(SUM(amount),2) AS debt FROM license_payments
     WHERE status <> 'ödənilib' GROUP BY customer_name HAVING debt > 0 ORDER BY debt DESC LIMIT 5`,
  ).all();
  const license_unpaid_total = d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM license_payments WHERE status <> 'ödənilib'").get().s;
  const license_paid_total = d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM license_payments WHERE status = 'ödənilib'").get().s;

  // Equipment & services debts
  const equipment_debts = d.prepare(
    `SELECT customer_name, ROUND(SUM(amount),2) AS debt FROM equipment_services
     WHERE status = 'borcludur' GROUP BY customer_name HAVING debt > 0 ORDER BY debt DESC LIMIT 8`,
  ).all();
  const equipment_debt_total = d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM equipment_services WHERE status = 'borcludur'").get().s;

  // Spend totals + Yango monthly trend.
  // Dates come in two formats mixed: DD.MM.YYYY (e.g. 20.02.2026) and ISO YYYY-MM-DD (e.g. 2026-02-24).
  // Normalise both to MM.YYYY so the trend is grouped by MONTH, not day.
  const yango_total = d.prepare('SELECT COALESCE(SUM(fare),0) AS s FROM yango_reports').get().s;
  const numbers_total = d.prepare('SELECT COALESCE(SUM(total_amount),0) AS s FROM company_numbers').get().s;
  const yango_trend = d.prepare(
    `SELECT
       CASE WHEN substr(date,5,1)='-'
            THEN substr(date,6,2)||'.'||substr(date,1,4)
            ELSE substr(date,4,7) END AS month,
       ROUND(SUM(fare),2) AS value
     FROM yango_reports
     WHERE date IS NOT NULL AND date <> ''
     GROUP BY month
     ORDER BY CASE WHEN substr(date,5,1)='-'
                   THEN substr(date,1,4)||substr(date,6,2)
                   ELSE substr(date,7,4)||substr(date,4,2) END`,
  ).all();

  const round2 = (n) => Math.round((n || 0) * 100) / 100;

  // Omid balance (income vs spend) + Omid expense trend (date is DD.MM.YYYY)
  const omid_income = d.prepare('SELECT COALESCE(SUM(amount),0) AS s FROM omid_balance_income').get().s;
  const omid_spend = d.prepare('SELECT COALESCE(SUM(total_with_vat),0) AS s FROM omid_alis').get().s;
  const omid_trend = d.prepare(
    `SELECT substr(date,4,7) AS month, ROUND(SUM(total_with_vat),2) AS value FROM omid_alis
     WHERE date IS NOT NULL AND date <> '' GROUP BY substr(date,4,7) ORDER BY substr(date,7,4), substr(date,4,2)`,
  ).all();

  // Company-numbers expense trend (date_range is "DD.MM.YYYY – DD.MM.YYYY"; group by start month)
  const numbers_trend = d.prepare(
    `SELECT substr(date_range,4,7) AS month, ROUND(SUM(total_amount),2) AS value FROM company_numbers
     WHERE date_range IS NOT NULL AND date_range <> '' GROUP BY substr(date_range,4,7) ORDER BY substr(date_range,7,4), substr(date_range,4,2)`,
  ).all();

  // License payment status (for donut)
  const lic_status = [
    { name: 'Ödənilib', value: round2(d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM license_payments WHERE status='ödənilib'").get().s) },
    { name: 'Sənədlər göndərilib', value: round2(d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM license_payments WHERE status='sənədlər göndərilib'").get().s) },
    { name: 'Boş', value: round2(d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM license_payments WHERE status='boş'").get().s) },
  ];

  // Equipment overview (for bar)
  const equipment_overview = [
    { name: 'Borcludur', amount: round2(d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM equipment_services WHERE status='borcludur'").get().s) },
    { name: 'Ödənilib', amount: round2(d.prepare("SELECT COALESCE(SUM(amount),0) AS s FROM equipment_services WHERE status='ödənilib'").get().s) },
  ];

  // Monthly revenue trend (license: revenue = all, payments = paid)
  const lic_all = d.prepare("SELECT month, ROUND(SUM(amount),2) AS revenue FROM license_payments WHERE month IS NOT NULL AND month <> '' GROUP BY month").all();
  const lic_paid = d.prepare("SELECT month, ROUND(SUM(amount),2) AS payments FROM license_payments WHERE status='ödənilib' AND month IS NOT NULL AND month <> '' GROUP BY month").all();
  const paidMap = Object.fromEntries(lic_paid.map((r) => [r.month, r.payments]));
  // Chronological month order (Yanvar→Dekabr). Names stored as AZ text; normalize
  // NFD + strip diacritics + lowercase so nöqtəli "İyun"/"İyul" map correctly.
  const MONTH_IDX = { yanvar: 1, fevral: 2, mart: 3, aprel: 4, may: 5, iyun: 6, iyul: 7, avqust: 8, sentyabr: 9, oktyabr: 10, noyabr: 11, dekabr: 12 };
  const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');
  const monthKey = (m) => String(m || '').normalize('NFD').replace(DIACRITICS, '').trim().toLowerCase();
  const monthly_trend = lic_all
    .map((r) => ({ name: r.month, revenue: r.revenue, payments: paidMap[r.month] || 0 }))
    .sort((a, b) => (MONTH_IDX[monthKey(a.name)] || 99) - (MONTH_IDX[monthKey(b.name)] || 99));

  // Cash (nagd) expense trend — bot stores ISO date (YYYY-MM-DD)
  const nagd_trend = d.prepare(
    "SELECT substr(date,1,7) AS month, ROUND(SUM(amount),2) AS value FROM nagd_expenses WHERE date IS NOT NULL AND date <> '' GROUP BY substr(date,1,7) ORDER BY substr(date,1,7)",
  ).all();

  // Recent activity (audit log)
  const recent_activity = d.prepare('SELECT id, username, action, resource, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 20').all();

  res.json({
    total_capex: round2(total_capex),
    remaining_amount: round2(remaining_amount),
    top_debtors,
    capex_count, active_count, done_count,
    license_top_debtors,
    license_unpaid_total: round2(license_unpaid_total),
    license_paid_total: round2(license_paid_total),
    equipment_debts,
    equipment_debt_total: round2(equipment_debt_total),
    yango_total: round2(yango_total),
    numbers_total: round2(numbers_total),
    yango_trend,
    omid_income: round2(omid_income),
    omid_spend: round2(omid_spend),
    omid_balance: round2(omid_income - omid_spend),
    omid_trend,
    numbers_trend,
    lic_status,
    equipment_overview,
    monthly_trend,
    nagd_trend,
    recent_activity,
  });
});

// GET /api/finance/capex  — CAPEX projects with computed Qalıq borc
r.get('/capex', requireSection('capex'), (req, res) => {
  const d = db();
  const status = req.query.status;
  const where = status ? 'WHERE status = ?' : '';
  const sql = `SELECT *, ROUND(${DEBT},2) AS remaining_debt FROM capex_projects ${where} ORDER BY ${DEBT} DESC`;
  const items = status ? d.prepare(sql).all(status) : d.prepare(sql).all();
  res.json({ items });
});

// ── Finance ecosystem modules — all read from the ported finance dataset ──
const listRoute = (path, table, order = 'id DESC', section) =>
  r.get(path, requireSection(section), (_req, res) => res.json({ items: db().prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all() }));

listRoute('/licenses', 'license_payments', 'customer_name ASC, id DESC', 'licenses');
listRoute('/equipment', 'equipment_services', 'date DESC, id DESC', 'equipment');
listRoute('/contracts', 'contracts', 'id DESC', 'contracts');
listRoute('/numbers', 'company_numbers', 'id DESC', 'numbers');
// Tarixlər bazada iki formatda qarışıqdır (DD.MM.YYYY və ISO YYYY-MM-DD).
// Sortlanabilən YYYYMMDD açarına normallaşdırıb ən yenidən köhnəyə sıralayırıq.
const YANGO_DATE_SORT = `CASE
    WHEN date LIKE '____-__-__' THEN REPLACE(date,'-','')
    WHEN date LIKE '__.__.____' THEN substr(date,7,4)||substr(date,4,2)||substr(date,1,2)
    ELSE date
  END`;
listRoute('/yango', 'yango_reports', `${YANGO_DATE_SORT} DESC, id DESC`, 'yango');

// Cash expenses (captured from the !nagd-group WhatsApp channel + manual) — with running total.
r.get('/nagd', requireSection('nagd'), (_req, res) => {
  const items = db().prepare('SELECT * FROM nagd_expenses ORDER BY date DESC, id DESC').all();
  res.json({ items, total: nagdTotal() });
});

// Reset all cash expenses (clears records + resets id to 1).
r.delete('/nagd-all', requireSection('nagd'), (_req, res) => {
  res.json({ ok: true, removed: clearNagd() });
});

// Send the finance digest / overdue reminder to the Finance WhatsApp group now.
r.post('/digest', async (_req, res) => {
  const sent = await sendFinanceDigest();
  res.json({ ok: sent > 0, sent });
});

// Omid purchases with their line items nested.
r.get('/omid', requireSection('omid'), (_req, res) => {
  const d = db();
  const list = d.prepare(
    `SELECT * FROM omid_alis ORDER BY
       CASE WHEN date LIKE '____-__-__' THEN replace(substr(date,1,10),'-','')
            WHEN date LIKE '__.__.____' THEN substr(date,7,4)||substr(date,4,2)||substr(date,1,2)
            ELSE date END DESC, id DESC`
  ).all();
  const lines = d.prepare('SELECT * FROM omid_alis_items ORDER BY omid_alis_id, row_number').all();
  const byId = {};
  for (const it of lines) (byId[it.omid_alis_id] ||= []).push(it);
  res.json({ items: list.map((o) => ({ ...o, items: byId[o.id] || [] })) });
});

// Omid balance — interactive income/expense ledger (mirrors the finance-app dashboard).
r.get('/omid-balance', requireSection('omid'), (_req, res) => {
  const d = db();
  const incomes = d.prepare('SELECT id, date, ROUND(amount,2) AS amount FROM omid_balance_income ORDER BY date DESC, id DESC').all();
  const expenses = d.prepare("SELECT id, date, ROUND(total_with_vat,2) AS amount FROM omid_alis WHERE date IS NOT NULL AND date <> '' ORDER BY date DESC, id DESC").all();
  const r2 = (n) => Math.round((n || 0) * 100) / 100;
  const ti = incomes.reduce((s, x) => s + (x.amount || 0), 0);
  const te = expenses.reduce((s, x) => s + (x.amount || 0), 0);
  res.json({ incomes, expenses, total_income: r2(ti), total_expense: r2(te), balance: r2(ti - te) });
});
r.post('/omid-income', requireSection('omid'), (req, res) => {
  const { date, amount } = req.body || {};
  if (!date || amount == null) return res.status(400).json({ error: 'date_amount_required' });
  const info = db().prepare('INSERT INTO omid_balance_income (date, amount) VALUES (?, ?)').run(date, Number(amount));
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});
r.put('/omid-income/:id', requireSection('omid'), (req, res) => {
  const { date, amount } = req.body || {};
  db().prepare('UPDATE omid_balance_income SET date=?, amount=? WHERE id=?').run(date, Number(amount), Number(req.params.id));
  res.json({ ok: true });
});
r.delete('/omid-income/:id', requireSection('omid'), (req, res) => {
  db().prepare('DELETE FROM omid_balance_income WHERE id=?').run(Number(req.params.id));
  res.json({ ok: true });
});

// ── Omid alış (purchases / invoices with line items) — faithful to finance-app ──
// VAT logic mirrors the original: amount = quantity*unit_price (4 decimals),
// amount_with_vat = amount*(1 + vat/100) (2 decimals); default vat rate = 18%.
const OMID_VAT = 18;
function buildOmidItems(items) {
  const round4 = (x) => Math.round((Number(x) || 0) * 10000) / 10000;
  const round2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
  let total_amount = 0;
  let total_with_vat = 0;
  const rows = (Array.isArray(items) ? items : []).map((it, i) => {
    const quantity = Number(it.quantity) || 0;
    const unit_price = Number(it.unit_price) || 0;
    const vat = it.vat_rate == null ? OMID_VAT : Number(it.vat_rate) || 0;
    const amount = round4(quantity * unit_price);
    const amount_with_vat = round2(amount * (1 + vat / 100));
    total_amount += amount;
    total_with_vat += amount_with_vat;
    return {
      row_number: i + 1,
      product_name: it.product_name || '',
      quantity,
      unit: it.unit || 'əd',
      unit_price,
      amount,
      amount_with_vat,
    };
  });
  return { rows, total_amount: round2(total_amount), total_with_vat: round2(total_with_vat) };
}

// Create a purchase with its line items.
r.post('/omid-alis', requireSection('omid'), (req, res) => {
  const { date, items } = req.body || {};
  if (!date) return res.status(400).json({ error: 'date_required' });
  const { rows, total_amount, total_with_vat } = buildOmidItems(items);
  if (!rows.length) return res.status(400).json({ error: 'items_required' });
  const d = db();
  const info = d.prepare('INSERT INTO omid_alis (date, total_amount, total_with_vat) VALUES (?, ?, ?)').run(date, total_amount, total_with_vat);
  const id = Number(info.lastInsertRowid);
  const ins = d.prepare('INSERT INTO omid_alis_items (omid_alis_id, row_number, product_name, quantity, unit, unit_price, amount, amount_with_vat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const it of rows) ins.run(id, it.row_number, it.product_name, it.quantity, it.unit, it.unit_price, it.amount, it.amount_with_vat);
  res.status(201).json({ id });
});

// Replace a purchase's fields + items, recompute totals.
r.put('/omid-alis/:id', requireSection('omid'), (req, res) => {
  const id = Number(req.params.id);
  const { date, items } = req.body || {};
  const { rows, total_amount, total_with_vat } = buildOmidItems(items);
  if (!rows.length) return res.status(400).json({ error: 'items_required' });
  const d = db();
  d.prepare('UPDATE omid_alis SET date=?, total_amount=?, total_with_vat=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(date, total_amount, total_with_vat, id);
  d.prepare('DELETE FROM omid_alis_items WHERE omid_alis_id=?').run(id);
  const ins = d.prepare('INSERT INTO omid_alis_items (omid_alis_id, row_number, product_name, quantity, unit, unit_price, amount, amount_with_vat) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const it of rows) ins.run(id, it.row_number, it.product_name, it.quantity, it.unit, it.unit_price, it.amount, it.amount_with_vat);
  res.json({ ok: true });
});

// Delete a purchase and its items.
r.delete('/omid-alis/:id', requireSection('omid'), (req, res) => {
  const id = Number(req.params.id);
  const d = db();
  d.prepare('DELETE FROM omid_alis_items WHERE omid_alis_id=?').run(id);
  d.prepare('DELETE FROM omid_alis WHERE id=?').run(id);
  res.json({ ok: true });
});

// ── Write access (create / edit / delete) — mirrors finance-app capabilities ──
const MODULES = {
  capex: { table: 'capex_projects', cols: ['customer_name', 'project_name', 'total_amount', 'advance_percentage', 'advance_amount', 'advance_payment_date', 'remaining_amount_1', 'remaining_payment_date_1', 'remaining_amount_2', 'remaining_payment_date_2', 'status', 'notes'] },
  licenses: { table: 'license_payments', cols: ['customer_name', 'month', 'amount', 'status', 'notes'] },
  equipment: { table: 'equipment_services', cols: ['customer_name', 'date', 'amount', 'status', 'description'] },
  contracts: { table: 'contracts', cols: ['contract_no', 'customer', 'validity', 'classification', 'link'] },
  numbers: { table: 'company_numbers', cols: ['date_range', 'gsm_number', 'employee_name', 'total_amount', 'tariff_plan'] },
  yango: { table: 'yango_reports', cols: ['date', 'user', 'pickup', 'destination', 'fare', 'trip_type', 'purpose'] },
  nagd: { table: 'nagd_expenses', cols: ['date', 'amount', 'description', 'category', 'source'] },
};

function prep(mod, body) {
  const m = MODULES[mod];
  const data = {};
  for (const c of m.cols) if (body[c] !== undefined) data[c] = body[c] === '' ? null : body[c];
  // CAPEX: keep advance_amount in sync with total × advance% (as in finance-app).
  if (mod === 'capex' && (body.total_amount !== undefined || body.advance_percentage !== undefined)) {
    const total = Number(body.total_amount ?? 0);
    const pct = Number(body.advance_percentage ?? 0);
    data.advance_amount = Math.round((total * pct) / 100 * 100) / 100;
  }
  return data;
}

const MODULE_LABEL = { capex: 'CAPEX', licenses: 'Lisenziya', equipment: 'Avadanlıq', contracts: 'Müqavilə', numbers: 'Korp. nömrə', yango: 'Yango' };

// Finance-group WhatsApp notice for a create / edit / delete.
function notifyFinanceGroup(mod, data, user, action = 'əlavə edildi') {
  try {
    const who = user?.full_name || 'İstifadəçi';
    const main = data.customer_name || data.customer || data.contract_no || data.gsm_number || data.user || data.project_name || data.date || '';
    const amt = data.total_amount ?? data.amount ?? data.fare ?? null;
    const lines = [
      '💚👑 *Appina Finance*',
      `${MODULE_LABEL[mod] || mod}: qeyd *${action}*`,
      main ? `• ${main}` : null,
      data.status ? `• Status: *${data.status}*` : null,
      amt != null ? `• Məbləğ: ${amt} ₼` : null,
      `— ${who}`,
    ].filter(Boolean);
    whatsapp.sendToFinanceGroups(lines.join('\n')).catch(() => {});
  } catch { /* non-critical */ }
}

r.post('/:mod', (req, res) => {
  const m = MODULES[req.params.mod];
  if (!m) return res.status(404).json({ error: 'unknown_module' });
  if (!canFinanceSection(req.user, req.params.mod)) return res.status(403).json({ error: 'no_section_access', section: req.params.mod });
  const data = prep(req.params.mod, req.body || {});
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ error: 'no_fields' });
  const info = db().prepare(`INSERT INTO ${m.table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => data[k]));
  notifyFinanceGroup(req.params.mod, data, req.user);
  res.status(201).json({ id: Number(info.lastInsertRowid) });
});

r.put('/:mod/:id', (req, res) => {
  const m = MODULES[req.params.mod];
  if (!m) return res.status(404).json({ error: 'unknown_module' });
  if (!canFinanceSection(req.user, req.params.mod)) return res.status(403).json({ error: 'no_section_access', section: req.params.mod });
  const data = prep(req.params.mod, req.body || {});
  const keys = Object.keys(data);
  if (!keys.length) return res.status(400).json({ error: 'no_fields' });
  db().prepare(`UPDATE ${m.table} SET ${keys.map((k) => `${k}=?`).join(',')} WHERE id=?`).run(...keys.map((k) => data[k]), Number(req.params.id));
  // Notify the Appina Finance group on edits (status changes etc.)
  const row = db().prepare(`SELECT * FROM ${m.table} WHERE id=?`).get(Number(req.params.id));
  notifyFinanceGroup(req.params.mod, { ...row, ...data }, req.user, 'yeniləndi');
  res.json({ ok: true });
});

r.delete('/:mod/:id', (req, res) => {
  const m = MODULES[req.params.mod];
  if (!m) return res.status(404).json({ error: 'unknown_module' });
  if (!canFinanceSection(req.user, req.params.mod)) return res.status(403).json({ error: 'no_section_access', section: req.params.mod });
  db().prepare(`DELETE FROM ${m.table} WHERE id=?`).run(Number(req.params.id));
  res.json({ ok: true });
});

// Bulk upsert CAPEX rows by customer_name (matches → UPDATE, else INSERT).
// Body: { rows: [{ customer_name, project_name, total_amount, advance_percentage, advance_amount, advance_payment_date, remaining_amount_1, remaining_payment_date_1, remaining_amount_2, remaining_payment_date_2, status, notes }, ...] }
r.post('/capex/_bulk', (req, res) => {
  if (!canFinanceSection(req.user, 'capex')) return res.status(403).json({ error: 'no_section_access', section: 'capex' });
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.status(400).json({ error: 'no_rows' });
  const d = db();
  let updated = 0, inserted = 0;
  for (const raw of rows) {
    const data = prep('capex', raw);
    if (!data.customer_name) continue;
    const keys = Object.keys(data);
    const existing = d.prepare('SELECT id FROM capex_projects WHERE customer_name = ? LIMIT 1').get(data.customer_name);
    if (existing) {
      const upKeys = keys.filter((k) => k !== 'customer_name');
      if (upKeys.length) d.prepare(`UPDATE capex_projects SET ${upKeys.map((k) => `${k}=?`).join(',')} WHERE id=?`).run(...upKeys.map((k) => data[k]), existing.id);
      updated++;
    } else {
      d.prepare(`INSERT INTO capex_projects (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => data[k]));
      inserted++;
    }
  }
  res.json({ ok: true, updated, inserted });
});

r.post('/licenses/_bulk', (req, res) => {
  if (!canFinanceSection(req.user, 'licenses')) return res.status(403).json({ error: 'no_section_access', section: 'licenses' });
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.status(400).json({ error: 'no_rows' });
  const d = db();
  let updated = 0, inserted = 0;
  for (const raw of rows) {
    const data = prep('licenses', raw);
    if (!data.customer_name) continue;
    const keys = Object.keys(data);
    const existing = d.prepare('SELECT id FROM license_payments WHERE customer_name = ? LIMIT 1').get(data.customer_name);
    if (existing) {
      const upKeys = keys.filter((k) => k !== 'customer_name');
      if (upKeys.length) d.prepare(`UPDATE license_payments SET ${upKeys.map((k) => `${k}=?`).join(',')} WHERE id=?`).run(...upKeys.map((k) => data[k]), existing.id);
      updated++;
    } else {
      d.prepare(`INSERT INTO license_payments (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => data[k]));
      inserted++;
    }
  }
  res.json({ ok: true, updated, inserted });
});

r.post('/contracts/_bulk', (req, res) => {
  if (!canFinanceSection(req.user, 'contracts')) return res.status(403).json({ error: 'no_section_access', section: 'contracts' });
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.status(400).json({ error: 'no_rows' });
  const d = db();
  let updated = 0, inserted = 0;
  for (const raw of rows) {
    const data = prep('contracts', raw);
    if (!data.contract_no) continue;
    const keys = Object.keys(data);
    const existing = d.prepare('SELECT id FROM contracts WHERE contract_no = ? LIMIT 1').get(data.contract_no);
    if (existing) {
      const upKeys = keys.filter((k) => k !== 'contract_no');
      if (upKeys.length) d.prepare(`UPDATE contracts SET ${upKeys.map((k) => `${k}=?`).join(',')} WHERE id=?`).run(...upKeys.map((k) => data[k]), existing.id);
      updated++;
    } else {
      d.prepare(`INSERT INTO contracts (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => data[k]));
      inserted++;
    }
  }
  res.json({ ok: true, updated, inserted });
});

// ── Yango — Excel (.xlsx) import ────────────────────────────────────────────
// Upload a Yango trips workbook; the first row is treated as a header. Column
// names are matched flexibly (AZ/EN, case- and diacritic-insensitive) onto the
// yango_reports columns. Every data row is inserted in order.
const norm = (s) => String(s ?? '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().trim();

// header synonyms → yango_reports column
const YANGO_HEADERS = {
  date: ['date', 'tarix', 'gun', 'gün'],
  user: ['user', 'istifadeci', 'isci', 'işçi', 'ad', 'employee', 'sifariscii', 'sifarisci'],
  pickup: ['pickup', 'goturulme', 'baslangic', 'haradan', 'from', 'gedis noqtesi', 'start'],
  destination: ['destination', 'teyinat', 'haraya', 'son', 'to', 'catma noqtesi', 'end', 'unvan'],
  fare: ['fare', 'mebleg', 'qiymet', 'price', 'sum', 'haqq', 'dəyər', 'deyer', 'məbləğ'],
  trip_type: ['trip_type', 'trip type', 'nov', 'növ', 'tip', 'type'],
  purpose: ['purpose', 'meqsed', 'məqsəd', 'qeyd', 'note', 'sebeb', 'səbəb'],
};

function resolveYangoColumn(header) {
  const h = norm(header);
  if (!h) return null;
  for (const [col, syns] of Object.entries(YANGO_HEADERS)) {
    if (col === h) return col;
    if (syns.some((s) => norm(s) === h)) return col;
  }
  return null;
}

// Excel cell → plain value (handles ExcelJS rich text / formula / date objects).
function cellValue(cell) {
  const v = cell?.value;
  if (v == null) return null;
  if (typeof v === 'object') {
    if (v instanceof Date) {
      const dd = String(v.getUTCDate()).padStart(2, '0');
      const mm = String(v.getUTCMonth() + 1).padStart(2, '0');
      return `${dd}.${mm}.${v.getUTCFullYear()}`;
    }
    if (v.text != null) return v.text;                 // rich text
    if (v.result != null) return v.result;             // formula
    if (v.richText) return v.richText.map((t) => t.text).join('');
    if (v.hyperlink && v.text == null) return v.hyperlink;
  }
  return v;
}

r.post('/yango/import', upload.single('file'), async (req, res) => {
  if (!canFinanceSection(req.user, 'yango')) return res.status(403).json({ error: 'no_section_access', section: 'yango' });
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);
    const ws = wb.worksheets[0];
    if (!ws || ws.rowCount < 2) return res.status(400).json({ error: 'empty_sheet' });

    // Map spreadsheet columns → yango_reports columns from the header row.
    const headerRow = ws.getRow(1);
    const colMap = {}; // sheetColNumber → yango column
    headerRow.eachCell((cell, colNo) => {
      const col = resolveYangoColumn(cellValue(cell));
      if (col) colMap[colNo] = col;
    });
    if (!Object.keys(colMap).length) return res.status(400).json({ error: 'no_recognized_columns' });

    const d = db();
    // Bulk upsert (like licenses "toplu yeniləmə"): a trip's identity is
    // date+user+pickup+destination. Match → UPDATE fare/trip_type/purpose,
    // else INSERT. `IS` gives NULL-safe equality so re-uploading is idempotent.
    const ins = d.prepare('INSERT INTO yango_reports (date, user, pickup, destination, fare, trip_type, purpose) VALUES (@date, @user, @pickup, @destination, @fare, @trip_type, @purpose)');
    const find = d.prepare('SELECT id FROM yango_reports WHERE date IS @date AND user IS @user AND pickup IS @pickup AND destination IS @destination LIMIT 1');
    const upd = d.prepare('UPDATE yango_reports SET fare=@fare, trip_type=@trip_type, purpose=@purpose WHERE id=@id');
    let inserted = 0, updated = 0, skipped = 0;

    const applyMany = d.transaction((rows) => {
      for (const row of rows) {
        const hit = find.get(row);
        if (hit) { upd.run({ ...row, id: hit.id }); updated++; }
        else { ins.run(row); inserted++; }
      }
    });

    const toInsert = [];
    for (let i = 2; i <= ws.rowCount; i++) {
      const row = ws.getRow(i);
      const rec = { date: null, user: null, pickup: null, destination: null, fare: null, trip_type: null, purpose: null };
      let hasAny = false;
      for (const [colNo, col] of Object.entries(colMap)) {
        let val = cellValue(row.getCell(Number(colNo)));
        if (val == null || val === '') continue;
        if (col === 'fare') {
          const num = Number(String(val).replace(/[^0-9.,-]/g, '').replace(',', '.'));
          val = Number.isFinite(num) ? num : null;
          if (val == null) continue;
        } else {
          val = String(val).trim();
        }
        rec[col] = val;
        hasAny = true;
      }
      if (hasAny) toInsert.push(rec); else skipped++;
    }
    if (!toInsert.length) return res.status(400).json({ error: 'no_data_rows' });
    applyMany(toInsert);

    res.status(201).json({ ok: true, inserted, updated, skipped, columns: Object.values(colMap) });
  } catch (e) {
    res.status(400).json({ error: 'import_failed', message: String(e?.message || e) });
  }
});

export default r;
