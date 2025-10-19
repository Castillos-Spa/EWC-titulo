import React from 'react';
import { X, MapPin, CalendarDays, ClipboardList, Timer, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { Aseo } from '../../../types/Aseo';

const formatDateTime = (iso?: string) => {
  try {
    const date = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
  } catch {
    return iso ?? '';
  }
};

interface CleaningDetailModalProps {
  report: Aseo;
  onClose: () => void;
  onEdit: (report: Aseo) => void;
}

const CleaningDetailModal: React.FC<CleaningDetailModalProps> = ({ report, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.24),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_rgba(15,23,42,0.45))]" />
        <div className="relative flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <MapPin className="h-4 w-4" /> {report.area}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Reporte #{report.id}</h2>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
                Revisa la intervención completa, tareas ejecutadas y hallazgos para coordinar acciones correctivas.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-8 pb-8 text-sm text-slate-600 dark:text-blue-200/80">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Fecha y hora</p>
                <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                  <CalendarDays className="h-4 w-4" />
                  <span>{formatDateTime(report.date)}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Responsable</p>
                <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                  <ClipboardList className="h-4 w-4" />
                  <span>{report.responsibleStaff}</span>
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tiempo invertido</p>
                <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                  <Timer className="h-4 w-4" />
                  <span>{report.timeSpent}h</span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tareas ejecutadas</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {report.tasks.map(task => (
                    <span key={task} className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/25 dark:text-emerald-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {task}
                    </span>
                  ))}
                  {report.tasks.length === 0 && (
                    <span className="text-xs text-slate-500 dark:text-blue-200/70">Sin tareas registradas.</span>
                  )}
                </div>
              </div>
            </section>

            {report.issues.length > 0 && (
              <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Problemas detectados
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-blue-200/80">
                  {report.issues.map(issue => (
                    <li key={issue} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {report.observations && (
              <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-inner shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/40">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Observaciones</p>
                <p className="mt-2 leading-relaxed text-slate-600 dark:text-blue-200/80">{report.observations}</p>
              </section>
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/60 bg-white/70 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-end">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => onEdit(report)}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
              >
                Editar reporte
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CleaningDetailModal;
