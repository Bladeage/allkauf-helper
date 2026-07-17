import { Router } from 'express';
import { z } from 'zod';
import {
  login,
  loginMfa,
  getMe,
  authStatus,
  setupAdmin,
  startTotpEnrollment,
  confirmTotpEnrollment,
  disableTotp,
  recoveryStatus,
  changeOwnPassword,
} from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, sensitiveActionLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { parse } from '../utils/validation.js';
import { send } from '../utils/serialize.js';
import { setSessionCookie, cookieOptions } from '../utils/sessionCookie.js';
import oidc from './oidc.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().min(1, 'E-Mail erforderlich'),
  password: z.string().min(1, 'Passwort erforderlich'),
  remember: z.boolean().optional(),
});
const mfaSchema = z.object({
  mfaToken: z.string().min(1, 'MFA-Token erforderlich'),
  code: z.string().min(1, 'Code erforderlich'),
});
const setupSchema = z.object({
  name: z.string().min(1, 'Name erforderlich').max(120),
  email: z.string().email('Gültige E-Mail erforderlich').max(200),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben').max(200),
});
const codeSchema = z.object({ code: z.string().min(1, 'Code erforderlich') });
const passwordSchema = z.object({ password: z.string().min(1, 'Passwort erforderlich') });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen haben').max(200),
});

// ---------- Ersteinrichtung / Onboarding ----------
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    res.json(await authStatus());
  }),
);

router.post(
  '/setup',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const body = parse(setupSchema, req.body || {});
    const result = await setupAdmin(body);
    setSessionCookie(req, res, result);
    res.status(201).json({ user: result.user, token: result.token });
  }),
);

// ---------- Login ----------
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password, remember } = parse(loginSchema, req.body || {});
    const result = await login(email, password, remember);
    if (result.mfaRequired) {
      // Noch keine Session — Client fordert im zweiten Schritt den 2FA-Code an.
      return res.json({ mfaRequired: true, mfaToken: result.mfaToken });
    }
    setSessionCookie(req, res, result);
    res.json({ user: result.user, token: result.token });
  }),
);

router.post(
  '/login/2fa',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { mfaToken, code } = parse(mfaSchema, req.body || {});
    const result = await loginMfa(mfaToken, code);
    setSessionCookie(req, res, result);
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

// ---------- 2FA-Verwaltung (eingeloggt) ----------
router.get(
  '/2fa/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const me = await getMe(req.user.id);
    const rec = await recoveryStatus(req.user.id);
    res.json({ totpEnabled: me.totpEnabled, recoveryRemaining: rec.remaining });
  }),
);

router.post(
  '/2fa/setup',
  requireAuth,
  asyncHandler(async (req, res) => {
    // Gibt otpauth-URI, QR-Code (Data-URL) und das Klartext-Secret (für manuelle Eingabe) zurück.
    res.json(await startTotpEnrollment(req.user.id));
  }),
);

router.post(
  '/2fa/enable',
  requireAuth,
  sensitiveActionLimiter,
  asyncHandler(async (req, res) => {
    const { code } = parse(codeSchema, req.body || {});
    // { recoveryCodes: [...] } — nur EINMAL sichtbar.
    res.json(await confirmTotpEnrollment(req.user.id, code));
  }),
);

router.post(
  '/2fa/disable',
  requireAuth,
  sensitiveActionLimiter,
  asyncHandler(async (req, res) => {
    const { password } = parse(passwordSchema, req.body || {});
    res.json(await disableTotp(req.user.id, password));
  }),
);

// Self-Service-Passwortwechsel (eingeloggt) — setzt eine frische Session.
router.post(
  '/password',
  requireAuth,
  sensitiveActionLimiter,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = parse(changePasswordSchema, req.body || {});
    const result = await changeOwnPassword(req.user.id, currentPassword, newPassword);
    setSessionCookie(req, res, result);
    res.json({ ok: true });
  }),
);

// OIDC-/SSO-Endpunkte (Authentik) unter /api/auth/oidc.
router.use('/oidc', oidc);

export default router;
