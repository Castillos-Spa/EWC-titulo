import React, { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, CalendarDays, ClipboardList, Timer, Layers } from 'lucide-react';
import { CLEANING_TASK_OPTIONS } from './constants';
import type { Aseo } from '../../../types/Aseo';

interface CreateCleaningModalProps {
  onClose: () => void;
  onCreate: (payload: Partial<Aseo>) => Promise<void>;
}

const CreateCleaningModal: React.FC<CreateCleaningModalProps> = ({ onClose, onCreate }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => (submitting ? 'Guardando…' : 'Registrar reporte'), [submitting]);

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

    const date = typeof dateVal === 'string' && dateVal ? new Date(dateVal).toISOString() : new Date().toISOString();
    const timeSpent = typeof timeSpentVal === 'string' && timeSpentVal ? Number(timeSpentVal) : 0;
    const area = typeof areaVal === 'string' ? areaVal.trim() : '';
    const responsibleStaff = typeof responsibleStaffVal === 'string' ? responsibleStaffVal.trim() : '';
    const tasks = fd.getAll('tasks').map(value => (typeof value === 'string' ? value : '')).filter(Boolean);
    const issuesText = typeof issuesVal === 'string' ? issuesVal : '';
    const issues = issuesText ? issuesText.split('\n').map(item => item.trim()).filter(Boolean) : [];
    const observations = typeof observationsVal === 'string' && observationsVal.trim() ? observationsVal.trim() : undefined;
    const status = (typeof statusVal === 'string' ? statusVal : 'PENDING').toUpperCase() as Aseo['status'];

    if (!area || !responsibleStaff) {
      setError('Define el área y el responsable del turno antes de guardar.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const payload: Partial<Aseo> = { date, area, tasks, responsibleStaff, timeSpent, issues, status, observations };
      await onCreate(payload);
      form.reset();
      onClose();
    } catch (err) {
      console.error(err);
      setError('No pudimos registrar el reporte. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.22),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_rgba(15,23,42,0.45))]" />
        <form onSubmit={handleSubmit} className="relative flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Sparkles className="h-4 w-4" /> Nuevo reporte
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Registrar limpieza diaria</h2>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
                Documenta turnos de aseo, tiempos y hallazgos para mantener trazabilidad en el módulo renovado.
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
                    defaultValue={new Date().toISOString().slice(0, 10)}
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
                    placeholder="4.5"
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
                  placeholder="Almacén A · Planta principal"
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
                  placeholder="Nombre del operario"
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </div>
            </label>

            <fieldset className="space-y-3 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-slate-900/40">
              <legend className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tareas completadas</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CLEANING_TASK_OPTIONS.map((task, index) => {
                  const id = `create-task-${index}`;
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
                rows={3}
                placeholder="Describe hallazgos o incidencias (uno por línea)."
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Observaciones</span>
              <textarea
                name="observations"
                rows={3}
                placeholder="Notas adicionales para el equipo o recordatorios."
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Estado del reporte</span>
              <select
                name="status"
                defaultValue="COMPLETED"
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
              Impacto inmediato en el tablero de limpieza.
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
export default CreateCleaningModal;
