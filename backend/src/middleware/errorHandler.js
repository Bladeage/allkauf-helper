import { config } from '../config/env.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: 'Endpunkt nicht gefunden' });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }
  // Prisma "record not found" -> 404
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Datensatz nicht gefunden' });
  }
  const message =
    status >= 500
      ? config.nodeEnv === 'production'
        ? 'Serverfehler'
        : err.message
      : err.message || 'Fehler';
  res.status(status).json({ error: message });
}

// Async-Wrapper, damit Fehler in Controllern an errorHandler gehen
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
