import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse } from '../utils/validation.js';
import { createCostSnapshot } from '../services/costService.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const list = await prisma.costSnapshot.findMany({ orderBy: { createdAt: 'asc' } });
    send(res, list);
  }),
);

const createBody = z.object({ label: z.string().max(200).nullish(), note: z.string().max(2000).nullish() });

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createBody, req.body || {});
    const label = (b.label && b.label.trim()) || `Kostenstand ${new Date().toISOString().slice(0, 10)}`;
    const snap = await createCostSnapshot({ label, note: b.note ?? null, auto: false });
    send(res, snap, 201);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.costSnapshot.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
