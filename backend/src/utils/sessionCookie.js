// Zentrale Helfer zum Setzen des Session-Cookies (JWT). Wird vom klassischen
// Login (routes/auth.js) UND vom OIDC-Callback (routes/oidc.js) genutzt, damit
// beide Wege exakt dieselben Cookie-Optionen verwenden.
import { config } from '../config/env.js';

export function cookieOptions(req, extra = {}) {
  return {
    httpOnly: true,
    // Secure nur bei echter HTTPS-Verbindung (req.secure via trust proxy / X-Forwarded-Proto).
    secure: Boolean(req.secure),
    sameSite: 'lax',
    path: '/',
    ...extra,
  };
}

export function setSessionCookie(req, res, result) {
  res.cookie(
    config.cookieName,
    result.token,
    cookieOptions(req, result.remember ? { maxAge: config.rememberMaxAgeMs } : {}),
  );
}
