import React, { useEffect, useMemo, useState } from 'react';
import { X, Sparkles, MapPin, CalendarDays, CalendarClock, ClipboardList, Layers, Package, AlertTriangle } from 'lucide-react';
import type { CivilWorkType, CivilWorkStatus, CreateCivilWorkPayload } from '../../../types/CivilWork';
import { useCivilWorks } from '../hooks/useCivilWorks';

const WORK_TYPES: Array<{ value: CivilWorkType; label: string }> = [
  { value: 'CONSTRUCTION', label: 'Construcción' },
  { value: 'REPAIR', label: 'Reparación' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'INSPECTION', label: 'Inspección' },
];

const STATUS: Array<{ value: CivilWorkStatus; label: string }> = [
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'ON_HOLD', label: 'En pausa' },
  { value: 'COMPLETED', label: 'Completado' },
];

export const CreateCivilWorkModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { create } = useCivilWorks();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => (submitting ? 'Guardando…' : 'Crear proyecto'), [submitting]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [onClose]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const form = event.currentTarget;
    const fd = new FormData(form);

    const getStr = (name: string, fallback = '') => {
      const value = fd.get(name);
      return typeof value === 'string' ? value : fallback;
    };

    const project = getStr('project').trim();
    const location = getStr('location').trim();
    const startDateInput = getStr('startDate');
    const estimatedEndDateInput = getStr('estimatedEndDate');
    const workType = (getStr('workType', 'CONSTRUCTION') as CivilWorkType) ?? 'CONSTRUCTION';
    const status = (getStr('status', 'IN_PROGRESS') as CivilWorkStatus) ?? 'IN_PROGRESS';
    const staffText = getStr('responsibleStaffUsernames');
    const tasksText = getStr('tasks');
    const issuesText = getStr('issues');
    const materialsText = getStr('materialsUsed');
    const observationsText = getStr('observations');

    if (!project || !location) {
      setError('Define el nombre del proyecto y su ubicación antes de continuar.');
      return;
    }

    const startDate = startDateInput ? new Date(startDateInput).toISOString() : new Date().toISOString();
    const estimatedEndDate = estimatedEndDateInput ? new Date(estimatedEndDateInput).toISOString() : startDate;

    if (startDateInput && estimatedEndDateInput && new Date(estimatedEndDateInput) < new Date(startDateInput)) {
      setError('La fecha estimada no puede ser anterior al inicio. Ajusta la planificación.');
      return;
    }

    const responsibleStaffUsernames = staffText
      ? staffText.split(',').map(value => value.trim()).filter(Boolean)
      : [];
    const tasks = tasksText
      ? tasksText.split(',').map(value => value.trim()).filter(Boolean).map(name => ({ name, completed: false }))
      : [];
    const issues = issuesText
      ? issuesText.split('\n').map(value => value.trim()).filter(Boolean)
      : [];
    const materialsUsed = materialsText
      ? materialsText.split('\n').map(value => value.trim()).filter(Boolean)
      : [];
    const observations = observationsText.trim() ? observationsText.trim() : undefined;

    const payload: CreateCivilWorkPayload = {
      project,
      location,
      startDate,
      estimatedEndDate,
      workType,
      tasks,
      progress: 0,
      status,
      observations,
      issues,
      photos: [],
      responsibleStaffUsernames,
      materialsUsed,
    };

    try {
      setSubmitting(true);
      setError(null);
      await create(payload);
      form.reset();
      onClose();
    } catch (err) {
      console.error(err);
      setError('No pudimos registrar el proyecto. Revisa la información e inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.22),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_rgba(15,23,42,0.45))]" />
        <form onSubmit={onSubmit} className="relative flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Sparkles className="h-4 w-4" /> Nueva obra civil
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Planifica el próximo hito constructivo</h2>
              <p className="max-w-2xl text-sm text-slate-500 dark:text-blue-200/80">
                Organiza la intervención desde el inicio. Define responsables, tareas y materiales para sincronizar al equipo en el entorno translúcido actualizado.
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
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <MapPin className="h-4 w-4" /> Proyecto
                </span>
                <input
                  name="project"
                  placeholder="Centro logístico Norte"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <MapPin className="h-4 w-4" /> Ubicación
                </span>
                <input
                  name="location"
                  placeholder="Nave 3 · Parque Industrial"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarDays className="h-4 w-4" /> Inicio
                </span>
                <input
                  type="date"
                  name="startDate"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarClock className="h-4 w-4" /> Término estimado
                </span>
                <input
                  type="date"
                  name="estimatedEndDate"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <Layers className="h-4 w-4" /> Tipo de obra
                </span>
                <select
                  name="workType"
                  defaultValue="CONSTRUCTION"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {WORK_TYPES.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <ClipboardList className="h-4 w-4" /> Estado inicial
                </span>
                <select
                  name="status"
                  defaultValue="IN_PROGRESS"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {STATUS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <ClipboardList className="h-4 w-4" /> Responsables (separar por coma)
                </span>
                <input
                  name="responsibleStaffUsernames"
                  placeholder="jtejada, msandoval"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                <ClipboardList className="h-4 w-4" /> Tareas (separadas por coma)
              </span>
              <input
                name="tasks"
                placeholder="Excavación, Nivelación, Hormigonado"
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <AlertTriangle className="h-4 w-4" /> Riesgos o incidencias
                </span>
                <textarea
                  name="issues"
                  rows={4}
                  placeholder="Describe incidentes detectados (uno por línea)."
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <Package className="h-4 w-4" /> Materiales (uno por línea)
                </span>
                <textarea
                  name="materialsUsed"
                  rows={4}
                  placeholder="Cemento H°30\nMalla ACMA\nAditivo impermeabilizante"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                <ClipboardList className="h-4 w-4" /> Observaciones
              </span>
              <textarea
                name="observations"
                rows={4}
                placeholder="Notas para la próxima coordinación o visitas de obra."
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            {error && (
              <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
                {error}
              </div>
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/60 bg-white/70 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              Impacta el tablero de obras civiles actualizado.
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

export default CreateCivilWorkModal;
