import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

// Feature-Flag (Abschnitt 7.7): Modul komplett abschaltbar
router.use((req, res, next) => {
  if (!config.enableHouseModule) return next(new HttpError(404, 'Haus-Modul ist deaktiviert'));
  return next();
});

const bodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  planningNotes: z.string().max(20000).nullable().optional(),
  icon: z.string().max(16).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    send(res, await prisma.houseArea.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const a = await prisma.houseArea.findUnique({ where: { id: Number(req.params.id) } });
    if (!a) throw new HttpError(404, 'Bereich nicht gefunden');
    send(res, a);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(bodySchema.extend({ name: z.string().min(1).max(200) }), req.body || {});
    const a = await prisma.houseArea.create({
      data: {
        name: b.name,
        description: b.description ?? null,
        planningNotes: b.planningNotes ?? null,
        icon: b.icon ?? null,
        sortOrder: b.sortOrder ?? 0,
      },
    });
    send(res, a, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(bodySchema, req.body || {});
    const data = {};
    for (const k of ['name', 'description', 'planningNotes', 'icon', 'sortOrder']) {
      if (b[k] !== undefined) data[k] = b[k];
    }
    const a = await prisma.houseArea.update({ where: { id: Number(req.params.id) }, data });
    send(res, a);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.houseArea.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
