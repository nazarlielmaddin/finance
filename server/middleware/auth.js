import { verifyToken } from '../lib/auth.js';
import { get, run } from '../db/db.js';

const PUBLIC_FIELDS =
  'id, email, full_name, role, department_id, position, phone, avatar_url, locale, theme, is_active, finance_access, finance_sections, ip_access';

export function authenticate(req, res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.token || bearer;
  if (!token) return res.status(401).json({ error: 'unauthorized' });

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'invalid_token' });

  const user = get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, payload.id);
  if (!user || !user.is_active) return res.status(401).json({ error: 'inactive' });

  req.user = user;
  try {
    run("UPDATE users SET last_seen_at = datetime('now') WHERE id = ?", user.id);
  } catch {
    /* non-critical */
  }
  next();
}

// Optional auth: attaches req.user when a valid token is present, never blocks.
export function optionalAuth(req, _res, next) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.token || bearer;
  const payload = token ? verifyToken(token) : null;
  if (payload) {
    const user = get(`SELECT ${PUBLIC_FIELDS} FROM users WHERE id = ?`, payload.id);
    if (user && user.is_active) req.user = user;
  }
  next();
}
