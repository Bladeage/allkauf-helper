import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

// Dummy-Hash, damit Login-Zeit für „User existiert nicht" ähnlich bleibt (gegen User-Enumeration)
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8Dvz0u8b1m1Qe1Yd1Xx2nO3oQ1q2K';

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
