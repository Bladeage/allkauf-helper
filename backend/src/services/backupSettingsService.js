import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { normalizeTime } from '../utils/backupSchedule.js';

// Die Backup-Einstellungen liegen in project_settings, damit sie in der
// Oberfläche änderbar sind. Die ENV-Werte sind nur noch Startwerte für eine
// frische Installation (siehe migration 20260719200000_add_backup_settings).
// Die Zeitplan-Umrechnung steht bewusst in utils/backupSchedule.js — ohne
// DB-Abhängigkeit und damit testbar.

export { WEEKDAYS, normalizeTime, toCronExpression, describeSchedule } from '../utils/backupSchedule.js';

export async function getBackupSettings() {
  const row = await prisma.projectSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
  return {
    // Ein per ENV hart abgeschaltetes Backup bleibt aus, egal was in der DB steht —
    // so behält der Betreiber der Instanz das letzte Wort.
    enabled: config.backup.enabled && row.backupEnabled,
    envDisabled: !config.backup.enabled,
    frequency: row.backupFrequency === 'weekly' ? 'weekly' : 'daily',
    time: normalizeTime(row.backupTime),
    weekday: Number.isInteger(row.backupWeekday) ? row.backupWeekday : 0,
    keep: row.backupKeep > 0 ? row.backupKeep : 0,
    dir: config.backup.dir,
  };
}

export async function saveBackupSettings(patch) {
  const data = {};
  if (patch.enabled !== undefined) data.backupEnabled = Boolean(patch.enabled);
  if (patch.frequency !== undefined) data.backupFrequency = patch.frequency === 'weekly' ? 'weekly' : 'daily';
  if (patch.time !== undefined) data.backupTime = normalizeTime(patch.time);
  if (patch.weekday !== undefined) data.backupWeekday = Math.min(6, Math.max(0, Number(patch.weekday) || 0));
  if (patch.keep !== undefined) data.backupKeep = Math.min(365, Math.max(0, Number(patch.keep) || 0));

  await prisma.projectSettings.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  return getBackupSettings();
}
