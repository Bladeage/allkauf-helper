import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate, toMoney, deriveStatus } from '../utils/validation.js';
import { withEffectiveDueDate } from '../utils/dueDate.js';

const router = Router();
router.use(requireAuth);

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').nullable().optional();

const phaseBody = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  startDate: dateField,
  endDate: dateField,
  budget: z.number().nonnegative().nullable().optional(),
});

// Liste mit abgeleitetem Status + Fortschritt (Abschnitt 7.1)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const phases = await prisma.phase.findMany({
      orderBy: { orderNumber: 'asc' },
      include: {
        tasks: { select: { isDone: true } },
        _count: { select: { tasks: true, notes: true, lumpSums: true } },
      },
    });
    const data = phases.map((p) => {
      const d = deriveStatus(p.tasks);
      const { tasks, ...rest } = p;
      return { ...rest, status: d.status, progress: d.progress, doneCount: d.done, taskCount: d.total };
    });
    send(res, data);
  }),
);

// Detail mit Tasks, Notizen, Lump Sums
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const phase = await prisma.phase.findUnique({
      where: { id },
      include: {
        tasks: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: { milestoneLinks: { include: { milestone: true } }, _count: { select: { notes: true } } },
        },
        lumpSums: { orderBy: { id: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!phase) throw new HttpError(404, 'Phase nicht gefunden');
    const d = deriveStatus(phase.tasks);
    const tasks = phase.tasks.map(withEffectiveDueDate);
    send(res, { ...phase, tasks, status: d.status, progress: d.progress, doneCount: d.done, taskCount: d.total });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const body = parse(
      phaseBody.extend({ title: z.string().min(1).max(300), orderNumber: z.number().int().optional() }),
      req.body || {},
    );
    const max = await prisma.phase.aggregate({ _max: { orderNumber: true } });
    const orderNumber = body.orderNumber ?? (max._max.orderNumber ?? -1) + 1;
    const phase = await prisma.phase.create({
      data: {
        orderNumber,
        title: body.title,
        description: body.description ?? null,
        startDate: toDate(body.startDate),
        endDate: toDate(body.endDate),
        budget: toMoney(body.budget),
      },
    });
    send(res, phase, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const body = parse(phaseBody, req.body || {});
    const data = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.startDate !== undefined) data.startDate = toDate(body.startDate);
    if (body.endDate !== undefined) data.endDate = toDate(body.endDate);
    if (body.budget !== undefined) data.budget = toMoney(body.budget);
    const phase = await prisma.phase.update({ where: { id }, data });
    send(res, phase);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.phase.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
