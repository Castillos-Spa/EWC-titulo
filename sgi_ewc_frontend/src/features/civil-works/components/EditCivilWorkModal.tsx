import React, { useEffect, useMemo, useState } from 'react';
import { X, Hammer, CalendarDays, CalendarClock, ClipboardList, Gauge, AlertTriangle } from 'lucide-react';
import type { CivilWork, CivilWorkStatus } from '../../../types/CivilWork';
import { useCivilWorks } from '../hooks/useCivilWorks';

const STATUS: Array<{ value: CivilWorkStatus; label: string }> = [
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'ON_HOLD', label: 'En pausa' },
  { value: 'COMPLETED', label: 'Completado' },
];

const isoToDateInput = (iso?: string | null) => {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export const EditCivilWorkModal: React.FC<{ report: CivilWork; onClose: () => void }> = ({ report, onClose }) => {
  const { update } = useCivilWorks();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(() => (submitting ? 'Guardando…' : 'Actualizar'), [submitting]);

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

    const startDateInput = getStr('startDate');
    const estimatedEndDateInput = getStr('estimatedEndDate');
    const actualEndDateInput = getStr('actualEndDate');
    const status = (getStr('status', report.status) as CivilWorkStatus) ?? report.status;
    const observations = getStr('observations', report.observations ?? '');
    const progressStr = getStr('progress', String(report.progress));
    const progress = Number(progressStr);

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setError('El progreso debe estar entre 0 y 100.');
      return;
    }

    if (startDateInput && estimatedEndDateInput && new Date(estimatedEndDateInput) < new Date(startDateInput)) {
      setError('La fecha estimada debe ser posterior al inicio.');
      return;
    }

    if (actualEndDateInput && startDateInput && new Date(actualEndDateInput) < new Date(startDateInput)) {
      setError('El término real no puede ser anterior al inicio.');
      return;
    }

    const payload: Partial<CivilWork> = {
      startDate: startDateInput ? new Date(startDateInput).toISOString() : report.startDate,
      estimatedEndDate: estimatedEndDateInput ? new Date(estimatedEndDateInput).toISOString() : report.estimatedEndDate,
      actualEndDate: actualEndDateInput ? new Date(actualEndDateInput).toISOString() : null,
      status,
      observations,
      progress,
    };

    try {
      setSubmitting(true);
      setError(null);
      await update(report.id, payload);
      onClose();
    } catch (err) {
      console.error(err);
      setError('No pudimos actualizar la obra. Vuelve a intentar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.22),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.28),_rgba(15,23,42,0.45))]" />
        <form onSubmit={onSubmit} className="relative flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <Hammer className="h-4 w-4" /> Ajustar obra #{report.id}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Actualiza fechas, progreso y hallazgos</h2>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
                Mantén sincronizado al equipo ajustando hitos, porcentaje de avance y observaciones desde la nueva experiencia translúcida.
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
            <div className="grid gap-4 md:grid-cols-3">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarDays className="h-4 w-4" /> Inicio
                </span>
                <input
                  type="date"
                  name="startDate"
                  defaultValue={isoToDateInput(report.startDate)}
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
                  defaultValue={isoToDateInput(report.estimatedEndDate)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <CalendarClock className="h-4 w-4" /> Término real
                </span>
                <input
                  type="date"
                  name="actualEndDate"
                  defaultValue={isoToDateInput(report.actualEndDate)}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                  <ClipboardList className="h-4 w-4" /> Estado
                </span>
                <select
                  name="status"
                  defaultValue={report.status}
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
                  <Gauge className="h-4 w-4" /> Progreso (%)
                </span>
                <input
                  type="number"
                  name="progress"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={report.progress}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                <AlertTriangle className="h-4 w-4" /> Observaciones
              </span>
              <textarea
                name="observations"
                rows={4}
                defaultValue={report.observations ?? ''}
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
              Ajusta avances para mantener la trazabilidad del módulo.
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

export default EditCivilWorkModal;
