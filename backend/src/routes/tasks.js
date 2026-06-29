import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate, toMoney, COST_CATEGORIES, PRIORITIES } from '../utils/validation.js';
import { withEffectiveDueDate } from '../utils/dueDate.js';

const router = Router();
router.use(requireAuth);

const taskInclude = {
  milestoneLinks: { include: { milestone: true } },
  _count: { select: { notes: true } },
};

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').nullable().optional();
const money = z.number().nonnegative().nullable().optional();

const createSchema = z.object({
  phaseId: z.number().int().positive(),
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullable().optional(),
  costCategory: z.enum(COST_CATEGORIES).nullable().optional(),
  costAmount: money,
  plannedAmount: money,
  estimatedHours: z.number().int().min(0).max(100000).nullable().optional(),
  dueDate: dateField,
  vendor: z.string().max(300).nullable().optional(),
  priority: z.enum(PRIORITIES).optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).nullable().optional(),
  isDone: z.boolean().optional(),
  costCategory: z.enum(COST_CATEGORIES).nullable().optional(),
  costAmount: money,
  plannedAmount: money,
  estimatedHours: z.number().int().min(0).max(100000).nullable().optional(),
  dueDate: dateField,
  vendor: z.string().max(300).nullable().optional(),
  isPaid: z.boolean().optional(),
  paidDate: dateField,
  priority: z.enum(PRIORITIES).optional(),
  attachmentUrl: z.string().max(2000).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.phaseId) where.phaseId = Number(req.query.phaseId);
    const tasks = await prisma.task.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      include: taskInclude,
    });
    send(res, tasks.map(withEffectiveDueDate));
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
      where: { id: Number(req.params.id) },
      include: { ...taskInclude, notes: { orderBy: { createdAt: 'desc' } } },
    });
    if (!task) throw new HttpError(404, 'Aufgabe nicht gefunden');
    send(res, withEffectiveDueDate(task));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const phase = await prisma.phase.findUnique({ where: { id: b.phaseId } });
    if (!phase) throw new HttpError(400, 'Phase existiert nicht');
    const task = await prisma.task.create({
      data: {
        phaseId: b.phaseId,
        title: b.title,
        description: b.description ?? null,
        isCustom: true, // vom Nutzer angelegt
        costCategory: b.costCategory ?? null,
        costAmount: toMoney(b.costAmount),
        plannedAmount: toMoney(b.plannedAmount),
        estimatedHours: b.estimatedHours ?? null,
        dueDate: toDate(b.dueDate),
        vendor: b.vendor ?? null,
        priority: b.priority || 'normal',
      },
      include: taskInclude,
    });
    send(res, withEffectiveDueDate(task), 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Aufgabe nicht gefunden');
    const b = parse(updateSchema, req.body || {});
    const data = {};

    // Titel/Beschreibung nur bei eigenen (is_custom) Aufgaben änderbar (Abschnitt 7.1)
    if (b.title !== undefined) {
      if (!existing.isCustom) throw new HttpError(403, 'Titel offizieller Checklisten-Punkte ist gesperrt');
      data.title = b.title;
    }
    if (b.description !== undefined) {
      if (!existing.isCustom) throw new HttpError(403, 'Beschreibung offizieller Checklisten-Punkte ist gesperrt');
      data.description = b.description;
    }
    // Diese Felder sind für ALLE Aufgaben editierbar (Abhaken, Kosten, Termine, ...)
    if (b.isDone !== undefined) data.isDone = b.isDone;
    if (b.costCategory !== undefined) data.costCategory = b.costCategory;
    if (b.costAmount !== undefined) data.costAmount = toMoney(b.costAmount);
    if (b.plannedAmount !== undefined) data.plannedAmount = toMoney(b.plannedAmount);
    if (b.estimatedHours !== undefined) data.estimatedHours = b.estimatedHours;
    if (b.dueDate !== undefined) data.dueDate = toDate(b.dueDate);
    if (b.vendor !== undefined) data.vendor = b.vendor;
    if (b.isPaid !== undefined) data.isPaid = b.isPaid;
    if (b.paidDate !== undefined) data.paidDate = toDate(b.paidDate);
    if (b.priority !== undefined) data.priority = b.priority;
    if (b.attachmentUrl !== undefined) data.attachmentUrl = b.attachmentUrl;
    if (b.sortOrder !== undefined) data.sortOrder = b.sortOrder;

    const task = await prisma.task.update({ where: { id }, data, include: taskInclude });
    send(res, withEffectiveDueDate(task));
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new HttpError(404, 'Aufgabe nicht gefunden');
    if (!existing.isCustom) {
      throw new HttpError(403, 'Offizielle Checklisten-Punkte können nicht gelöscht werden (nur eigene/ergänzte).');
    }
    await prisma.task.delete({ where: { id } });
    res.status(204).end();
  }),
);

// --- Verknüpfung Aufgabe <-> Meilenstein (relative Fälligkeit, Abschnitt 7.4) ---
const linkSchema = z.object({
  milestoneId: z.number().int().positive(),
  daysBefore: z.number().int().min(0).max(3650),
});

router.post(
  '/:id/milestone-link',
  asyncHandler(async (req, res) => {
    const taskId = Number(req.params.id);
    const b = parse(linkSchema, req.body || {});
    const link = await prisma.taskMilestoneLink.create({
      data: { taskId, milestoneId: b.milestoneId, daysBefore: b.daysBefore },
    });
    send(res, link, 201);
  }),
);

router.delete(
  '/:id/milestone-link/:linkId',
  asyncHandler(async (req, res) => {
    await prisma.taskMilestoneLink.delete({ where: { id: Number(req.params.linkId) } });
    res.status(204).end();
  }),
);

export default router;
