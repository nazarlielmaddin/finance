// Per-section access control. Defaults come from the role; admins can override
// them per-role or per-user from the admin panel. Full-access roles always pass.
import { get, all } from '../db/db.js';

// Every navigable section of the app.
export const SECTIONS = [
  'home', 'myTasks', 'inbox', 'tasks', 'technical', 'projects', 'clients', 'reporting',
  'workload', 'calendar', 'news', 'assistant', 'chat', 'finance', 'departments', 'users',
  'automation', 'audit',
];

const FULL = ['super_admin', 'developer'];

// Default sections allowed for each role (full-access roles get everything).
const DEFAULTS = {
  super_admin: SECTIONS,
  developer: SECTIONS,
  department_manager: ['home', 'myTasks', 'inbox', 'tasks', 'projects', 'clients', 'reporting', 'workload', 'calendar', 'news', 'assistant', 'chat', 'departments', 'automation'],
  tech_support: ['home', 'myTasks', 'inbox', 'tasks', 'technical', 'projects', 'workload', 'calendar', 'news', 'assistant', 'chat'],
  // Техники живут в разделе «Технический» — туда падают технические тикеты с объектов.
  technician: ['home', 'myTasks', 'inbox', 'tasks', 'technical', 'workload', 'calendar', 'news', 'assistant', 'chat'],
  // Moderators work like admins on the content side: every section is visible to them
  // (finance stays behind its own flag; the audit log stays admin-only).
  moderator: ['home', 'myTasks', 'inbox', 'tasks', 'technical', 'projects', 'clients', 'reporting', 'workload', 'calendar', 'news', 'assistant', 'chat', 'departments', 'users', 'automation'],
  employee: ['home', 'myTasks', 'inbox', 'tasks', 'clients', 'workload', 'calendar', 'news', 'assistant', 'chat'],
};

function defaultAllowed(role, section) {
  // Finance is gated by the separate finance_access flag, never by default here.
  if (section === 'finance') return false;
  return (DEFAULTS[role] || DEFAULTS.employee).includes(section);
}

// Resolve whether a user can see a section: user override → role override → default.
export function canAccessSection(user, section) {
  if (!user) return false;
  // Finance never comes with a role - not even super_admin. Only the developer
  // and the people explicitly granted finance_access may see it.
  if (section === 'finance') return user.role === 'developer' || !!user.finance_access;
  if (FULL.includes(user.role)) return true;

  // Resolution order: user → department → role → role default (most specific wins).
  const uo = get('SELECT allowed FROM section_access WHERE scope = ? AND ref = ? AND section = ?', 'user', String(user.id), section);
  if (uo) return !!uo.allowed;
  if (user.department_id) {
    const dpo = get('SELECT allowed FROM section_access WHERE scope = ? AND ref = ? AND section = ?', 'dept', String(user.department_id), section);
    if (dpo) return !!dpo.allowed;
  }
  const ro = get('SELECT allowed FROM section_access WHERE scope = ? AND ref = ? AND section = ?', 'role', user.role, section);
  if (ro) return !!ro.allowed;
  return defaultAllowed(user.role, section);
}

export function allowedSections(user) {
  if (!user) return [];
  const list = SECTIONS.filter((s) => canAccessSection(user, s));
  if (user.finance_access && !list.includes('finance')) list.push('finance');
  return list;
}

// ── Finance is split into sections. A user with finance_access can be limited to
// a subset via users.finance_sections (CSV of the keys below). Empty/null = ALL
// (backward compat — existing finance users keep full access). ──
export const FINANCE_SECTIONS = ['capex', 'licenses', 'equipment', 'contracts', 'numbers', 'yango', 'omid', 'nagd'];
export const FINANCE_SECTION_LABELS = {
  capex: 'CAPEX', licenses: 'Lisenziya', equipment: 'Avadanlıq', contracts: 'Müqavilə',
  numbers: 'Korp. nömrə', yango: 'Yango', omid: 'Omid', nagd: 'Nağd',
};

// The finance sections a user may work in. Full-access roles → all sections.
// A finance user with no explicit subset → all. Otherwise the saved subset.
export function financeSectionsFor(user) {
  if (!user) return [];
  if (user.role === 'developer') return [...FINANCE_SECTIONS];
  if (!user.finance_access) return [];
  const raw = String(user.finance_sections || '').trim();
  if (!raw) return [...FINANCE_SECTIONS];
  const set = raw.split(',').map((s) => s.trim().toLowerCase()).filter((s) => FINANCE_SECTIONS.includes(s));
  return set.length ? set : [...FINANCE_SECTIONS];
}

export function canFinanceSection(user, section) {
  if (!section) return false;
  return financeSectionsFor(user).includes(String(section).toLowerCase());
}

// Full override matrix for the admin editor.
export function accessMatrix() {
  const rows = all('SELECT scope, ref, section, allowed FROM section_access');
  const roleOverrides = {}; const userOverrides = {}; const deptOverrides = {};
  for (const r of rows) {
    const bucket = r.scope === 'user' ? userOverrides : r.scope === 'dept' ? deptOverrides : roleOverrides;
    (bucket[r.ref] ||= {})[r.section] = !!r.allowed;
  }
  const defaults = {};
  for (const role of Object.keys(DEFAULTS)) {
    defaults[role] = Object.fromEntries(SECTIONS.map((s) => [s, defaultAllowed(role, s)]));
  }
  return { sections: SECTIONS, defaults, roleOverrides, userOverrides, deptOverrides };
}
