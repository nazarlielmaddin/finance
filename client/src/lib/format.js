import { format, formatDistanceToNow, parseISO, isValid, differenceInCalendarDays } from 'date-fns';

export function parseDate(v) {
  if (!v) return null;
  if (typeof v === 'string') {
    let s = v.includes('T') ? v : v.replace(' ', 'T');
    // SQLite datetime('now') is UTC with no zone marker. Without this, the time
    // is parsed as local → "last seen" is off by the timezone (e.g. shows "1 hour ago").
    if (s.includes(':') && !/[zZ]|[+-]\d\d:?\d\d$/.test(s)) s += 'Z';
    const d = parseISO(s);
    return isValid(d) ? d : null;
  }
  return isValid(v) ? v : null;
}

export function fmtDate(v, f = 'dd MMM yyyy') {
  const d = parseDate(v);
  return d ? format(d, f) : '—';
}

export function fmtDateTime(v) {
  const d = parseDate(v);
  return d ? format(d, 'dd MMM yyyy, HH:mm') : '—';
}

export function fmtRelative(v) {
  const d = parseDate(v);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function dueIn(v) {
  const d = parseDate(v);
  if (!d) return null;
  return differenceInCalendarDays(d, new Date());
}

export function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('');
}

// Deterministic hue from an id (stable avatar tints across themes).
export function hueFromId(id) {
  const n = Number(id) || String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (n * 47) % 360;
}

export function avatarStyle(id) {
  const h = hueFromId(id);
  return {
    background: `hsl(${h} 50% 50% / 0.16)`,
    color: `hsl(${h} 55% 45%)`,
  };
}

export function minutesToHuman(m) {
  if (!m) return '0h';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (!h) return `${mm}m`;
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

export function clampText(s, n = 120) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}
