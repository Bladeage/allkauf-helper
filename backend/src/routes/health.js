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
  res.json({ status: 'ok', db, time: new Date().toISOString() });
});

export default router;
