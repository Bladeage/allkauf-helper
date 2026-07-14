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

// Strenges Limit für sensible, passwort-/code-prüfende Aktionen (2FA aktivieren/deaktivieren,
// eigener Passwortwechsel) — ohne enges Limit per gestohlener Session brute-forcebar.
export const sensitiveActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Versuche. Bitte in ein paar Minuten erneut versuchen.' },
});

// Enges Limit für das manuelle Auslösen der Erinnerungs-Mail (gegen Mail-Bomb / Kontingent)
export const sendMailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Mail-Auslösungen. Bitte später erneut versuchen.' },
});
