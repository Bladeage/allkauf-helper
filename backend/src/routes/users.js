import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { send } from '../utils/serialize.js';
import { parse } from '../utils/validation.js';

const router = Router();
// RBAC: nur eingeloggte Admins
router.use(requireAuth, requireAdmin);

const ROLES = ['admin', 'user'];
const selectUser = { id: true, name: true, email: true, role: true, createdAt: true };

const createSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  role: z.enum(ROLES).optional(),
});
const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(200).optional(),
  role: z.enum(ROLES).optional(),
});
const pwSchema = z.object({ password: z.string().min(8).max(200) });

const adminCount = () => prisma.user.count({ where: { role: 'admin' } });

router.get(
  '/',
  asyncHandler(async (req, res) => {
    send(res, await prisma.user.findMany({ select: selectUser, orderBy: { id: 'asc' } }));
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const b = parse(createSchema, req.body || {});
    const passwordHash = await bcrypt.hash(b.password, 10);
    const user = await prisma.user.create({
      data: { name: b.name, email: b.email.toLowerCase().trim(), passwordHash, role: b.role || 'user' },
      select: selectUser,
    });
    send(res, user, 201);
  }),
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = parse(updateSchema, req.body || {});
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, 'Nutzer nicht gefunden');

    // Schutz: letzten Admin nicht degradieren, sich nicht selbst degradieren
    if (b.role === 'user' && target.role === 'admin') {
      if (id === req.user.id) throw new HttpError(400, 'Du kannst dich nicht selbst degradieren');
      if ((await adminCount()) <= 1) throw new HttpError(400, 'Der letzte Admin kann nicht degradiert werden');
    }

    const data = {};
    if (b.name !== undefined) data.name = b.name;
    if (b.email !== undefined) data.email = b.email.toLowerCase().trim();
    if (b.role !== undefined) data.role = b.role;
    send(res, await prisma.user.update({ where: { id }, data, select: selectUser }));
  }),
);

router.post(
  '/:id/password',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const b = parse(pwSchema, req.body || {});
    const passwordHash = await bcrypt.hash(b.password, 10);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.status(204).end();
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (id === req.user.id) throw new HttpError(400, 'Du kannst dich nicht selbst löschen');
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) throw new HttpError(404, 'Nutzer nicht gefunden');
    if (target.role === 'admin' && (await adminCount()) <= 1) {
      throw new HttpError(400, 'Der letzte Admin kann nicht gelöscht werden');
    }
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  }),
);

export default router;
