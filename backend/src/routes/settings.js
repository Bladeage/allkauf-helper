import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse, toDate, toMoney } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

async function getOrCreate() {
  // Singleton (id=1) per upsert — vermeidet Mehrfachzeilen bei gleichzeitigem Erstzugriff
  return prisma.projectSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD').nullable().optional();
const bodySchema = z.object({
  projectName: z.string().min(1).max(200).optional(),
  livingAreaSqm: z.number().nonnegative().nullable().optional(),
  totalBudget: z.number().nonnegative().nullable().optional(),
  projectStart: dateField,
  projectEnd: dateField,
  handoverDate: dateField,
  hourlyRateEigenleistung: z.number().nonnegative().nullable().optional(),
  contingencyPercent: z.number().nonnegative().max(100).nullable().optional(),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    send(res, await getOrCreate());
  }),
);

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(bodySchema, req.body || {});
    const current = await getOrCreate();
    const data = {};
    if (b.projectName !== undefined) data.projectName = b.projectName;
    if (b.livingAreaSqm !== undefined) data.livingAreaSqm = toMoney(b.livingAreaSqm);
    if (b.totalBudget !== undefined) data.totalBudget = toMoney(b.totalBudget);
    if (b.projectStart !== undefined) data.projectStart = toDate(b.projectStart);
    if (b.projectEnd !== undefined) data.projectEnd = toDate(b.projectEnd);
    if (b.handoverDate !== undefined) data.handoverDate = toDate(b.handoverDate);
    if (b.hourlyRateEigenleistung !== undefined) data.hourlyRateEigenleistung = toMoney(b.hourlyRateEigenleistung);
    if (b.contingencyPercent !== undefined) data.contingencyPercent = toMoney(b.contingencyPercent);
    const s = await prisma.projectSettings.update({ where: { id: current.id }, data });
    send(res, s);
  }),
);

export default router;
