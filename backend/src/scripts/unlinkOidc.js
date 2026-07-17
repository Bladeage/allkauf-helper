// OIDC-Verknüpfung eines Nutzers per CLI aufheben — Schutz vor Impersonation /
// Zurücksetzen einer falschen Paarung (z. B. wenn der legitime Nutzer ausgesperrt ist):
//   docker compose exec backend node src/scripts/unlinkOidc.js <email>
import { prisma } from '../config/db.js';

const [, , emailArg] = process.argv;

if (!emailArg) {
  console.error('Nutzung: node src/scripts/unlinkOidc.js <email>');
  process.exit(1);
}

const email = emailArg.toLowerCase().trim();
try {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`Nutzer ${email} nicht gefunden.`);
    process.exit(1);
  }
  if (!user.oidcSub) {
    console.log(`Nutzer ${email} ist nicht mit OIDC verknüpft — nichts zu tun.`);
    process.exit(0);
  }
  await prisma.user.update({ where: { id: user.id }, data: { oidcSub: null } });
  const hint = user.passwordHash
    ? 'Der Nutzer kann sich weiter mit Passwort anmelden.'
    : 'ACHTUNG: Der Nutzer hat KEIN lokales Passwort — Zugang nur über erneute OIDC-Anmeldung (die neu verknüpft).';
  console.log(`OIDC-Verknüpfung für ${email} aufgehoben. ${hint}`);
} catch (e) {
  console.error('Fehler:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
