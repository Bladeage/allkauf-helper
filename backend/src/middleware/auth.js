import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { prisma } from '../config/db.js';

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  // Token aus httpOnly-Cookie ODER (für API-Clients) aus dem Authorization-Header
  const token = bearer || (req.cookies && req.cookies[config.cookieName]) || null;
  if (!token) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }
  try {
    // Frisch aus der DB: fängt gelöschte Nutzer, Rollen-Degradierung und per tokenVersion
    // invalidierte Sessions ab (Passwort-/Rollenwechsel). Rolle IMMER aus der DB, nie aus dem Token.
    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, email: true, name: true, role: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.tv) {
      return res.status(401).json({ error: 'Sitzung ungültig. Bitte erneut anmelden.' });
    }
    req.user = { id: user.id, email: user.email, name: user.name, role: user.role };
    return next();
  } catch (e) {
    return next(e);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Nur für Administratoren' });
  }
  return next();
}
