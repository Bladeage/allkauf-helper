import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').nullable().optional();
const bodySchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  actualDate: dateField,
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const m = await prisma.milestone.findMany({
      orderBy: [{ actualDate: 'asc' }, { title: 'asc' }],
      include: { _count: { select: { taskLinks: true } } },
    });
    send(res, m);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(bodySchema.extend({ title: z.string().min(1).max(300) }), req.body || {});
    const m = await prisma.milestone.create({
      data: { title: b.title, description: b.description ?? null, actualDate: toDate(b.actualDate) },
    });
    send(res, m, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(bodySchema, req.body || {});
    const data = {};
    if (b.title !== undefined) data.title = b.title;
    if (b.description !== undefined) data.description = b.description;
    if (b.actualDate !== undefined) data.actualDate = toDate(b.actualDate);
    const m = await prisma.milestone.update({ where: { id: Number(req.params.id) }, data });
    send(res, m);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.milestone.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
