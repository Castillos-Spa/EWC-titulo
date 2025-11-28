import React, { useCallback, useEffect, useMemo } from 'react';
import { X, MapPin, CalendarDays, CalendarClock, Layers, Gauge, Users2, ClipboardList, Package, AlertTriangle, CheckCircle2, Paperclip, ExternalLink, ImageOff } from 'lucide-react';
import type { CivilWork, CivilWorkTask } from '../../../types/CivilWork';
import { useCivilWorks } from '../hooks/useCivilWorks';
import { useIntlFormat } from '../../../app/intl/format';


const computeTimeline = (estimated?: string | null) => {
  if (!estimated) return 'Sin estimación';
  const ts = new Date(estimated).getTime();
  if (!Number.isFinite(ts)) return 'Sin estimación';
  const days = Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)} días de retraso`;
  if (days === 0) return 'Entrega hoy';
  return `${days} días restantes`;
};

export const CivilWorkDetailModal: React.FC<{
  report: CivilWork;
  onClose: () => void;
  onEdit?: (r: CivilWork) => void;
}> = ({ report, onClose, onEdit }) => {
  const { updateTasks, loadPhotos } = useCivilWorks();
  const { formatDate } = useIntlFormat();

  const handleToggle = useCallback(async (index: number) => {
    const list: CivilWorkTask[] = Array.isArray(report.tasks)
      ? report.tasks.map((task, idx) => ({ ...task, completed: idx === index ? !task.completed : task.completed }))
      : [];
    await updateTasks(report.id, list);
  }, [report, updateTasks]);

  const staff = Array.isArray(report.responsibleStaffUsernames) ? report.responsibleStaffUsernames : [];
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const materials = Array.isArray(report.materialsUsed) ? report.materialsUsed : [];
  const photos = useMemo(() => (Array.isArray(report.photos) ? report.photos.filter((url): url is string => typeof url === 'string' && url.trim().length > 0) : []), [report.photos]);
  const timeline = useMemo(() => computeTimeline(report.estimatedEndDate), [report.estimatedEndDate]);

  useEffect(() => {
    if (!photos.length) {
      void loadPhotos(report.id);
    }
  }, [photos.length, loadPhotos, report.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.24),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.26),_rgba(15,23,42,0.45))]" />
        <div className="relative flex max-h-[90vh] flex-col">
          <header className="flex flex-wrap items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <MapPin className="h-4 w-4" /> {report.location}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{report.project}</h2>
              <p className="max-w-2xl text-sm text-slate-500 dark:text-blue-200/80">
                Estado en tiempo real de la intervención, con responsables, materiales y tareas sincronizadas en el nuevo módulo translúcido.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
                  <Layers className="h-4 w-4" /> {report.workType}
                </span>
                <span className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" /> {report.status.replace('_', ' ')}
                </span>
              </div>
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
            <section className="grid gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarDays className="h-4 w-4" /> Inicio
                </p>
                <p className="mt-3 text-slate-700 dark:text-blue-100">{formatDate(report.startDate)}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarClock className="h-4 w-4" /> Estimada
                </p>
                <p className="mt-3 text-slate-700 dark:text-blue-100">{formatDate(report.estimatedEndDate)}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarClock className="h-4 w-4" /> Real
                </p>
                <p className="mt-3 text-slate-700 dark:text-blue-100">{report.actualEndDate ? formatDate(report.actualEndDate) : 'Aún en progreso'}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <Gauge className="h-4 w-4" /> Panorama
                </p>
                <p className="mt-3 font-semibold text-slate-700 dark:text-blue-100">{timeline}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/70 bg-slate-50/80 px-6 py-5 shadow-inner shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/40">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Avance consolidado</p>
                  <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{report.progress}%</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80">
                  <ClipboardList className="h-4 w-4" /> Tareas vinculadas: {report.tasks.length}
                </span>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-400"
                  style={{ width: `${Math.max(0, Math.min(100, report.progress ?? 0))}%` }}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                <Users2 className="h-4 w-4" /> Personal responsable
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {staff.length === 0 && <span className="text-xs text-slate-500 dark:text-blue-200/70">Sin responsables asignados.</span>}
                {staff.map(username => (
                  <span
                    key={`${report.id}-${username}`}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                  >
                    {username}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                <ClipboardList className="h-4 w-4" /> Tareas vinculadas
              </p>
              <div className="mt-3 space-y-2">
                {report.tasks.map((task, index) => (
                  <label
                    key={`${report.id}-task-${task.name}-${index}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => { void handleToggle(index); }}
                      className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 dark:border-white/20 dark:bg-white/10"
                    />
                    <span className={task.completed ? 'line-through opacity-70' : ''}>{task.name}</span>
                  </label>
                ))}
                {report.tasks.length === 0 && (
                  <span className="text-xs text-slate-500 dark:text-blue-200/70">No hay tareas registradas.</span>
                )}
              </div>
            </section>

            {materials.length > 0 && (
              <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <Package className="h-4 w-4" /> Materiales utilizados
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {materials.map((material, index) => (
                    <div
                      key={`${report.id}-material-${index}`}
                      className="rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                    >
                      {material}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {issues.length > 0 && (
              <section className="rounded-3xl border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-rose-700 shadow-sm shadow-rose-200/40 backdrop-blur dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em]">
                  <AlertTriangle className="h-4 w-4" /> Incidencias detectadas
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {issues.map((issue, index) => (
                    <li key={`${report.id}-issue-${index}`} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {photos.length > 0 && (
              <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <Paperclip className="h-4 w-4" /> Evidencia fotográfica
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {photos.map((photo, index) => (
                    <a
                      key={`${report.id}-photo-${index}`}
                      href={photo}
                      target="_blank"
                      rel="noreferrer"
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-white/10 dark:bg-white/10"
                    >
                      <img
                        src={photo}
                        alt={`Registro fotográfico ${index + 1}`}
                        className="h-36 w-full object-cover transition duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="flex h-36 w-full items-center justify-center bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-400" style={{ display: 'none' }}>
                        <ImageOff className="h-6 w-6" />
                      </div>
                      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-900/80 to-transparent px-3 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100">
                        Abrir en pestaña
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {report.observations && (
              <section className="rounded-3xl border border-white/60 bg-white/80 px-5 py-4 shadow-inner shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/40">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Observaciones</p>
                <p className="mt-3 leading-relaxed text-slate-600 dark:text-blue-200/80">{report.observations}</p>
              </section>
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/60 bg-white/70 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Visualización alineada al nuevo hub de operaciones.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              >
                Cerrar
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(report)}
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
                >
                  Editar obra
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CivilWorkDetailModal;
