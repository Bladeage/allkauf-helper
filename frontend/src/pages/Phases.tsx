import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import type { Phase } from '../types';
import { Spinner, ProgressBar, Badge, PageHeader, ErrorBox } from '../components/ui';
import { STATUS_BADGE, STATUS_LABEL, fmtDate } from '../lib/format';

export default function Phases() {
  const { data, loading, error } = useFetch<Phase[]>('/phases');

  return (
    <div>
      <PageHeader title="Phasen" subtitle="Checklisten je Bauphase — antippen zum Öffnen" />
      {loading && <Spinner />}
      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="space-y-3">
        {data?.map((p) => (
          <Link
            key={p.id}
            to={`/phases/${p.id}`}
            className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-200"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-800">{p.title}</h3>
              <Badge className={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</Badge>
            </div>
            {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={p.progress} className="flex-1" />
              <span className="whitespace-nowrap text-xs font-medium text-slate-500">
                {p.doneCount}/{p.taskCount}
              </span>
            </div>
            {(p.startDate || p.endDate) && (
              <div className="mt-2 text-xs text-slate-500">
                {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
