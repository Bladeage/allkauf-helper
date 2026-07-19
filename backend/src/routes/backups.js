import fs from 'node:fs';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { parse } from '../utils/validation.js';
import { listBackupRuns, runBackup, backupPathFor, isBackupRunning, pruneBackups } from '../services/backupService.js';
import { getBackupSettings, saveBackupSettings } from '../services/backupSettingsService.js';
import { rescheduleBackupJob } from '../services/cronService.js';

const router = Router();
// Eine Sicherung enthält sämtliche Projektdaten inklusive Nutzerkonten —
// deshalb durchgängig Admin-Recht, nicht nur requireAuth.
router.use(requireAuth, requireAdmin);

const settingsSchema = z.object({
  enabled: z.boolean().optional(),
  frequency: z.enum(['daily', 'weekly']).optional(),
  time: z.string().regex(/^\d{1,2}:\d{2}$/, 'Uhrzeit im Format HH:MM').optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  keep: z.number().int().min(0).max(365).optional(),
});

// Nur die vom Backup-Dienst selbst erzeugten Namen sind gültig — verhindert,
// dass über diesen Endpunkt beliebige Dateien aus dem Volume gelesen werden.
const FILENAME_RE = /^(db|uploads)-\d{8}-\d{6}\.(sql|tar)\.gz$/;

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({
      settings: await getBackupSettings(),
      running: isBackupRunning(),
      runs: listBackupRuns(),
    });
  }),
);

router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const body = parse(settingsSchema, req.body || {});
    const settings = await saveBackupSettings(body);
    // Zeitplan sofort übernehmen, nicht erst beim nächsten Neustart.
    await rescheduleBackupJob();
    // Kleinere Aufbewahrung wirkt sofort statt erst beim nächsten Lauf.
    const pruned = pruneBackups(settings.keep);
    res.json({ settings, pruned, runs: listBackupRuns() });
  }),
);

router.post(
  '/run',
  asyncHandler(async (req, res) => {
    const settings = await getBackupSettings();
    const result = await runBackup(settings.keep);
    res.status(201).json({ ...result, runs: listBackupRuns() });
  }),
);

router.get(
  '/file/:filename',
  asyncHandler(async (req, res) => {
    const { filename } = req.params;
    if (!FILENAME_RE.test(filename)) throw new HttpError(400, 'Ungültiger Dateiname.');

    const full = backupPathFor(filename);
    if (!fs.existsSync(full)) throw new HttpError(404, 'Sicherung nicht gefunden.');

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Length', fs.statSync(full).size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(full).pipe(res);
  }),
);

router.delete(
  '/:stamp',
  asyncHandler(async (req, res) => {
    const stamp = String(req.params.stamp);
    const run = listBackupRuns().find((r) => r.stamp === stamp);
    if (!run) throw new HttpError(404, 'Sicherung nicht gefunden.');

    for (const f of run.files) fs.rmSync(backupPathFor(f.filename), { force: true });
    res.json({ deleted: run.files.map((f) => f.filename), runs: listBackupRuns() });
  }),
);

export default router;
