import { transporter, smtpConfigured } from '../config/email.js';
import { prisma } from '../config/db.js';
import { config } from '../config/env.js';
import { collectDueTasks } from './reminderService.js';

function fmtDate(date) {
  return new Date(date).toLocaleDateString('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
}

function buildEmail(tasks) {
  const overdue = tasks.filter((t) => t.overdue);
  const upcoming = tasks.filter((t) => !t.overdue);
  const row = (t) =>
    `<li><b>${fmtDate(t.effectiveDueDate)}</b> — ${escapeHtml(t.title)} ` +
    `<span style="color:#666">(${escapeHtml(t.phase?.title || '')})</span>` +
    `${t.overdue ? ' <span style="color:#b91c1c">⚠️ überfällig</span>' : ''}</li>`;

  const html = `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:640px">
    <h2>🏠 Fertighaus-Helfer — Wiedervorlagen</h2>
    <p>Diese Aufgaben sind in den nächsten ${config.reminderLookaheadDays} Tagen fällig oder bereits überfällig:</p>
    ${overdue.length ? `<h3 style="color:#b91c1c">Überfällig (${overdue.length})</h3><ul>${overdue.map(row).join('')}</ul>` : ''}
    ${upcoming.length ? `<h3>Demnächst (${upcoming.length})</h3><ul>${upcoming.map(row).join('')}</ul>` : ''}
    <p style="margin-top:24px"><a href="${config.appUrl}" style="background:#ea580c;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">→ Zum Dashboard</a></p>
    <p style="color:#999;font-size:12px">Automatische Erinnerung des Fertighaus-Helfers.</p>
  </div>`;

  const text =
    tasks
      .map(
        (t) =>
          `- ${fmtDate(t.effectiveDueDate)}  ${t.title} (${t.phase?.title || ''})${t.overdue ? ' [überfällig]' : ''}`,
      )
      .join('\n') + `\n\nZum Dashboard: ${config.appUrl}`;

  return { html, text };
}

async function logEmail(recipient, subject, status, errorMessage, sentAt) {
  try {
    await prisma.emailLog.create({
      data: { recipient, subject, status, errorMessage: errorMessage || null, sentAt: sentAt || null },
    });
  } catch (e) {
    console.error('[email] Konnte E-Mail-Log nicht schreiben:', e.message);
  }
}

// Der eigentliche Reminder-Job (von Cron oder manuell via API aufgerufen)
export async function runReminderJob() {
  const tasks = await collectDueTasks(config.reminderLookaheadDays);
  const subject = `🏠 Bau-Wiedervorlagen: ${tasks.length} Aufgabe(n) fällig`;
  const recipient = config.mailTo.join(', ') || '-';

  if (tasks.length === 0) {
    console.log('[reminder] Keine fälligen Aufgaben — keine Mail versendet.');
    await logEmail(recipient, subject, 'skipped', 'keine fälligen Aufgaben', null);
    return { sent: false, count: 0, reason: 'none-due' };
  }
  if (!smtpConfigured()) {
    console.warn('[reminder] SMTP/MAIL_TO nicht konfiguriert — Mail übersprungen.');
    await logEmail(recipient, subject, 'skipped', 'SMTP nicht konfiguriert', null);
    return { sent: false, count: tasks.length, reason: 'smtp-not-configured' };
  }

  const { html, text } = buildEmail(tasks);
  try {
    await transporter.sendMail({ from: config.smtp.user, to: config.mailTo, subject, html, text });
    await logEmail(recipient, subject, 'sent', null, new Date());
    console.log(`[reminder] Mail an ${recipient} gesendet (${tasks.length} Aufgaben).`);
    return { sent: true, count: tasks.length };
  } catch (e) {
    console.error('[reminder] Mailversand fehlgeschlagen:', e.message);
    await logEmail(recipient, subject, 'error', e.message, null);
    return { sent: false, count: tasks.length, error: e.message };
  }
}
