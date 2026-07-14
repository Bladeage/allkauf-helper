// Passwort eines Nutzers zurücksetzen:
//   docker compose exec backend node src/scripts/resetPassword.js <email> <neues-passwort>
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Nutzung: node src/scripts/resetPassword.js <email> <neues-passwort>');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
try {
  const u = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });
  console.log(`Passwort für ${u.email} aktualisiert.`);
} catch (e) {
  console.error('Fehler (existiert der Nutzer?):', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
