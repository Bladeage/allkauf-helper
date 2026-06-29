import { Router } from 'express';
import auth from './auth.js';
import phases from './phases.js';
import lumpSums from './lumpSums.js';
import tasks from './tasks.js';
import notes from './notes.js';
import milestones from './milestones.js';
import costs from './costs.js';
import houseAreas from './houseAreas.js';
import reminders from './reminders.js';
import settings from './settings.js';
import configRoute from './config.js';
import health from './health.js';

const router = Router();

router.use('/health', health);
router.use('/config', configRoute);
router.use('/auth', auth);
router.use('/phases', phases);
router.use('/lump-sums', lumpSums);
router.use('/tasks', tasks);
router.use('/notes', notes);
router.use('/milestones', milestones);
router.use('/costs', costs);
router.use('/house-areas', houseAreas);
router.use('/reminders', reminders);
router.use('/settings', settings);

export default router;
