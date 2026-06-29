import rateLimit from 'express-rate-limit';

// Strenges Limit am Login-Endpoint (Abschnitt 8: Rate-Limiting + Brute-Force-Schutz)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10, // max. 10 Login-Versuche pro IP / Fenster
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Login-Versuche. Bitte in ein paar Minuten erneut versuchen.' },
});

// Sanftes Limit für die übrige API
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
