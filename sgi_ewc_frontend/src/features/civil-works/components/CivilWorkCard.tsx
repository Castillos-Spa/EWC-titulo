import React, { useMemo } from 'react';
import type { CivilWork, CivilWorkStatus, CivilWorkType } from '../../../types/CivilWork';
import { MapPin, CalendarDays, CalendarClock, Layers, ClipboardList, AlertTriangle, Hammer, CheckCircle2 } from 'lucide-react';
import { useIntlFormat } from '../../../app/intl/format';

const STATUS_CONFIG: Record<CivilWorkStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  COMPLETED: {
    label: 'Completado',
    badge: 'border-emerald-400/70 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-100',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  IN_PROGRESS: {
    label: 'En progreso',
    badge: 'border-sky-400/70 bg-sky-500/10 text-sky-600 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-100',
    icon: <Hammer className="h-4 w-4" />,
  },
  PENDING: {
    label: 'Pendiente',
    badge: 'border-amber-400/70 bg-amber-500/10 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-100',
    icon: <CalendarClock className="h-4 w-4" />,
  },
  ON_HOLD: {
    label: 'En pausa',
    badge: 'border-rose-400/70 bg-rose-500/10 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-100',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
};

const WORK_TYPE_LABEL: Record<CivilWorkType, string> = {
  CONSTRUCTION: 'Construcción',
  REPAIR: 'Reparación',
  MAINTENANCE: 'Mantenimiento',
  INSPECTION: 'Inspección',
};


const computeDaysToDeadline = (estimated?: string | null) => {
  if (!estimated) return null;
  const ts = new Date(estimated).getTime();
  if (!Number.isFinite(ts)) return null;
  const diffDays = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const CivilWorkCard: React.FC<{
  item: Partial<CivilWork> & Pick<CivilWork, 'id' | 'project' | 'location' | 'startDate' | 'estimatedEndDate' | 'status' | 'workType' | 'progress'>;
  onView: (id: number) => void;
}> = ({ item, onView }) => {
  const { formatDate } = useIntlFormat();
  const statusInfo = STATUS_CONFIG[item.status];
  const progress = Math.max(0, Math.min(100, Math.round(item.progress ?? 0)));

  const deadlineInfo = useMemo(() => {
    const remaining = computeDaysToDeadline(item.estimatedEndDate);
    if (remaining === null) return { label: 'Sin estimación', delayed: false };
    if (remaining < 0) return { label: `${Math.abs(remaining)} días de retraso`, delayed: true };
    if (remaining === 0) return { label: 'Entrega hoy', delayed: false };
    return { label: `${remaining} días restantes`, delayed: false };
  }, [item.estimatedEndDate]);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.45))]" />
      <div className="relative flex flex-col gap-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <MapPin className="h-4 w-4" /> {item.location}
            </span>
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{item.project}</h3>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">Obra #{item.id}</p>
            </div>
          </div>
          {statusInfo && (
            <span className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] ${statusInfo.badge}`}>
              {statusInfo.icon}
              {statusInfo.label}
            </span>
          )}
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <CalendarDays className="h-4 w-4" /> Inicio
            </p>
            <p className="mt-2 text-slate-700 dark:text-blue-100">{formatDate(item.startDate)}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <CalendarClock className="h-4 w-4" /> Estimada
            </p>
            <p className="mt-2 text-slate-700 dark:text-blue-100">{formatDate(item.estimatedEndDate)}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <Layers className="h-4 w-4" /> Tipo
            </p>
            <p className="mt-2 text-slate-700 dark:text-blue-100">{WORK_TYPE_LABEL[item.workType]}</p>
          </div>
          <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm shadow-sm dark:border-white/10 dark:bg-white/10">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <ClipboardList className="h-4 w-4" /> Seguimiento
            </p>
            <p className={`mt-2 font-semibold ${deadlineInfo.delayed ? 'text-rose-500 dark:text-rose-300' : 'text-slate-700 dark:text-blue-100'}`}>{deadlineInfo.label}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/70 bg-slate-50/80 px-5 py-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Progreso</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{progress}%</p>
            </div>
            <span className="text-xs text-slate-500 dark:text-blue-200/80">Rastrea avances respecto a la meta trimestral.</span>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400"
              style={{ width: `${progress}%` }}
            />
          </div>
        </section>

        <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {deadlineInfo.delayed && (
            <span className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/60 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
              <AlertTriangle className="h-4 w-4" /> Atención requerida
            </span>
          )}
          <button
            type="button"
            onClick={() => onView(item.id)}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            Ver detalle
          </button>
        </footer>
      </div>
    </article>
  );
};

export default CivilWorkCard;
