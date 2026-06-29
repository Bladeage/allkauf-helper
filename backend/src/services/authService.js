import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

// Gültiger 60-Zeichen-bcrypt-Hash (einmalig zur Laufzeit erzeugt), damit bcrypt.compare
// auch bei „User existiert nicht" echte Arbeit leistet -> konstante Zeit gegen User-Enumeration.
const DUMMY_HASH = bcrypt.hashSync('timing-mitigation-dummy', 10);

export async function login(email, password) {
  const normEmail = String(email || '').toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normEmail } });
  const hash = user ? user.passwordHash : DUMMY_HASH;
  const ok = await bcrypt.compare(String(password || ''), hash);
  if (!user || !ok) {
    throw new HttpError(401, 'E-Mail oder Passwort falsch');
  }
  const token = jwt.sign(
    { sub: String(user.id), email: user.email, name: user.name, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  if (!user) throw new HttpError(404, 'Nutzer nicht gefunden');
  return user;
}
