import cron from 'node-cron';
import { runReminderJob } from './emailService.js';
import { runBackup } from './backupService.js';
import { getBackupSettings, toCronExpression, describeSchedule } from './backupSettingsService.js';

const TZ = 'Europe/Berlin';
let started = false;
let backupJob = null;

function human(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// node-cron: täglich 08:00 Europe/Berlin (Abschnitt 7.5)
function scheduleReminders() {
  cron.schedule(
    '0 8 * * *',
    () => {
      runReminderJob().catch((e) => console.error('[cron] Reminder-Job-Fehler:', e));
    },
    { timezone: TZ },
  );
  console.log('[cron] Reminder-Job geplant: täglich 08:00 Europe/Berlin.');
}

// Wird beim Start und nach jeder Änderung der Backup-Einstellungen aufgerufen.
export async function rescheduleBackupJob() {
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
  }

  const s = await getBackupSettings();
  if (!s.enabled) {
    console.log(
      s.envDisabled
        ? '[cron] Datensicherung per BACKUP_ENABLED=false abgeschaltet.'
        : '[cron] Datensicherung in den Einstellungen deaktiviert.',
    );
    return null;
  }

  const expression = toCronExpression(s);
  if (!cron.validate(expression)) {
    console.error(`[cron] Ungültiger Backup-Zeitplan ("${expression}") — Datensicherung NICHT geplant.`);
    return null;
  }

  backupJob = cron.schedule(
    expression,
    () => {
      // Aufbewahrung frisch lesen: die Einstellung kann sich seit dem Planen geändert haben.
      getBackupSettings()
        .then((current) => runBackup(current.keep))
        .then((r) => {
          const sizes = r.files.map((f) => `${f.filename} (${human(f.size)})`).join(', ');
          console.log(`[cron] Datensicherung erstellt: ${sizes}.`);
          if (r.pruned.length) console.log(`[cron] ${r.pruned.length} Datei(en) alter Sicherungen entfernt.`);
        })
        .catch((e) => console.error('[cron] Backup-Job-Fehler:', e.message));
    },
    { timezone: TZ },
  );

  console.log(
    `[cron] Datensicherung geplant: ${describeSchedule(s)} (${TZ}), ` +
      `Ablage ${s.dir}, es werden ${s.keep || '∞'} Sicherungen aufbewahrt.`,
  );
  return backupJob;
}

export function startCron() {
  if (started) return;
  started = true;
  scheduleReminders();
  // Absichtlich nicht awaited: der Serverstart soll nicht an der DB hängen.
  rescheduleBackupJob().catch((e) => console.error('[cron] Backup-Planung fehlgeschlagen:', e.message));
}
