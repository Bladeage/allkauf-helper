import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  // Token aus httpOnly-Cookie ODER (für API-Clients) aus dem Authorization-Header
  const token = bearer || (req.cookies && req.cookies[config.cookieName]) || null;
  if (!token) {
    return res.status(401).json({ error: 'Nicht authentifiziert' });
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token ungültig oder abgelaufen' });
  }
}
