import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const createSchema = z
  .object({
    phaseId: z.number().int().positive().nullable().optional(),
    taskId: z.number().int().positive().nullable().optional(),
    content: z.string().min(1).max(10000),
  })
  .refine((d) => Boolean(d.phaseId) !== Boolean(d.taskId), {
    message: 'Genau eines von phaseId oder taskId angeben',
  });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.phaseId) where.phaseId = Number(req.query.phaseId);
    if (req.query.taskId) where.taskId = Number(req.query.taskId);
    const notes = await prisma.note.findMany({ where, orderBy: { createdAt: 'desc' } });
    send(res, notes);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const note = await prisma.note.create({
      data: { phaseId: b.phaseId ?? null, taskId: b.taskId ?? null, content: b.content },
    });
    send(res, note, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(z.object({ content: z.string().min(1).max(10000) }), req.body || {});
    const note = await prisma.note.update({ where: { id: Number(req.params.id) }, data: { content: b.content } });
    send(res, note);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.note.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
