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
  // Prisma Fremdschlüssel-Verletzung -> 400
  if (err.code === 'P2003') {
    return res.status(400).json({ error: 'Ungültige Referenz (z. B. unbekannte ID)' });
  }
  // Ungültige Query-Eingaben (z. B. nicht-numerische :id -> NaN) -> 400 statt 500
  if (err.name === 'PrismaClientValidationError') {
    console.warn('[warn] PrismaClientValidationError:', String(err.message).split('\n').pop());
    return res.status(400).json({ error: 'Ungültige Anfrage-Parameter' });
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
