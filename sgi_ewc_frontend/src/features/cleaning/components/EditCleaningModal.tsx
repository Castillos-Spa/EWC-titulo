import React, { useEffect, useMemo, useState } from 'react';
import { X, CalendarDays, ClipboardList, Timer, Layers, Wrench } from 'lucide-react';
import type { Aseo } from '../../../types/Aseo';
import { CLEANING_TASK_OPTIONS } from './constants';

const isoToDateInput = (iso?: string) => {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return '';
  }
};

interface EditCleaningModalProps {
  report: Aseo;
  onClose: () => void;
  onUpdate: (id: string, payload: Partial<Aseo>) => Promise<void>;
}

const EditCleaningModal: React.FC<EditCleaningModalProps> = ({ report, onClose, onUpdate }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => (submitting ? 'Guardando…' : 'Actualizar reporte'), [submitting]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const fd = new FormData(form);

    const dateVal = fd.get('date');
    const timeSpentVal = fd.get('timeSpent');
    const areaVal = fd.get('area');
    const responsibleStaffVal = fd.get('responsibleStaff');
    const issuesVal = fd.get('issues');
    const observationsVal = fd.get('observations');
    const statusVal = fd.get('status');

    const date = typeof dateVal === 'string' && dateVal ? new Date(dateVal).toISOString() : report.date;
    const timeSpent = typeof timeSpentVal === 'string' && timeSpentVal ? Number(timeSpentVal) : report.timeSpent;
    const area = typeof areaVal === 'string' ? areaVal.trim() : report.area;
    const responsibleStaff = typeof responsibleStaffVal === 'string' ? responsibleStaffVal.trim() : report.responsibleStaff;
    const tasks = fd.getAll('tasks').map(value => (typeof value === 'string' ? value : '')).filter(Boolean);
    const issuesText = typeof issuesVal === 'string' ? issuesVal : '';
    const issues = issuesText ? issuesText.split('\n').map(item => item.trim()).filter(Boolean) : report.issues;
    const observations = typeof observationsVal === 'string' && observationsVal.trim() ? observationsVal.trim() : report.observations;
    const status = (typeof statusVal === 'string' ? statusVal : report.status).toUpperCase() as Aseo['status'];

    if (!area || !responsibleStaff) {
      setError('Mantén actualizados el área y el responsable antes de guardar.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload: Partial<Aseo> = { date, area, tasks, responsibleStaff, timeSpent, issues, status, observations };
      await onUpdate(report.id, payload);
      onClose();
    } catch (err) {
      console.error(err);
      setError('No pudimos actualizar el reporte. Intenta más tarde.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/95 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.26),_rgba(15,23,42,0.45))]" />
        <form onSubmit={handleSubmit} className="relative flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Wrench className="h-4 w-4" /> Editar reporte #{report.id}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Ajustar intervención</h2>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
                Actualiza datos del turno, tareas y hallazgos manteniendo coherencia con el nuevo tablero translúcido.
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

          <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-8 pb-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Fecha</span>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                  <input
                    type="date"
                    name="date"
                    defaultValue={isoToDateInput(report.date)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Horas dedicadas</span>
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                  <input
                    type="number"
                    step="0.5"
                    name="timeSpent"
                    defaultValue={String(report.timeSpent)}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Área intervenida</span>
              <div className="relative">
                <Layers className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                <input
                  type="text"
                  name="area"
                  defaultValue={report.area}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Responsable</span>
              <div className="relative">
                <ClipboardList className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                <input
                  type="text"
                  name="responsibleStaff"
                  defaultValue={report.responsibleStaff}
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
            </label>

            <fieldset className="space-y-3 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/40">
              <legend className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tareas completadas</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CLEANING_TASK_OPTIONS.map((task, index) => {
                  const id = `edit-task-${index}`;
                  return (
                    <label
                      key={task}
                      htmlFor={id}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                    >
                      <input
                        id={id}
                        name="tasks"
                        value={task}
                        type="checkbox"
                        defaultChecked={report.tasks.includes(task)}
                        className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400 dark:border-white/20 dark:bg-white/10"
                      />
                      <span>{task}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Problemas encontrados</span>
              <textarea
                name="issues"
                defaultValue={report.issues.join('\n')}
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Observaciones</span>
              <textarea
                name="observations"
                defaultValue={report.observations ?? ''}
                rows={3}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Estado del reporte</span>
              <select
                name="status"
                defaultValue={report.status}
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              >
                <option value="COMPLETED">Completado</option>
                <option value="PARTIAL">Parcial</option>
                <option value="PENDING">Pendiente</option>
              </select>
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
                {error}
              </div>
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/60 bg-white/70 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              Los cambios se reflejan de inmediato en el tablero.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting}
              >
                {submitLabel}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default EditCleaningModal;
