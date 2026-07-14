import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getCostSummary } from '../services/costService.js';
import { getReminders } from '../services/reminderService.js';

const router = Router();
router.use(requireAuth);

const CAT_LABEL = {
  allkauf_paket: 'allkauf-Paket',
  bemusterung_extra: 'Bemusterung',
  eigenleistung_material: 'Eigenleistung Material',
  sonstiges: 'Sonstiges',
};

const money = (n) => Number(n || 0).toFixed(2).replace('.', ',');
const csvCell = (v) => {
  const s = String(v ?? '');
  return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
};
const pad = (n) => String(n).padStart(2, '0');
const deDate = (x) => {
  const d = new Date(x);
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
};

// ---------- Kosten als CSV (Semikolon-getrennt, UTF-8 BOM für Excel) ----------
router.get(
  '/costs.csv',
  asyncHandler(async (req, res) => {
    const s = await getCostSummary();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kosten.csv"');
    res.write('﻿');
    const head = [
      'Phase',
      'Soll (EUR)',
      'Ist (EUR)',
      CAT_LABEL.allkauf_paket,
      CAT_LABEL.bemusterung_extra,
      CAT_LABEL.eigenleistung_material,
      CAT_LABEL.sonstiges,
      'Stunden',
    ];
    res.write(head.map(csvCell).join(';') + '\n');
    for (const p of s.byPhase) {
      res.write(
        [
          p.title,
          money(p.planned),
          money(p.total),
          money(p.byCategory.allkauf_paket),
          money(p.byCategory.bemusterung_extra),
          money(p.byCategory.eigenleistung_material),
          money(p.byCategory.sonstiges),
          p.estimatedHours,
        ]
          .map(csvCell)
          .join(';') + '\n',
      );
    }
    const t = s.totals;
    res.write(
      [
        'GESAMT',
        money(t.plannedTotal),
        money(t.grandTotal),
        money(t.byCategory.allkauf_paket),
        money(t.byCategory.bemusterung_extra),
        money(t.byCategory.eigenleistung_material),
        money(t.byCategory.sonstiges),
        t.estimatedHoursTotal,
      ]
        .map(csvCell)
        .join(';') + '\n',
    );
    res.end();
  }),
);

// ---------- Kosten als PDF ----------
router.get(
  '/costs.pdf',
  asyncHandler(async (req, res) => {
    const [s, settings] = await Promise.all([getCostSummary(), prisma.projectSettings.findFirst()]);
    const doc = new PDFDocument({ size: 'A4', margin: 44 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="kosten.pdf"');
    doc.pipe(res);

    doc.fontSize(18).font('Helvetica-Bold').text(`Kostenübersicht — ${settings?.projectName || 'Fertighaus-Helfer'}`);
    doc.moveDown(0.2).font('Helvetica').fontSize(9).fillColor('#666').text(`Erstellt: ${deDate(new Date())}`);
    doc.fillColor('#000').moveDown(1);

    s.byPhase.forEach((p) => {
      doc.font('Helvetica-Bold').fontSize(11).text(p.title);
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#444')
        .text(`Ist: ${money(p.total)} EUR    Soll: ${money(p.planned)} EUR    Eigenleistung: ${p.estimatedHours} h`);
      doc.fillColor('#000').moveDown(0.5);
    });

    doc.moveDown(0.4).font('Helvetica-Bold').fontSize(13).text('Summen');
    doc.font('Helvetica').fontSize(10).moveDown(0.2);
    const t = s.totals;
    doc.text(`Gesamt Ist:  ${money(t.grandTotal)} EUR`);
    doc.text(`Gesamt Soll: ${money(t.plannedTotal)} EUR`);
    if (s.totalBudget) doc.text(`Budget:      ${money(s.totalBudget)} EUR`);
    doc.moveDown(0.4);
    doc.text(`allkauf-Paket:           ${money(t.byCategory.allkauf_paket)} EUR`);
    doc.text(`Bemusterung:             ${money(t.byCategory.bemusterung_extra)} EUR`);
    doc.text(`Eigenleistung Material:  ${money(t.byCategory.eigenleistung_material)} EUR`);
    doc.text(`Sonstiges:               ${money(t.byCategory.sonstiges)} EUR`);
    if (t.eigenleistungValue != null) {
      doc.moveDown(0.3).text(`Eigenleistung Geldwert:  ${money(t.eigenleistungValue)} EUR  (${t.estimatedHoursTotal} h)`);
    }

    if (s.warnings?.length) {
      doc.moveDown(0.7).fillColor('#b45309').font('Helvetica-Bold').fontSize(11).text('Budget-Hinweise');
      doc.font('Helvetica').fontSize(9);
      s.warnings.forEach((w) => doc.text(`• ${w.message}`));
      doc.fillColor('#000');
    }
    doc.end();
  }),
);

// ---------- Bautagebuch als PDF ----------
router.get(
  '/diary.pdf',
  asyncHandler(async (req, res) => {
    const entries = await prisma.diaryEntry.findMany({
      orderBy: [{ entryDate: 'asc' }, { createdAt: 'asc' }],
      include: { _count: { select: { attachments: true } } },
    });
    const doc = new PDFDocument({ size: 'A4', margin: 44 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bautagebuch.pdf"');
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(18).text('Bautagebuch');
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#666')
      .text(`Erstellt: ${deDate(new Date())}    ${entries.length} Eintrag/Einträge`);
    doc.fillColor('#000').moveDown(1);

    if (!entries.length) doc.fontSize(11).text('Noch keine Einträge.');
    entries.forEach((e) => {
      doc.font('Helvetica-Bold').fontSize(12).text(`${deDate(e.entryDate)}${e.title ? ' — ' + e.title : ''}`);
      const meta = [
        e.trade && `Gewerk: ${e.trade}`,
        e.weather && `Wetter: ${e.weather}`,
        e._count.attachments ? `${e._count.attachments} Anhang/Anhänge` : null,
      ]
        .filter(Boolean)
        .join('    ');
      if (meta) doc.font('Helvetica').fontSize(8).fillColor('#666').text(meta);
      doc.fillColor('#000').font('Helvetica').fontSize(10).moveDown(0.2).text(e.content);
      doc.moveDown(0.8);
    });
    doc.end();
  }),
);

// ---------- Termine als ICS (Wiedervorlagen + Meilensteine mit Datum) ----------
router.get(
  '/reminders.ics',
  asyncHandler(async (req, res) => {
    const [reminders, milestones] = await Promise.all([
      getReminders(),
      prisma.milestone.findMany({ where: { actualDate: { not: null } } }),
    ]);
    const esc = (s) =>
      String(s ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    const ymd = (x) => {
      const d = new Date(x);
      return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
    };
    const plus1 = (x) => {
      const d = new Date(x);
      d.setUTCDate(d.getUTCDate() + 1);
      return ymd(d);
    };
    const stamp = `${ymd(new Date())}T000000Z`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Fertighaus-Helfer//DE',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];
    for (const r of reminders) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:task-${r.id}@fertighaus-helfer`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(r.effectiveDueDate)}`,
        `DTEND;VALUE=DATE:${plus1(r.effectiveDueDate)}`,
        `SUMMARY:${esc(r.title)}`,
        `DESCRIPTION:${esc(
          [
            r.phaseTitle,
            r.hasMilestone ? `${r.daysBefore} Tage vor „${r.milestoneTitle}“` : null,
            r.overdue ? 'ÜBERFÄLLIG' : null,
          ]
            .filter(Boolean)
            .join(' · '),
        )}`,
        'END:VEVENT',
      );
    }
    for (const m of milestones) {
      lines.push(
        'BEGIN:VEVENT',
        `UID:milestone-${m.id}@fertighaus-helfer`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${ymd(m.actualDate)}`,
        `DTEND;VALUE=DATE:${plus1(m.actualDate)}`,
        `SUMMARY:${esc('★ ' + m.title)}`,
        `DESCRIPTION:${esc(m.description || 'Meilenstein')}`,
        'END:VEVENT',
      );
    }
    lines.push('END:VCALENDAR');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="fertighaus-termine.ics"');
    res.send(lines.join('\r\n'));
  }),
);

export default router;
