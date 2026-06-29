import cron from 'node-cron';
import { runReminderJob } from './emailService.js';

let scheduled = null;

// node-cron: täglich 08:00 Europe/Berlin (Abschnitt 7.5)
export function startCron() {
  if (scheduled) return scheduled;
  scheduled = cron.schedule(
    '0 8 * * *',
    () => {
      runReminderJob().catch((e) => console.error('[cron] Reminder-Job-Fehler:', e));
    },
    { timezone: 'Europe/Berlin' },
  );
  console.log('[cron] Reminder-Job geplant: täglich 08:00 Europe/Berlin.');
  return scheduled;
}
