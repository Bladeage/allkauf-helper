import { describe, it, expect } from 'vitest';

// Vor dem Import setzen: secretbox leitet den AES-Schlüssel aus JWT_SECRET ab.
process.env.JWT_SECRET = 'ci-fixed-test-secret-abc';
const { encryptSecret, decryptSecret } = await import('../src/utils/secretbox.js');

describe('secretbox (AES-256-GCM)', () => {
  it('round-trips beliebige Werte', () => {
    const blob = encryptSecret('MEIN-TOTP-SECRET');
    expect(blob.startsWith('v1.')).toBe(true);
    expect(decryptSecret(blob)).toBe('MEIN-TOTP-SECRET');
  });

  // WICHTIG: eingefrorene Fixture (erzeugt mit JWT_SECRET='ci-fixed-test-secret-abc').
  // Schlägt dieser Test fehl, würde eine Format-/Algorithmusänderung bestehende
  // 2FA-Secrets unlesbar machen -> Nutzer-Lockout. Nicht „reparieren", sondern prüfen!
  it('entschlüsselt eine eingefrorene v1-Fixture (Format-Stabilität)', () => {
    const FIXTURE = 'v1.eFDlb4fh6v6t1OBC.ldzUBxnzpg94o7du2QTtyA==.0w9qPXnbyIJiHq1AJsY=';
    expect(decryptSecret(FIXTURE)).toBe('FROZENSECRET99');
  });

  it('null/leer -> null', () => {
    expect(encryptSecret('')).toBeNull();
    expect(encryptSecret(null)).toBeNull();
    expect(decryptSecret(null)).toBeNull();
  });

  it('wirft bei manipuliertem/ungültigem Blob', () => {
    expect(() => decryptSecret('kein-blob')).toThrow();
    expect(() => decryptSecret('v1.AAAA.BBBB.CCCC')).toThrow();
  });
});
