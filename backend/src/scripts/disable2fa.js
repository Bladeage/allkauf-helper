// Zwei-Faktor-Authentisierung eines Nutzers per CLI zurücksetzen — Escape-Hatch,
// falls Authenticator UND Recovery-Codes verloren gingen:
//   docker compose exec backend node src/scripts/disable2fa.js <email>
import { prisma } from '../config/db.js';

const [, , emailArg] = process.argv;

if (!emailArg) {
  console.error('Nutzung: node src/scripts/disable2fa.js <email>');
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nutzer ${email} nicht gefunden.`);
    process.exit(1);
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { totpEnabled: false, totpSecret: null, totpPendingSecret: null },
    }),
    prisma.recoveryCode.deleteMany({ where: { userId: user.id } }),
  ]);
  console.log(`2FA für ${email} deaktiviert. Der Nutzer kann sich wieder nur mit Passwort anmelden.`);
} catch (e) {
  console.error('Fehler:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
