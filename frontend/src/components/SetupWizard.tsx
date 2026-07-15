import { useEffect, useState } from 'react';
import { api, apiError } from '../lib/api';
import type { ProjectSettings, Phase, PhaseDetail, Milestone, PaymentInstallment, Contact } from '../types';
import { Spinner, Button, Field, Input, Select, Badge, ErrorBox } from './ui';
import { toInputDate, euro } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useT } from '../i18n/LanguageContext';

type Props = { open: boolean; onClose: () => void; onDone?: () => void };

const MS_ORDER = [
  'Bauantrag eingereicht',
  'Baugenehmigung erhalten',
  'Statik fertig',
  'Bemusterung',
  'Abnahme Bodenplatte/Keller',
  'Hausmontage (Stelltermin)',
  'Estrich fertig',
  'Hausübergabe',
];
const BEM_TASK = 'Bemusterung: Aufpreis-Posten (Upgrades Fliesen/Bäder/Böden)';
const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

const STEP_DEFS = [
  { key: 'where', title: 'Wo steht ihr?' },
  { key: 'project', title: 'Projekt & Budget' },
  { key: 'contract', title: 'Vertrag & Kosten' },
  { key: 'dates', title: 'Schlüssel-Termine' },
  { key: 'payments', title: 'Zahlungsplan' },
  { key: 'contacts', title: 'Kontakte' },
  { key: 'retro', title: 'Rückblick' },
  { key: 'done', title: 'Fertig' },
] as const;

export default function SetupWizard({ open, onClose, onDone }: Props) {
  const t = useT();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const [settings, setSettings] = useState<ProjectSettings | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [payments, setPayments] = useState<PaymentInstallment[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [currentPhase, setCurrentPhase] = useState(0);
  const [doRetro, setDoRetro] = useState(true);
  const [proj, setProj] = useState({ projectName: '', livingAreaSqm: '', totalBudget: '', hourlyRate: '', contingency: '' });
  const [grundpreisId, setGrundpreisId] = useState<number | null>(null);
  const [grundpreis, setGrundpreis] = useState('');
  const [bemTaskId, setBemTaskId] = useState<number | null>(null);
  const [bemusterung, setBemusterung] = useState('');
  const [dates, setDates] = useState({ projectStart: '', projectEnd: '' });
  const [msDates, setMsDates] = useState<Record<number, string>>({});
  const [payAmt, setPayAmt] = useState<Record<number, string>>({});
  const [contactEdits, setContactEdits] = useState<Record<number, { phone: string; email: string }>>({});
  const [retroPhases, setRetroPhases] = useState<PhaseDetail[]>([]);
  const [retroLoading, setRetroLoading] = useState(false);

  const activeSteps = STEP_DEFS.filter((s) => s.key !== 'retro' || doRetro);
  const cur = activeSteps[Math.min(step, activeSteps.length - 1)];

  // Laden beim Öffnen
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setErr(null);
    setStep(0);
    Promise.all([
      api.get<ProjectSettings>('/settings'),
      api.get<Phase[]>('/phases'),
      api.get<Milestone[]>('/milestones'),
      api.get<{ installments: PaymentInstallment[] }>('/payments'),
      api.get<Contact[]>('/contacts'),
    ])
      .then(([s, p, m, pay, c]) => {
        setSettings(s.data);
        setPhases(p.data);
        setMilestones(m.data);
        setPayments(pay.data.installments);
        setContacts(c.data);
        setProj({
          projectName: s.data.projectName ?? '',
          livingAreaSqm: s.data.livingAreaSqm != null ? String(s.data.livingAreaSqm) : '',
          totalBudget: s.data.totalBudget != null ? String(s.data.totalBudget) : '',
          hourlyRate: s.data.hourlyRateEigenleistung != null ? String(s.data.hourlyRateEigenleistung) : '',
          contingency: s.data.contingencyPercent != null ? String(s.data.contingencyPercent) : '',
        });
        setDates({ projectStart: toInputDate(s.data.projectStart), projectEnd: toInputDate(s.data.projectEnd) });
        setMsDates(Object.fromEntries(m.data.map((x) => [x.id, toInputDate(x.actualDate)])));
        setPayAmt(Object.fromEntries(pay.data.installments.map((x) => [x.id, x.plannedAmount != null ? String(x.plannedAmount) : ''])));
        setContactEdits(Object.fromEntries(c.data.map((x) => [x.id, { phone: x.phone ?? '', email: x.email ?? '' }])));
        const firstOpen = p.data.find((ph) => ph.status !== 'done') ?? p.data[0];
        setCurrentPhase(firstOpen?.orderNumber ?? 0);
      })
      .catch((e) => setErr(apiError(e)))
      .finally(() => setLoading(false));
  }, [open]);

  // Esc schließt, Body-Scroll sperren
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy]);

  // Referenzen für den Kosten-Schritt nachladen (Grundpreis-Pauschale Phase 3, Bemusterungs-Aufgabe Phase 1)
  useEffect(() => {
    if (!open || cur?.key !== 'contract' || grundpreisId !== null) return;
    const p3 = phases.find((p) => p.orderNumber === 3);
    const p1 = phases.find((p) => p.orderNumber === 1);
    (async () => {
      try {
        if (p3) {
          const d = (await api.get<PhaseDetail>(`/phases/${p3.id}`)).data;
          const ls = d.lumpSums?.[0];
          if (ls) {
            setGrundpreisId(ls.id);
            setGrundpreis(ls.amount ? String(ls.amount) : '');
          }
        }
        if (p1) {
          const d = (await api.get<PhaseDetail>(`/phases/${p1.id}`)).data;
          const t = d.tasks.find((x) => x.title === BEM_TASK);
          if (t) {
            setBemTaskId(t.id);
            setBemusterung(t.costAmount != null ? String(t.costAmount) : '');
          }
        }
      } catch (e) {
        setErr(apiError(e));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.key, open]);

  // Rückblick-Phasen (alle vor der aktuellen Phase) nachladen
  useEffect(() => {
    if (!open || cur?.key !== 'retro') return;
    const earlier = phases.filter((p) => p.orderNumber < currentPhase);
    setRetroLoading(true);
    Promise.all(earlier.map((p) => api.get<PhaseDetail>(`/phases/${p.id}`).then((r) => r.data)))
      .then(setRetroPhases)
      .catch((e) => setErr(apiError(e)))
      .finally(() => setRetroLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.key, open, currentPhase]);

  async function saveStep() {
    setErr(null);
    if (cur.key === 'project') {
      await api.patch('/settings', {
        projectName: proj.projectName.trim() || 'Fertighaus-Helfer',
        livingAreaSqm: num(proj.livingAreaSqm),
        totalBudget: num(proj.totalBudget),
        hourlyRateEigenleistung: num(proj.hourlyRate),
        contingencyPercent: num(proj.contingency),
      });
    } else if (cur.key === 'contract') {
      if (grundpreisId !== null && grundpreis.trim() !== '') {
        await api.patch(`/lump-sums/${grundpreisId}`, { amount: Number(grundpreis) });
      }
      if (bemTaskId !== null && bemusterung.trim() !== '') {
        await api.patch(`/tasks/${bemTaskId}`, { costAmount: Number(bemusterung) });
      }
    } else if (cur.key === 'dates') {
      await api.patch('/settings', { projectStart: dates.projectStart || null, projectEnd: dates.projectEnd || null });
      await Promise.all(
        milestones
          .filter((m) => toInputDate(m.actualDate) !== (msDates[m.id] ?? ''))
          .map((m) => api.patch(`/milestones/${m.id}`, { actualDate: msDates[m.id] || null })),
      );
    } else if (cur.key === 'payments') {
      await Promise.all(
        payments
          .filter((p) => (p.plannedAmount != null ? String(p.plannedAmount) : '') !== (payAmt[p.id] ?? ''))
          .map((p) => api.patch(`/payments/${p.id}`, { plannedAmount: num(payAmt[p.id] ?? '') })),
      );
    } else if (cur.key === 'contacts') {
      await Promise.all(
        contacts
          .filter((c) => {
            const e = contactEdits[c.id];
            return e && (e.phone !== (c.phone ?? '') || e.email !== (c.email ?? ''));
          })
          .map((c) => api.patch(`/contacts/${c.id}`, { phone: contactEdits[c.id].phone || null, email: contactEdits[c.id].email || null })),
      );
    }
  }

  async function next() {
    setBusy(true);
    try {
      await saveStep();
      if (cur.key === 'done') {
        toast.success(t('Einrichtung gespeichert'));
        onDone?.();
        onClose();
      } else {
        setStep((s) => Math.min(s + 1, activeSteps.length - 1));
      }
    } catch (e) {
      setErr(apiError(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleRetroTask(phaseId: number, taskId: number, isDone: boolean) {
    setRetroPhases((prev) =>
      prev.map((p) => (p.id === phaseId ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, isDone } : t)) } : p)),
    );
    try {
      await api.patch(`/tasks/${taskId}`, { isDone });
    } catch (e) {
      setErr(apiError(e));
    }
  }
  async function markPhaseDone(p: PhaseDetail) {
    const open = p.tasks.filter((t) => !t.isDone);
    setRetroPhases((prev) => prev.map((x) => (x.id === p.id ? { ...x, tasks: x.tasks.map((t) => ({ ...t, isDone: true })) } : x)));
    try {
      await Promise.all(open.map((t) => api.patch(`/tasks/${t.id}`, { isDone: true })));
      toast.success(t('„{title}" abgehakt', { title: p.title }));
    } catch (e) {
      setErr(apiError(e));
    }
  }

  if (!open) return null;

  const progress = activeSteps.length > 1 ? step / (activeSteps.length - 1) : 1;
  const sortedMs = [...milestones].sort((a, b) => {
    const ia = MS_ORDER.indexOf(a.title);
    const ib = MS_ORDER.indexOf(b.title);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  const check = {
    budget: proj.totalBudget.trim() !== '',
    start: dates.projectStart !== '',
    milestones: Object.values(msDates).some((v) => v),
    grundpreis: grundpreis.trim() !== '',
    payments: Object.values(payAmt).some((v) => v.trim() !== ''),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Einrichtungs-Assistent')}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-slate-800 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Kopf */}
        <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">🧭 {t('Einrichtungs-Assistent')}</h2>
            <button onClick={() => !busy && onClose()} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700" aria-label={t('Schließen')}>
              ✕
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
              {step + 1}/{activeSteps.length} · {t(cur.title)}
            </span>
          </div>
        </div>

        {/* Inhalt */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid place-items-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              {cur.key === 'where' && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {t('Damit jede Phase ihre nötigen Daten bekommt: Sag uns, wo ihr gerade steht. Anschließend füllen wir von allgemein nach speziell — und holen Verpasstes nach.')}
                  </p>
                  <Field label={t('Aktuelle Phase')}>
                    <Select value={String(currentPhase)} onChange={(e) => setCurrentPhase(Number(e.target.value))}>
                      {phases.map((p) => (
                        <option key={p.id} value={p.orderNumber}>
                          {p.title}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <label className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={doRetro}
                      onChange={(e) => setDoRetro(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand dark:border-slate-600"
                    />
                    <span>
                      {t('Verpasstes nachholen — am Ende zeige ich die Checklisten der früheren Phasen, damit ihr Erledigtes abhaken könnt (pro Phase ein „alles erledigt"-Knopf).')}
                    </span>
                  </label>
                </div>
              )}

              {cur.key === 'project' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t('Grunddaten fürs Dashboard, Budget-Warnungen und die Eigenleistungs-Hochrechnung.')}</p>
                  <Field label={t('Projektname')}>
                    <Input value={proj.projectName} onChange={(e) => setProj((f) => ({ ...f, projectName: e.target.value }))} placeholder={t('z. B. Unser Haus in …')} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('Wohnfläche (m²)')}>
                      <Input type="number" inputMode="decimal" value={proj.livingAreaSqm} onChange={(e) => setProj((f) => ({ ...f, livingAreaSqm: e.target.value }))} />
                    </Field>
                    <Field label={t('Gesamtbudget (€)')}>
                      <Input type="number" inputMode="decimal" value={proj.totalBudget} onChange={(e) => setProj((f) => ({ ...f, totalBudget: e.target.value }))} />
                    </Field>
                    <Field label={t('Stundensatz Eigenleistung (€/h)')}>
                      <Input type="number" inputMode="decimal" value={proj.hourlyRate} onChange={(e) => setProj((f) => ({ ...f, hourlyRate: e.target.value }))} />
                    </Field>
                    <Field label={t('Puffer / Reserve (%)')}>
                      <Input type="number" inputMode="decimal" value={proj.contingency} onChange={(e) => setProj((f) => ({ ...f, contingency: e.target.value }))} placeholder={t('z. B. 10')} />
                    </Field>
                  </div>
                </div>
              )}

              {cur.key === 'contract' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900">
                    <Badge className="bg-brand-50 text-brand-700 dark:bg-brand-700/20 dark:text-brand-300">Free Time</Badge>
                    <span className="text-slate-600 dark:text-slate-300">{t('Der Anbieter bzw. seine Partnerfirmen übernehmen je nach Vertrag Trockenbau, Estrich, Sanitär, Heizung & Elektro — eure Eigenleistung ist der Endausbau.')}</span>
                  </div>
                  <Field label={t('Grundpreis-Pauschale Haus (€)')} hint={t('Hauslieferung + Montage + Ausbaupakete + Architekt/Statik. Aus eurem Vertrag.')}>
                    <Input type="number" inputMode="decimal" value={grundpreis} onChange={(e) => setGrundpreis(e.target.value)} placeholder={t('z. B. 230000')} />
                  </Field>
                  <Field label={t('Bemusterungs-Aufpreise gesamt (€)')} hint={t('Grobe Summe der Upgrades (Fliesen/Bäder/Böden …) aus dem Bemusterungsprotokoll.')}>
                    <Input type="number" inputMode="decimal" value={bemusterung} onChange={(e) => setBemusterung(e.target.value)} placeholder={t('z. B. 15000')} />
                  </Field>
                </div>
              )}

              {cur.key === 'dates' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t('Termine treiben die Wiedervorlagen (auch relative wie „X Tage vor Estrich") und die Zeitleiste.')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t('Projektstart (Gantt)')}>
                      <Input type="date" value={dates.projectStart} onChange={(e) => setDates((d) => ({ ...d, projectStart: e.target.value }))} />
                    </Field>
                    <Field label={t('Projektende (Gantt)')}>
                      <Input type="date" value={dates.projectEnd} onChange={(e) => setDates((d) => ({ ...d, projectEnd: e.target.value }))} />
                    </Field>
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{t('Meilenstein-Termine')}</div>
                  <div className="space-y-2">
                    {sortedMs.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm text-slate-700 dark:text-slate-200">{m.title}</span>
                        <Input type="date" className="w-40 shrink-0" value={msDates[m.id] ?? ''} onChange={(e) => setMsDates((d) => ({ ...d, [m.id]: e.target.value }))} aria-label={m.title} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cur.key === 'payments' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t('Soll-Beträge je Abschlag aus eurem Zahlungsplan (MaBV/§ 650m). Später unter „Zahlungen" als bezahlt markierbar.')}</p>
                  <div className="space-y-2">
                    {payments.map((p) => (
                      <div key={p.id} className="flex items-center justify-between gap-2">
                        <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{p.label}</span>
                        <Input type="number" inputMode="decimal" className="w-32 shrink-0" placeholder="€" value={payAmt[p.id] ?? ''} onChange={(e) => setPayAmt((d) => ({ ...d, [p.id]: e.target.value }))} aria-label={t('Betrag {label}', { label: p.label })} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cur.key === 'contacts' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t('Nur ausfüllen, was relevant ist — Telefon/E-Mail genügen. Weitere Felder später unter „Kontakte".')}</p>
                  <div className="space-y-2">
                    {contacts.map((c) => (
                      <div key={c.id} className="rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                        <div className="mb-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{c.name}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder={t('Telefon')} value={contactEdits[c.id]?.phone ?? ''} onChange={(e) => setContactEdits((d) => ({ ...d, [c.id]: { ...d[c.id], phone: e.target.value } }))} aria-label={t('Telefon {name}', { name: c.name })} />
                          <Input placeholder={t('E-Mail')} value={contactEdits[c.id]?.email ?? ''} onChange={(e) => setContactEdits((d) => ({ ...d, [c.id]: { ...d[c.id], email: e.target.value } }))} aria-label={t('E-Mail {name}', { name: c.name })} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cur.key === 'retro' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t('Hakt in den früheren Phasen ab, was schon erledigt ist — so stimmen Fortschritt und Checklisten.')}</p>
                  {retroLoading ? (
                    <div className="grid place-items-center py-6">
                      <Spinner />
                    </div>
                  ) : retroPhases.length === 0 ? (
                    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">{t('Keine früheren Phasen — ihr steht ganz am Anfang.')} 🎉</p>
                  ) : (
                    retroPhases.map((p) => {
                      const done = p.tasks.filter((t) => t.isDone).length;
                      return (
                        <div key={p.id} className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-2 dark:border-slate-700">
                            <span className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                              {p.title} <span className="text-xs text-slate-400">({done}/{p.tasks.length})</span>
                            </span>
                            <Button variant="secondary" onClick={() => markPhaseDone(p)} disabled={done === p.tasks.length}>
                              {t('alle erledigt')}
                            </Button>
                          </div>
                          <div className="max-h-44 space-y-1 overflow-y-auto p-2">
                            {p.tasks.map((t) => (
                              <label key={t.id} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <input
                                  type="checkbox"
                                  checked={t.isDone}
                                  onChange={(e) => toggleRetroTask(p.id, t.id, e.target.checked)}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-brand-700 focus:ring-brand dark:border-slate-600"
                                />
                                <span className={t.isDone ? 'text-slate-400 line-through dark:text-slate-500' : ''}>{t.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {cur.key === 'done' && (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300">{t('Geschafft! Hier der Stand der wichtigsten Angaben:')}</p>
                  <ul className="space-y-1.5 text-sm">
                    {[
                      [t('Gesamtbudget'), check.budget],
                      [t('Projektstart'), check.start],
                      [t('Mind. ein Meilenstein-Termin'), check.milestones],
                      [t('Grundpreis (Haus)'), check.grundpreis],
                      [t('Zahlungsplan-Beträge'), check.payments],
                    ].map(([label, ok]) => (
                      <li key={label as string} className="flex items-center gap-2">
                        <span className={ok ? 'text-emerald-600' : 'text-slate-400'}>{ok ? '✓' : '○'}</span>
                        <span className={ok ? 'text-slate-700 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}>{label}</span>
                      </li>
                    ))}
                  </ul>
                  {settings?.totalBudget != null && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('Aktuelles Budget: {amount}.', { amount: euro(num(proj.totalBudget) ?? settings.totalBudget) })}</p>
                  )}
                  <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    {t('Offene Punkte könnt ihr jederzeit ergänzen — der Assistent ist über das Dashboard erneut aufrufbar. Details je Aufgabe in den Phasen, Beträge unter „Kosten"/„Zahlungen".')}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Fuß */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-700">
          {err && (
            <div className="mb-2">
              <ErrorBox>{err}</ErrorBox>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={busy || step === 0}>
              ← {t('Zurück')}
            </Button>
            <div className="flex items-center gap-2">
              {cur.key !== 'done' && (
                <Button variant="ghost" onClick={() => !busy && onClose()} disabled={busy}>
                  {t('Später')}
                </Button>
              )}
              <Button onClick={next} disabled={busy || loading}>
                {busy ? t('Speichern…') : cur.key === 'done' ? t('Fertig') : t('Weiter →')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
