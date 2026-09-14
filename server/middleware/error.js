import { logger } from '../lib/logger.js';

export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (msg) => new HttpError(400, 'bad_request', msg);
export const forbidden = (msg) => new HttpError(403, 'forbidden', msg);
export const notFoundError = (msg) => new HttpError(404, 'not_found', msg);

export function notFound(_req, res) {
  res.status(404).json({ error: 'not_found' });
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) logger.error({ err: err.message, stack: err.stack }, 'request failed');
  res.status(status).json({ error: err.code || 'server_error', message: err.message });
}
