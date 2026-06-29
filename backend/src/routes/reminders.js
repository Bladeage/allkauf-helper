import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getReminders } from '../services/reminderService.js';
import { runReminderJob } from '../services/emailService.js';

const router = Router();
router.use(requireAuth);

// Zentrale Wiedervorlagen-Ansicht (Abschnitt 7.4)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await getReminders());
  }),
);

// Manuell die Erinnerungs-Mail auslösen (zum Testen des SMTP-Setups)
router.post(
  '/send-now',
  asyncHandler(async (req, res) => {
    res.json(await runReminderJob());
  }),
);

export default router;
