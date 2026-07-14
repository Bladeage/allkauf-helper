// Verschlüsselung sensibler Kleindaten (TOTP-Secrets) mit AES-256-GCM.
// Der Schlüssel wird deterministisch aus JWT_SECRET abgeleitet — es ist also keine
// separate Env-Variable nötig, und ein bereits verpflichtendes Secret wird wiederverwendet.
//
// Format (base64): v1.<iv>.<authTag>.<ciphertext>
import crypto from 'node:crypto';
import { config } from '../config/env.js';

const VERSION = 'v1';

function key() {
  // 32-Byte-Schlüssel aus dem JWT-Secret (Domänentrennung via Label).
  return crypto.createHash('sha256').update(`totp-secretbox:${config.jwtSecret}`).digest();
}

export function encryptSecret(plain) {
  if (plain == null || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join('.');
}

export function decryptSecret(blob) {
  if (!blob) return null;
  const parts = String(blob).split('.');
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error('Ungültiges Secret-Format');
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]);
  return pt.toString('utf8');
}
