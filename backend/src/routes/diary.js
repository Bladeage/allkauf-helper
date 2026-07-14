import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate } from '../utils/validation.js';
import { removeFiles } from '../utils/uploads.js';

const router = Router();

// Datum strikt validieren statt still auf „heute" zu fallen.
function requireDate(v) {
  const d = toDate(v);
  if (!d) throw new HttpError(400, 'Ungültiges Datum (Format YYYY-MM-DD).');
  return d;
}
router.use(requireAuth);

const createSchema = z.object({
  entryDate: z.string().min(1),
  weather: z.string().max(200).nullish(),
  trade: z.string().max(200).nullish(),
  title: z.string().max(300).nullish(),
  content: z.string().min(1).max(20000),
});
const updateSchema = createSchema.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const entries = await prisma.diaryEntry.findMany({
      orderBy: [{ entryDate: 'desc' }, { createdAt: 'desc' }],
      include: { attachments: true },
    });
    send(res, entries);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const entry = await prisma.diaryEntry.create({
      data: {
        entryDate: requireDate(b.entryDate),
        weather: b.weather ?? null,
        trade: b.trade ?? null,
        title: b.title ?? null,
        content: b.content,
      },
    });
    send(res, entry, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(updateSchema, req.body || {});
    const data = {};
    if (b.entryDate !== undefined) data.entryDate = requireDate(b.entryDate);
    if (b.weather !== undefined) data.weather = b.weather ?? null;
    if (b.trade !== undefined) data.trade = b.trade ?? null;
    if (b.title !== undefined) data.title = b.title ?? null;
    if (b.content !== undefined) data.content = b.content;
    const entry = await prisma.diaryEntry.update({ where: { id: Number(req.params.id) }, data });
    send(res, entry);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const existing = await prisma.diaryEntry.findUnique({ where: { id }, include: { attachments: true } });
    if (existing) removeFiles(existing.attachments);
    await prisma.diaryEntry.delete({ where: { id } });
    res.status(204).end();
  }),
);

export default router;
