import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  phaseId: z.number().int().positive(),
  label: z.string().min(1).max(300),
  amount: z.number().nonnegative(),
});
const updateSchema = z.object({
  label: z.string().min(1).max(300).optional(),
  amount: z.number().nonnegative().optional(),
});

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const phase = await prisma.phase.findUnique({ where: { id: b.phaseId } });
    if (!phase) throw new HttpError(400, 'Phase existiert nicht');
    const l = await prisma.phaseLumpSum.create({ data: { phaseId: b.phaseId, label: b.label, amount: b.amount } });
    send(res, l, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(updateSchema, req.body || {});
    const l = await prisma.phaseLumpSum.update({ where: { id: Number(req.params.id) }, data: b });
    send(res, l);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.phaseLumpSum.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
