import cron from 'node-cron';
import { config } from '../config/env.js';
import { runReminderJob } from './emailService.js';
import { runBackup } from './backupService.js';

const TZ = 'Europe/Berlin';
let scheduled = null;

function human(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// node-cron: täglich 08:00 Europe/Berlin (Abschnitt 7.5)
function scheduleReminders(jobs) {
  jobs.push(
    cron.schedule(
      '0 8 * * *',
      () => {
        runReminderJob().catch((e) => console.error('[cron] Reminder-Job-Fehler:', e));
      },
      { timezone: TZ },
    ),
  );
  console.log('[cron] Reminder-Job geplant: täglich 08:00 Europe/Berlin.');
}

// Eingebaute Datensicherung — standardmäßig aktiv, Zeitplan über BACKUP_CRON.
function scheduleBackups(jobs) {
  if (!config.backup.enabled) {
    console.log('[cron] Datensicherung deaktiviert (BACKUP_ENABLED=false).');
    return;
  }
  if (!cron.validate(config.backup.schedule)) {
    console.error(
      `[cron] BACKUP_CRON ist ungültig ("${config.backup.schedule}") — Datensicherung NICHT geplant.`,
    );
    return;
  }

  jobs.push(
    cron.schedule(
      config.backup.schedule,
      () => {
        runBackup()
          .then((r) => {
            const sizes = r.files.map((f) => `${f.filename} (${human(f.size)})`).join(', ');
            console.log(`[cron] Datensicherung erstellt: ${sizes}.`);
            if (r.pruned.length) {
              console.log(`[cron] ${r.pruned.length} alte Sicherung(en) entfernt.`);
            }
          })
          .catch((e) => console.error('[cron] Backup-Job-Fehler:', e.message));
      },
      { timezone: TZ },
    ),
  );
  console.log(
    `[cron] Datensicherung geplant: "${config.backup.schedule}" ${TZ}, ` +
      `Ablage ${config.backup.dir}, Aufbewahrung ${config.backup.retentionDays} Tage.`,
  );
}

export function startCron() {
  if (scheduled) return scheduled;
  const jobs = [];
  scheduleReminders(jobs);
  scheduleBackups(jobs);
  scheduled = jobs;
  return scheduled;
}
