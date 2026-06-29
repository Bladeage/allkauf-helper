import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate } from '../utils/validation.js';
import { removeFiles } from '../utils/uploads.js';

const router = Router();
router.use(requireAuth);

const STATUS = ['open', 'in_progress', 'fixed', 'rejected'];
const SEVERITY = ['minor', 'normal', 'major', 'critical'];

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullish(),
  location: z.string().max(300).nullish(),
  phaseId: z.number().int().positive().nullish(),
  status: z.enum(STATUS).optional(),
  severity: z.enum(SEVERITY).optional(),
  dueDate: z.string().nullish(),
  reportedDate: z.string().nullish(),
  fixedDate: z.string().nullish(),
});
const updateSchema = createSchema.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.status && STATUS.includes(String(req.query.status))) where.status = String(req.query.status);
    const defects = await prisma.defect.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: { attachments: true },
    });
    send(res, defects);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const defect = await prisma.defect.create({
      data: {
        title: b.title,
        description: b.description ?? null,
        location: b.location ?? null,
        phaseId: b.phaseId ?? null,
        status: b.status || 'open',
        severity: b.severity || 'normal',
        dueDate: toDate(b.dueDate),
        reportedDate: toDate(b.reportedDate) || new Date(),
        fixedDate: toDate(b.fixedDate),
      },
    });
    send(res, defect, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(updateSchema, req.body || {});
    const data = {};
    if (b.title !== undefined) data.title = b.title;
    if (b.description !== undefined) data.description = b.description ?? null;
    if (b.location !== undefined) data.location = b.location ?? null;
    if (b.phaseId !== undefined) data.phaseId = b.phaseId ?? null;
    if (b.status !== undefined) data.status = b.status;
    if (b.severity !== undefined) data.severity = b.severity;
    if (b.dueDate !== undefined) data.dueDate = toDate(b.dueDate);
    if (b.reportedDate !== undefined) data.reportedDate = toDate(b.reportedDate);
    if (b.fixedDate !== undefined) data.fixedDate = toDate(b.fixedDate);
    // Komfort: Status -> 'fixed' ohne Datum => heute setzen
    if (b.status === 'fixed' && b.fixedDate === undefined) data.fixedDate = new Date();
    const defect = await prisma.defect.update({ where: { id: Number(req.params.id) }, data });
    send(res, defect);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.defect.findUnique({ where: { id }, include: { attachments: true } });
    if (existing) removeFiles(existing.attachments);
    await prisma.defect.delete({ where: { id } });
    res.status(204).end();
  }),
);

export default router;
