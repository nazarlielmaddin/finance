const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'appina-finance-demo-v1';
const seed = {
  omid: [],
  dashboard: {
    total: 0, remaining: 0, projects: 0,
    capex_total: 0, capex_remaining: 0, licenses_debt_total: 0, equipment_debt_total: 0,
    capex_debtors: [], license_debtors: [], equipment_debts: [],
    equipment_overview: [], licenses_trend: [], capex_trend: [], numbers_trend: [], omid_trend: [],
  },
  sections: { allowed: ['capex', 'licenses', 'equipment', 'contracts', 'numbers', 'yango', 'omid', 'nagd'] },
};
const state = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed; } catch { return seed; } };
const save = (v) => localStorage.setItem(KEY, JSON.stringify(v));
async function mock(method, path, body) {
  const s = state();
  if (path === '/finance/sections') return { ...s.sections, all: s.sections.allowed, labels: {} };
  if (path === '/finance/dashboard') return s.dashboard;
  if (path === '/finance/omid-balance') return { expenses: s.omid, income: [], total: 0, balance: 0 };
  if (path === '/ai/finance/thread' || path === '/finance/dev/pending') return { messages: [], pending: [] };
  const m = path.match(/^\/finance\/omid-alis(?:\/(\d+))?$/);
  if (m) {
    if (method === 'GET') return { items: s.omid };
    if (method === 'POST') { const row = { ...body, id: Date.now() }; s.omid.push(row); save(s); return row; }
    if (method === 'PUT') { const i = s.omid.findIndex((x) => x.id === Number(m[1])); if (i >= 0) s.omid[i] = { ...s.omid[i], ...body }; save(s); return s.omid[i]; }
    if (method === 'DELETE') { s.omid = s.omid.filter((x) => x.id !== Number(m[1])); save(s); return { ok:true }; }
  }
  if (method === 'GET') return { items: [], rows: [], data: [] };
  return { ok: true };
}

async function request(method, path, body, opts = {}) {
  if (!import.meta.env.VITE_API_URL) return mock(method, path, body);
  const isForm = body instanceof FormData;
  const res = await fetch(BASE + path, {
    method,
    credentials: 'include',
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    ...opts,
  });

  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || res.statusText || 'Request failed');
    err.status = res.status;
    err.code = data && data.error;
    throw err;
  }
  return data;
}

export const api = {
  get: (p, opts) => request('GET', p, null, opts),
  post: (p, b, opts) => request('POST', p, b, opts),
  patch: (p, b, opts) => request('PATCH', p, b, opts),
  put: (p, b, opts) => request('PUT', p, b, opts),
  del: (p, opts) => request('DELETE', p, null, opts),
  upload: (p, formData) => request('POST', p, formData),
};

export { BASE };
