// OIDC-/SSO-Endpunkte (Authentik). Gemountet unter /api/auth/oidc.
// Klinkt sich vorne ans bestehende Session-System ein: nach erfolgreicher
// OIDC-Anmeldung wird dasselbe JWT-Cookie ausgestellt wie beim lokalen Login.
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { issueSession } from '../services/authService.js';
import { setSessionCookie, cookieOptions } from '../utils/sessionCookie.js';
import {
  pkcePair,
  randomToken,
  buildLoginUrl,
  exchangeCode,
  findOrCreateUser,
  pairingStatus,
  unpairUser,
} from '../services/oidcService.js';

const router = Router();
const TX_COOKIE = 'alkauf_oidc_tx';

// Kurzlebiges Transaktions-Cookie (state/nonce/verifier), nur für die OIDC-Routen.
const txCookieOptions = (req, extra = {}) => ({ ...cookieOptions(req), path: '/api/auth/oidc', ...extra });

// Verfügbarkeit fürs Frontend (Button ein-/ausblenden) — öffentlich, immer 200.
// enabled nur, wenn OIDC eingeschaltet UND die Konfiguration plausibel/vollständig ist.
router.get('/config', (req, res) => {
  const o = config.oidc;
  const configured = Boolean(o.issuer && o.clientId && o.clientSecret && o.redirectUri);
  res.json({ enabled: o.enabled && configured, label: o.buttonLabel, showPasswordLogin: o.showPasswordLogin });
});

// Verknüpfungs-Status des eingeloggten Nutzers (für die Einstellungen).
router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await pairingStatus(req.user.id));
  }),
);

// OIDC-Verknüpfung des eingeloggten Nutzers aufheben (Schutz vor Impersonation).
router.post(
  '/unlink',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json(await unpairUser(req.user.id));
  }),
);

// Schritt 1: Redirect zum Authentik-Login.
router.get(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    if (!config.oidc.enabled) return res.redirect('/?login_error=oidc_disabled');
    const state = randomToken();
    const nonce = randomToken();
    const { verifier, challenge } = pkcePair();
    // state/nonce/verifier manipulationssicher in einem kurzlebigen signierten Cookie ablegen.
    const tx = jwt.sign({ state, nonce, v: verifier }, config.jwtSecret, { expiresIn: '10m' });
    res.cookie(TX_COOKIE, tx, txCookieOptions(req, { maxAge: 10 * 60 * 1000 }));
    res.redirect(await buildLoginUrl({ state, nonce, codeChallenge: challenge }));
  }),
);

// Schritt 2: Rückkehr von Authentik.
router.get(
  '/callback',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const fail = (reason) => res.redirect('/?login_error=' + encodeURIComponent(reason));
    if (!config.oidc.enabled) return fail('oidc_disabled');

    const { code, state, error } = req.query;
    const raw = req.cookies?.[TX_COOKIE];
    res.clearCookie(TX_COOKIE, txCookieOptions(req));

    if (error) {
      console.warn('[oidc] provider returned error:', error);
      return fail('provider_error');
    }
    if (!raw || !code || !state) return fail('state_missing');

    let tx;
    try {
      tx = jwt.verify(raw, config.jwtSecret);
    } catch {
      return fail('state_expired');
    }
    if (tx.state !== String(state)) return fail('state_mismatch');

    try {
      const claims = await exchangeCode({ code: String(code), codeVerifier: tx.v, expectedNonce: tx.nonce });
      const user = await findOrCreateUser(claims);
      setSessionCookie(req, res, issueSession(user, false));
      return res.redirect('/');
    } catch (e) {
      console.error('[oidc] callback failed:', e?.message || e);
      return fail('login_failed');
    }
  }),
);

export default router;
