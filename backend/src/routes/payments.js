import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate, toMoney } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  label: z.string().min(1).max(300),
  percent: z.union([z.number(), z.string()]).nullish(),
  plannedAmount: z.union([z.number(), z.string()]).nullish(),
  dueCondition: z.string().max(500).nullish(),
  dueDate: z.string().nullish(),
  isPaid: z.boolean().optional(),
  paidDate: z.string().nullish(),
  paidAmount: z.union([z.number(), z.string()]).nullish(),
  note: z.string().max(2000).nullish(),
  sortOrder: z.number().int().nullish(),
});
const updateSchema = createSchema.partial();

function summarize(installments) {
  let plannedTotal = 0;
  let paidTotal = 0;
  for (const it of installments) {
    const planned = Number(it.plannedAmount ?? 0);
    plannedTotal += planned;
    if (it.isPaid) paidTotal += Number(it.paidAmount ?? it.plannedAmount ?? 0);
  }
  return {
    plannedTotal,
    paidTotal,
    openTotal: Math.max(0, plannedTotal - paidTotal),
    paidCount: installments.filter((i) => i.isPaid).length,
    total: installments.length,
  };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const installments = await prisma.paymentInstallment.findMany({ orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] });
    send(res, { installments, summary: summarize(installments) });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const created = await prisma.paymentInstallment.create({
      data: {
        label: b.label,
        percent: toMoney(b.percent),
        plannedAmount: toMoney(b.plannedAmount),
        dueCondition: b.dueCondition ?? null,
        dueDate: toDate(b.dueDate),
        isPaid: b.isPaid ?? false,
        paidDate: toDate(b.paidDate),
        paidAmount: toMoney(b.paidAmount),
        note: b.note ?? null,
        sortOrder: b.sortOrder ?? 0,
      },
    });
    send(res, created, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(updateSchema, req.body || {});
    const data = {};
    if (b.label !== undefined) data.label = b.label;
    if (b.percent !== undefined) data.percent = toMoney(b.percent);
    if (b.plannedAmount !== undefined) data.plannedAmount = toMoney(b.plannedAmount);
    if (b.dueCondition !== undefined) data.dueCondition = b.dueCondition ?? null;
    if (b.dueDate !== undefined) data.dueDate = toDate(b.dueDate);
    if (b.isPaid !== undefined) data.isPaid = b.isPaid;
    if (b.paidDate !== undefined) data.paidDate = toDate(b.paidDate);
    if (b.paidAmount !== undefined) data.paidAmount = toMoney(b.paidAmount);
    if (b.note !== undefined) data.note = b.note ?? null;
    if (b.sortOrder !== undefined) data.sortOrder = b.sortOrder ?? 0;
    // Komfort: als bezahlt markiert ohne Datum => heute
    if (b.isPaid === true && b.paidDate === undefined) data.paidDate = new Date();
    const updated = await prisma.paymentInstallment.update({ where: { id: Number(req.params.id) }, data });
    send(res, updated);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.paymentInstallment.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
