import React, { useMemo } from 'react';
import { CalendarDays, MapPin, Timer, AlertTriangle, CheckCircle2, ClipboardList } from 'lucide-react';
import type { Aseo, CleaningStatus } from '../../../types/Aseo';

const formatDateTime = (iso?: string) => {
  try {
    const date = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return iso ?? '';
  }
};

const STATUS_CONFIG: Record<CleaningStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  COMPLETED: {
    label: 'Completado',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  PARTIAL: {
    label: 'Parcial',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  PENDING: {
    label: 'Pendiente',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
    icon: <Timer className="h-4 w-4" />,
  },
};

interface CleaningCardProps {
  report: Aseo;
  onView: (report: Aseo) => void;
  onEdit: (report: Aseo) => void;
}

const CleaningCard: React.FC<CleaningCardProps> = ({ report, onView, onEdit }) => {
  const statusConfig = STATUS_CONFIG[report.status];

  const uniqueTasks = useMemo(() => Array.from(new Set(report.tasks)), [report.tasks]);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_rgba(15,23,42,0.45))]" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/25 dark:text-sky-100">
                <MapPin className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{report.area}</h3>
                <p className="text-sm text-slate-500 dark:text-blue-200/70">Reporte #{report.id}</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusConfig.badge}`}>
              {statusConfig.icon}
              {statusConfig.label}
            </span>
          </div>

          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Fecha</p>
              <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                <CalendarDays className="h-4 w-4" />
                <span>{formatDateTime(report.date)}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Tiempo invertido</p>
              <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                <Timer className="h-4 w-4" />
                <span>{report.timeSpent}h</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Responsable</p>
              <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                <ClipboardList className="h-4 w-4" />
                <span>{report.responsibleStaff}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-600 dark:text-blue-200/80">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Tareas completadas</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueTasks.length > 0 ? (
                  uniqueTasks.map(task => (
                    <span
                      key={`${report.id}-${task}`}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {task}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 dark:text-blue-200/70">Sin tareas registradas.</span>
                )}
              </div>
            </div>

            {report.issues.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Problemas encontrados</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-blue-200/80">
                  {report.issues.map(issue => (
                    <li key={`${report.id}-${issue}`} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.observations && (
              <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-inner shadow-slate-200/30 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/30">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Observaciones</p>
                <p className="mt-2 leading-relaxed text-slate-600 dark:text-blue-200/80">{report.observations}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:w-48">
          <button
            type="button"
            onClick={() => onView(report)}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
          >
            Ver detalles
          </button>
          <button
            type="button"
            onClick={() => onEdit(report)}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            Editar reporte
          </button>
        </div>
      </div>
    </article>
  );
};

export default CleaningCard;
