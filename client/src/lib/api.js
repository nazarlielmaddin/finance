const BASE = import.meta.env.VITE_API_URL || '/api';
const KEY = 'appina-finance-demo-v1';
const demoRows = {
  capex: [
    { id: 1, customer_name: 'Kristal Bakı MMC', project_name: 'Baş ofis təmiri', total_amount: 33000, advance_percentage: 50, advance_amount: 16500, advance_payment_date: '12.02.2026', remaining_amount_1: 6667, remaining_payment_date_1: '15.03.2026', remaining_amount_2: 0, status: 'davam edir', notes: 'İkinci mərhələ tamamlanır' },
    { id: 2, customer_name: 'Bona Dea Hospital', project_name: 'Tibbi avadanlıq layihəsi', total_amount: 18600, advance_percentage: 40, advance_amount: 7440, advance_payment_date: '28.01.2026', remaining_amount_1: 6130, remaining_payment_date_1: '20.03.2026', remaining_amount_2: 0, status: 'davam edir' },
  ],
  licenses: [
    { id: 1, customer_name: 'Bona Dea', month: '2026-03', amount: 11670, status: 'ödənilib', notes: 'İllik lisenziya ödənişi' },
    { id: 2, customer_name: 'Bilgəh Kardioloji Sanatoriya', month: '2026-03', amount: 2133, status: 'sənədlər göndərilib', notes: 'Mart hesab-fakturası' },
    { id: 3, customer_name: 'Hyatt Regency Hotel', month: '2026-03', amount: 1320, status: 'ödənilib', notes: 'Aylıq xidmət' },
  ],
  equipment: [
    { id: 1, customer_name: 'Sea Breeze', date: '05.03.2026', amount: 2080, status: 'borcludur', description: 'Kondisioner texniki xidməti' },
    { id: 2, customer_name: 'Mərkəzi Klinika', date: '11.03.2026', amount: 800, status: 'ödənilib', description: 'Generator baxışı' },
  ],
  contracts: [
    { id: 1, contract_no: 'CNT-2026-014', customer: 'Bona Dea Hospital', validity: '31.12.2026', classification: 'Xidmət müqaviləsi', link: '' },
    { id: 2, contract_no: 'CNT-2026-021', customer: 'Kristal Bakı MMC', validity: '30.09.2026', classification: 'CAPEX', link: '' },
  ],
  numbers: [
    { id: 1, date_range: '01.03.2026 – 31.03.2026', gsm_number: '+994 50 555 12 34', employee_name: 'Aysel Məmmədova', total_amount: 86.4, tariff_plan: 'Biznes 10 GB' },
    { id: 2, date_range: '01.03.2026 – 31.03.2026', gsm_number: '+994 51 444 23 45', employee_name: 'Murad Əliyev', total_amount: 62.8, tariff_plan: 'Biznes 5 GB' },
  ],
  yango: [
    { id: 1, date: '14.03.2026', user: 'Nigar Hüseynova', pickup: 'Nərimanov', destination: 'Bona Dea Hospital', fare: 14.5, trip_type: 'Business', purpose: 'Görüş' },
    { id: 2, date: '16.03.2026', user: 'Murad Əliyev', pickup: '28 May', destination: 'Kristal Abşeron', fare: 11.2, trip_type: 'Business', purpose: 'Obyekt baxışı' },
  ],
  omid: [
    { id: 1, date: '03.03.2026', vendor: 'Office Line', description: 'Printer toner və kağız', amount: 248.5, category: 'Ofis', status: 'ödənilib' },
    { id: 2, date: '09.03.2026', vendor: 'Tech Store', description: 'Monitor və aksesuarlar', amount: 1360, category: 'Avadanlıq', status: 'gözləyir' },
  ],
  nagd: [
    { id: 1, date: '04.03.2026', amount: 120, description: 'Kuryer və çatdırılma', category: 'Logistika', source: 'Kassa' },
    { id: 2, date: '12.03.2026', amount: 75, description: 'Ofis xırda xərcləri', category: 'Ofis', source: 'Kassa' },
  ],
};
const seed = {
  ...demoRows,
  dashboard: {
    total: 0, remaining: 0, projects: 0,
    capex_total: 0, capex_remaining: 0, licenses_debt_total: 0, equipment_debt_total: 0,
    capex_debtors: [], license_debtors: [], equipment_debts: [],
    equipment_overview: [], licenses_trend: [], capex_trend: [], numbers_trend: [], omid_trend: [],
  },
  sections: { allowed: ['capex', 'licenses', 'equipment', 'contracts', 'numbers', 'yango', 'omid', 'nagd'] },
};
const FINANCE_SECTIONS = ['capex', 'licenses', 'equipment', 'contracts', 'numbers', 'yango', 'omid', 'nagd'];
const state = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (!stored) return seed;
    const merged = {
      ...seed,
      ...stored,
      ...Object.fromEntries(FINANCE_SECTIONS.map((key) => [key, stored[key] || seed[key] || []])),
      dashboard: { ...seed.dashboard, ...(stored.dashboard || {}) },
      sections: { ...seed.sections, ...(stored.sections || {}), allowed: FINANCE_SECTIONS },
    };
    localStorage.setItem(KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return seed;
  }
};
const save = (v) => localStorage.setItem(KEY, JSON.stringify(v));
function dashboardFrom(s) {
  const sum = (rows, key) => rows.reduce((n, r) => n + Number(r[key] || 0), 0);
  const debt = (r) => Number(r.total_amount || 0) - Number(r.advance_amount || 0) - Number(r.remaining_amount_1 || 0) - Number(r.remaining_amount_2 || 0);
  const capex = s.capex || [], licenses = s.licenses || [], equipment = s.equipment || [];
  const trend = (rows, dateKey, amountKey) => {
    const by = {};
    rows.forEach((r) => {
      const raw = String(r[dateKey] || '').replace(/\./g, '-');
      const month = raw.length >= 7 ? raw.slice(0, 7) : '2026-03';
      by[month] = (by[month] || 0) + Number(r[amountKey] || 0);
    });
    return Object.entries(by).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
  };
  const equipmentOverview = [...new Set(equipment.map((r) => r.status))].map((status) => ({
    name: status, amount: sum(equipment.filter((r) => r.status === status), 'amount'),
  }));
  const capexDebtors = capex.map((r) => ({ customer_name: r.customer_name, debt: Math.max(0, debt(r)) })).sort((a, b) => b.debt - a.debt);
  const licenseDebtors = licenses.filter((r) => r.status !== 'ödənilib').map((r) => ({ customer_name: r.customer_name, debt: Number(r.amount || 0) })).sort((a, b) => b.debt - a.debt);
  const paidLicenses = sum(licenses.filter((r) => r.status === 'ödənilib'), 'amount');
  const unpaidLicenses = sum(licenses.filter((r) => r.status !== 'ödənilib'), 'amount');
  const statusAmounts = [
    { name: 'Ödənilib', value: paidLicenses },
    { name: 'Borc', value: unpaidLicenses },
  ];
  return {
    ...s.dashboard,
    capex_total: sum(capex, 'total_amount'),
    capex_remaining: capex.reduce((n, r) => n + Math.max(0, debt(r)), 0),
    licenses_debt_total: sum(licenses.filter((r) => r.status !== 'ödənilib'), 'amount'),
    equipment_debt_total: sum(equipment.filter((r) => r.status === 'borcludur'), 'amount'),
    projects: capex.length,
    total_capex: sum(capex, 'total_amount'),
    remaining_amount: capex.reduce((n, r) => n + Math.max(0, debt(r)), 0),
    license_unpaid_total: unpaidLicenses,
    license_paid_total: paidLicenses,
    top_debtors: capexDebtors,
    license_top_debtors: licenseDebtors,
    capex_debtors: capexDebtors,
    license_debtors: licenseDebtors,
    equipment_debts: equipment.filter((r) => r.status === 'borcludur').map((r) => ({ customer_name: r.customer_name, debt: Number(r.amount || 0) })),
    equipment_overview: equipmentOverview,
    lic_status: statusAmounts,
    yango_trend: trend(s.yango || [], 'date', 'fare'),
    numbers_trend: trend(s.numbers || [], 'date_range', 'total_amount'),
    omid_trend: trend(s.omid || [], 'date', 'amount'),
    nagd_trend: trend(s.nagd || [], 'date', 'amount'),
    monthly_trend: [{ name: '2026-03', revenue: paidLicenses, payments: unpaidLicenses }],
  };
}
async function mock(method, path, body) {
  const s = state();
  if (path === '/finance/sections') return { ...s.sections, all: s.sections.allowed, labels: {} };
  if (path === '/finance/dashboard') return dashboardFrom(s);
  if (path === '/finance/omid-balance') {
    const expenses = s.omid.map((row) => ({ ...row, amount: Number(row.amount || row.total_with_vat || 0) }));
    const total = expenses.reduce((n, row) => n + row.amount, 0);
    return { expenses, income: [], total, balance: -total };
  }
  if (path === '/ai/finance/thread' || path === '/finance/dev/pending') return { messages: [], pending: [] };
  const m = path.match(/^\/finance\/omid-alis(?:\/(\d+))?$/);
  if (m) {
    if (method === 'GET') return { items: s.omid };
    if (method === 'POST') { const row = { ...body, id: Date.now() }; s.omid.push(row); save(s); return row; }
    if (method === 'PUT') { const i = s.omid.findIndex((x) => x.id === Number(m[1])); if (i >= 0) s.omid[i] = { ...s.omid[i], ...body }; save(s); return s.omid[i]; }
    if (method === 'DELETE') { s.omid = s.omid.filter((x) => x.id !== Number(m[1])); save(s); return { ok:true }; }
  }
  const sectionMatch = path.match(/^\/finance\/(capex|licenses|equipment|contracts|numbers|yango|nagd|omid)(?:\/(\d+))?$/);
  if (sectionMatch) {
    const section = sectionMatch[1], id = sectionMatch[2] ? Number(sectionMatch[2]) : null;
    const rows = s[section] || [];
    if (method === 'GET') return { items: rows };
    if (method === 'POST') { const row = { ...body, id: Date.now() }; rows.push(row); save(s); return row; }
    if (method === 'PUT') { const i = rows.findIndex((r) => r.id === id); if (i >= 0) rows[i] = { ...rows[i], ...body }; save(s); return rows[i]; }
    if (method === 'DELETE') { s[section] = rows.filter((r) => r.id !== id); save(s); return { ok: true }; }
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
