import { Router } from 'express';
import { z } from 'zod';
import { login, getMe } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { parse } from '../utils/validation.js';
import { send } from '../utils/serialize.js';
import { config } from '../config/env.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().min(1, 'E-Mail erforderlich'),
  password: z.string().min(1, 'Passwort erforderlich'),
  remember: z.boolean().optional(),
});

function cookieOptions(req, extra = {}) {
  return {
    httpOnly: true,
    // Secure nur bei echter HTTPS-Verbindung (req.secure via trust proxy / X-Forwarded-Proto).
    // Prod hinter NPM = HTTPS -> Secure-Cookie; Direktzugriff/lokal über HTTP -> nicht-secure (funktioniert trotzdem).
    secure: Boolean(req.secure),
    sameSite: 'lax',
    path: '/',
    ...extra,
  };
}

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, remember } = parse(loginSchema, req.body || {});
    const result = await login(email, password, remember);
    // httpOnly-Cookie (nicht per JS lesbar). „eingeloggt bleiben" -> persistentes Cookie, sonst Session-Cookie.
    res.cookie(config.cookieName, result.token, cookieOptions(req, result.remember ? { maxAge: config.rememberMaxAgeMs } : {}));
    // token zusätzlich im Body für API-/CLI-Clients (Browser nutzt das Cookie)
    res.json({ user: result.user, token: result.token });
  }),
);

router.post('/logout', (req, res) => {
  res.clearCookie(config.cookieName, cookieOptions(req));
  res.status(204).end();
});

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    send(res, await getMe(req.user.id));
  }),
);

export default router;
