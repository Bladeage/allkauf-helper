import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse } from '../utils/validation.js';

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).nullish(),
  role: z.string().max(200).nullish(),
  phone: z.string().max(100).nullish(),
  email: z.string().max(200).nullish(),
  address: z.string().max(500).nullish(),
  note: z.string().max(5000).nullish(),
  sortOrder: z.number().int().nullish(),
});
const updateSchema = createSchema.partial();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const contacts = await prisma.contact.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
    send(res, contacts);
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const contact = await prisma.contact.create({
      data: {
        name: b.name,
        company: b.company ?? null,
        role: b.role ?? null,
        phone: b.phone ?? null,
        email: b.email ?? null,
        address: b.address ?? null,
        note: b.note ?? null,
        sortOrder: b.sortOrder ?? 0,
      },
    });
    send(res, contact, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const b = parse(updateSchema, req.body || {});
    const data = {};
    for (const k of ['name', 'company', 'role', 'phone', 'email', 'address', 'note', 'sortOrder']) {
      if (b[k] !== undefined) data[k] = k === 'name' ? b[k] : (b[k] ?? null);
    }
    const contact = await prisma.contact.update({ where: { id: Number(req.params.id) }, data });
    send(res, contact);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await prisma.contact.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  }),
);

export default router;
