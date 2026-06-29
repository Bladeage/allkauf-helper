import { Router } from 'express';
import { z } from 'zod';
import { login, getMe } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { parse } from '../utils/validation.js';
import { send } from '../utils/serialize.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().min(1, 'E-Mail erforderlich'),
  password: z.string().min(1, 'Passwort erforderlich'),
});

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = parse(loginSchema, req.body || {});
    const result = await login(email, password);
    res.json(result);
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    send(res, await getMe(req.user.id));
  }),
);

export default router;
