import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCostSummary } from '../services/costService.js';

const router = Router();
router.use(requireAuth);

// Kosten-Aggregation nach Abschnitt 5 (pro Phase, pro Kategorie, gesamt + Stunden)
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    res.json(await getCostSummary());
  }),
);

export default router;
