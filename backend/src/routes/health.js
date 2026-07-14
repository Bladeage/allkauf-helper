import { Router } from 'express';
import { prisma } from '../config/db.js';

const router = Router();

router.get('/', async (req, res) => {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  // Ohne DB ist der Dienst nicht funktionsfähig -> 503, damit Healthcheck/Orchestrator es erkennt.
  res.status(db ? 200 : 503).json({ status: db ? 'ok' : 'degraded', db, time: new Date().toISOString() });
});

export default router;
