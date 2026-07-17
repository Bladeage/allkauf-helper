// OIDC / SSO gegen Authentik (Authorization-Code-Flow + PKCE).
//
// Bewusste Design-Entscheidung: Das ID-Token wird NICHT per JWKS-Signatur geprüft,
// sondern über den TLS-gesicherten Back-Channel als vertrauenswürdig behandelt —
// wir holen es direkt vom Token-Endpoint des Providers ab (OIDC Core §3.1.3.7 erlaubt
// die TLS-Server-Validierung anstelle der Signaturprüfung im Code-Flow). Wir prüfen
// zusätzlich iss/aud/exp/nonce. Dadurch kommt die Integration ohne neue Dependency aus.
import crypto from 'node:crypto';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function pkcePair() {
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

export const randomToken = () => crypto.randomBytes(16).toString('hex');

// Discovery-Dokument einmal laden und cachen (Endpoints/Issuer).
let _disco;
async function discovery() {
  if (_disco) return _disco;
  const url = new URL('.well-known/openid-configuration', config.oidc.issuer);
  const r = await fetch(url, { headers: { accept: 'application/json' } });
  if (!r.ok) throw new HttpError(502, `OIDC-Discovery fehlgeschlagen (${r.status})`);
  _disco = await r.json();
  return _disco;
}

export async function buildLoginUrl({ state, nonce, codeChallenge }) {
  const d = await discovery();
  const u = new URL(d.authorization_endpoint);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', config.oidc.clientId);
  u.searchParams.set('redirect_uri', config.oidc.redirectUri);
  u.searchParams.set('scope', config.oidc.scope);
  u.searchParams.set('state', state);
  u.searchParams.set('nonce', nonce);
  u.searchParams.set('code_challenge', codeChallenge);
  u.searchParams.set('code_challenge_method', 'S256');
  return u.toString();
}

function decodeJwtPayload(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new HttpError(502, 'OIDC: ungültiges ID-Token');
  return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
}

// Tauscht den Authorization-Code gegen Tokens und liefert die geprüften Profildaten.
export async function exchangeCode({ code, codeVerifier, expectedNonce }) {
  const d = await discovery();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.oidc.redirectUri,
    code_verifier: codeVerifier,
    client_id: config.oidc.clientId,
    client_secret: config.oidc.clientSecret,
  });
  const tokenRes = await fetch(d.token_endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body,
  });
  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => '');
    throw new HttpError(502, `OIDC-Token-Austausch fehlgeschlagen (${tokenRes.status}) ${txt.slice(0, 200)}`);
  }
  const tokens = await tokenRes.json();

  // ID-Token-Claims prüfen (iss/aud/exp/nonce). Signatur: siehe Dateikopf.
  const claims = decodeJwtPayload(tokens.id_token);
  const now = Math.floor(Date.now() / 1000);
  const audOk =
    claims.aud === config.oidc.clientId ||
    (Array.isArray(claims.aud) && claims.aud.includes(config.oidc.clientId));
  if (claims.iss !== d.issuer || !audOk) throw new HttpError(502, 'OIDC: iss/aud stimmt nicht');
  if (typeof claims.exp === 'number' && claims.exp < now - 30) throw new HttpError(502, 'OIDC: ID-Token abgelaufen');
  if (!expectedNonce || claims.nonce !== expectedNonce) throw new HttpError(400, 'OIDC: nonce ungültig');

  // Autoritative Profildaten vom userinfo-Endpoint.
  const uiRes = await fetch(d.userinfo_endpoint, {
    headers: { authorization: `Bearer ${tokens.access_token}`, accept: 'application/json' },
  });
  if (!uiRes.ok) throw new HttpError(502, `OIDC-userinfo fehlgeschlagen (${uiRes.status})`);
  const info = await uiRes.json();

  const sub = info.sub || claims.sub;
  const email = String(info.email || claims.email || '').toLowerCase().trim();
  const name = info.name || info.preferred_username || email;
  if (!sub) throw new HttpError(502, 'OIDC: kein sub im Profil');
  if (!email) throw new HttpError(400, 'OIDC: keine E-Mail im Profil (ist der email-Scope aktiv?)');
  return { sub, email, name };
}

// Verknüpft die OIDC-Identität mit einem lokalen Nutzer:
//   1) bereits per oidcSub verknüpft -> nehmen
//   2) gleiche E-Mail vorhanden      -> verknüpfen (bestehende Projektdaten bleiben erhalten)
//   3) sonst neu anlegen             -> nur wenn OIDC_ALLOW_SIGNUP; erster Nutzer wird Admin
export async function findOrCreateUser({ sub, email, name }) {
  const bySub = await prisma.user.findUnique({ where: { oidcSub: sub } });
  if (bySub) return bySub;

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail) {
    return prisma.user.update({ where: { id: byEmail.id }, data: { oidcSub: sub } });
  }

  if (!config.oidc.allowSignup) {
    throw new HttpError(403, 'Für diese E-Mail existiert kein Konto. Bitte vom Administrator anlegen lassen.');
  }
  const count = await prisma.user.count();
  return prisma.user.create({
    data: { name, email, oidcSub: sub, role: count === 0 ? 'admin' : 'user', passwordHash: null },
  });
}
