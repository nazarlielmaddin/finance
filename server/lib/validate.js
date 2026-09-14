import { HttpError } from '../middleware/error.js';

export const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'testing', 'done', 'cancelled'];
export const PRIORITIES = ['critical', 'high', 'medium', 'low'];
export const ROLES = ['super_admin', 'developer', 'tech_support', 'technician', 'moderator', 'department_manager', 'employee'];
export const LOCALES = ['az', 'en', 'ru', 'tr'];
export const APPROVAL = ['pending', 'approved', 'rejected'];

export function required(obj, fields) {
  for (const f of fields) {
    const v = obj?.[f];
    if (v === undefined || v === null || v === '') {
      throw new HttpError(400, 'missing_field', `Field "${f}" is required`);
    }
  }
}

export function oneOf(value, allowed, field) {
  if (value != null && !allowed.includes(value)) {
    throw new HttpError(400, 'invalid_value', `${field} must be one of: ${allowed.join(', ')}`);
  }
}

export function toInt(v, def = null) {
  if (v === undefined || v === null || v === '') return def;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : def;
}

export function clampInt(v, min, max, def) {
  const n = toInt(v, def);
  if (n == null) return def;
  return Math.min(max, Math.max(min, n));
}

export function str(v, maxLen = 10000) {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export function bool(v) {
  return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
}
