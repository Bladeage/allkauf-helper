import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';
import { encryptSecret, decryptSecret } from '../utils/secretbox.js';

// Erlaubt ±1 Zeitfenster (±30 s) Drift zwischen Server und Authenticator-App.
authenticator.options = { window: 1 };

const TOTP_ISSUER = 'Fertighaus-Helfer';
const RECOVERY_COUNT = 10;

// Gültiger 60-Zeichen-bcrypt-Hash (einmalig zur Laufzeit erzeugt), damit bcrypt.compare
// auch bei „User existiert nicht" echte Arbeit leistet -> konstante Zeit gegen User-Enumeration.
const DUMMY_HASH = bcrypt.hashSync('timing-mitigation-dummy', 10);

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

export function issueSession(user, remember) {
  const token = jwt.sign(
    { sub: String(user.id), email: user.email, name: user.name, role: user.role, tv: user.tokenVersion ?? 0 },
    config.jwtSecret,
    { expiresIn: remember ? config.jwtRememberExpiresIn : config.jwtExpiresIn },
  );
  return { token, remember: Boolean(remember), user: publicUser(user) };
}

// ---------- Login ----------
export async function login(email, password, remember = false) {
  const normEmail = String(email || '').toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normEmail } });
  // Reine OIDC-Nutzer haben kein lokales Passwort -> DUMMY_HASH (schlägt konstant-zeitig fehl).
  const hash = user && user.passwordHash ? user.passwordHash : DUMMY_HASH;
  const ok = await bcrypt.compare(String(password || ''), hash);
  if (!user || !ok) {
    throw new HttpError(401, 'E-Mail oder Passwort falsch');
  }
  if (user.totpEnabled) {
    // Passwort korrekt, aber 2FA aktiv -> noch KEINE Session, nur ein kurzlebiges MFA-Token.
    const mfaToken = jwt.sign(
      { sub: String(user.id), purpose: 'mfa', remember: Boolean(remember) },
      config.jwtSecret,
      { expiresIn: '5m' },
    );
    return { mfaRequired: true, mfaToken };
  }
  return { mfaRequired: false, ...issueSession(user, remember) };
}

export async function loginMfa(mfaToken, code) {
  let payload;
  try {
    payload = jwt.verify(mfaToken, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Zwei-Faktor-Sitzung abgelaufen. Bitte erneut anmelden.');
  }
  if (payload.purpose !== 'mfa') throw new HttpError(401, 'Ungültiges Token');
  const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });
  if (!user || !user.totpEnabled) throw new HttpError(401, 'Zwei-Faktor-Authentisierung nicht aktiv');

  const ok = (await verifyTotp(user, code)) || (await consumeRecoveryCode(user, code));
  if (!ok) throw new HttpError(401, 'Code ungültig');
  return issueSession(user, payload.remember);
}

// ---------- Erst-Einrichtung (Onboarding) ----------
export async function authStatus() {
  const count = await prisma.user.count();
  return { needsSetup: count === 0 };
}

export async function setupAdmin({ name, email, password }) {
  // Nur solange KEIN Nutzer existiert (Race-sicher über die unique-Email-Constraint + Count).
  const count = await prisma.user.count();
  if (count > 0) throw new HttpError(409, 'Die Ersteinrichtung ist bereits abgeschlossen.');
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: String(email).toLowerCase().trim(), passwordHash, role: 'admin' },
  });
  return issueSession(user, false);
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true, totpEnabled: true },
  });
  if (!user) throw new HttpError(404, 'Nutzer nicht gefunden');
  return user;
}

// ---------- TOTP-Verwaltung ----------
async function verifyTotp(user, token) {
  if (!user.totpSecret) return false;
  let secret;
  try {
    secret = decryptSecret(user.totpSecret);
  } catch {
    // Nicht mehr entschlüsselbar (z. B. nach JWT_SECRET-Rotation): TOTP scheitert kontrolliert,
    // damit in loginMfa der Recovery-Code-Pfad erreichbar bleibt statt eines 500ers.
    return false;
  }
  return authenticator.verify({ token: String(token || '').replace(/\s+/g, ''), secret });
}

async function consumeRecoveryCode(user, raw) {
  const norm = String(raw || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  if (norm.length < 8) return false;
  const codes = await prisma.recoveryCode.findMany({ where: { userId: user.id, usedAt: null } });
  for (const rc of codes) {
    if (await bcrypt.compare(norm, rc.codeHash)) {
      await prisma.recoveryCode.update({ where: { id: rc.id }, data: { usedAt: new Date() } });
      return true;
    }
  }
  return false;
}

async function generateRecoveryCodes() {
  const plain = [];
  const hashes = [];
  for (let i = 0; i < RECOVERY_COUNT; i++) {
    const raw = crypto.randomBytes(5).toString('hex'); // 10 Hex-Zeichen
    plain.push(`${raw.slice(0, 5)}-${raw.slice(5)}`); // Anzeigeformat xxxxx-xxxxx
    hashes.push(await bcrypt.hash(raw.toLowerCase(), 10));
  }
  return { plain, hashes };
}

export async function startTotpEnrollment(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Nutzer nicht gefunden');
  if (user.totpEnabled) throw new HttpError(409, 'Zwei-Faktor-Authentisierung ist bereits aktiv.');
  const secret = authenticator.generateSecret();
  await prisma.user.update({ where: { id: userId }, data: { totpPendingSecret: encryptSecret(secret) } });
  const otpauth = authenticator.keyuri(user.email, TOTP_ISSUER, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  return { secret, otpauth, qrDataUrl };
}

export async function confirmTotpEnrollment(userId, code) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Nutzer nicht gefunden');
  if (user.totpEnabled) throw new HttpError(409, 'Zwei-Faktor-Authentisierung ist bereits aktiv.');
  if (!user.totpPendingSecret) throw new HttpError(400, 'Keine offene Einrichtung. Bitte erneut starten.');
  const secret = decryptSecret(user.totpPendingSecret);
  const ok = authenticator.verify({ token: String(code || '').replace(/\s+/g, ''), secret });
  if (!ok) throw new HttpError(400, 'Code ungültig. Bitte erneut versuchen.');

  const { plain, hashes } = await generateRecoveryCodes();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: true, totpSecret: user.totpPendingSecret, totpPendingSecret: null },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId } }),
    ...hashes.map((codeHash) => prisma.recoveryCode.create({ data: { userId, codeHash } })),
  ]);
  return { recoveryCodes: plain };
}

export async function disableTotp(userId, password) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Nutzer nicht gefunden');
  const ok = await bcrypt.compare(String(password || ''), user.passwordHash);
  // 403 (nicht 401): Passwort falsch ist KEIN abgelaufener Login — sonst würde der
  // Frontend-401-Interceptor den eingeloggten Nutzer fälschlich ausloggen.
  if (!ok) throw new HttpError(403, 'Passwort falsch');
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { totpEnabled: false, totpSecret: null, totpPendingSecret: null },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId } }),
  ]);
  return { ok: true };
}

// Anzahl noch nutzbarer Recovery-Codes (für die Statusanzeige).
export async function recoveryStatus(userId) {
  const remaining = await prisma.recoveryCode.count({ where: { userId, usedAt: null } });
  return { remaining };
}

// Self-Service-Passwortwechsel: verlangt das aktuelle Passwort, invalidiert andere
// Sessions (tokenVersion++) und gibt eine frische Session zurück (aktuelle bleibt gültig).
export async function changeOwnPassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new HttpError(404, 'Nutzer nicht gefunden');
  const ok = await bcrypt.compare(String(currentPassword || ''), user.passwordHash);
  if (!ok) throw new HttpError(403, 'Aktuelles Passwort falsch');
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
  return issueSession(updated, false);
}
