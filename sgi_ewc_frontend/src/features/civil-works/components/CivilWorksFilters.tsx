import React, { useMemo } from 'react';
import { Search, Filter, FilterX, CalendarRange, Building2, Layers } from 'lucide-react';
import type { CivilWork, CivilWorkStatus } from '../../../types/CivilWork';

interface CivilWorksFiltersProps {
  items: Partial<CivilWork>[];
  search: string;
  status: CivilWorkStatus | 'ALL';
  from: string;
  to: string;
  total: number;
  onSearch: (value: string) => void;
  onStatusChange: (value: CivilWorkStatus | 'ALL') => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: Array<{ value: CivilWorkStatus | 'ALL'; label: string }> = [
  { value: 'ALL', label: 'Todos los estados' },
  { value: 'IN_PROGRESS', label: 'En progreso' },
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'ON_HOLD', label: 'En pausa' },
  { value: 'COMPLETED', label: 'Completado' },
];

const CivilWorksFilters: React.FC<CivilWorksFiltersProps> = ({
  items,
  search,
  status,
  from,
  to,
  total,
  onSearch,
  onStatusChange,
  onFromChange,
  onToChange,
  onReset,
}) => {
  const hasActiveFilters = search.trim() !== '' || status !== 'ALL' || from !== '' || to !== '';

  const statusBadges = useMemo(() => {
    // Expose the state mix so the PM team can read at a glance how projects are distributed.
    return STATUS_OPTIONS.filter(option => option.value !== 'ALL').map(option => {
      const count = items.filter(item => item.status === option.value).length;
      return { ...option, count };
    });
  }, [items]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.45))]" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_auto_auto] lg:items-end">
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
            <Building2 className="h-4 w-4" /> Filtros de obras
          </span>
          <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
            Refina la cartera por estado, fechas y palabras clave. El panel resume el mix actual para priorizar supervisiones y entregas.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {statusBadges.map(badge => (
              <span
                key={badge.value}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:text-blue-100 ${
                  status === badge.value
                    ? 'border border-sky-300 bg-sky-100/80 dark:border-sky-500/40 dark:bg-sky-500/20'
                    : 'border border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/10'
                }`}
              >
                {badge.label}
                <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[0.65rem] font-bold dark:bg-white/10">
                  {badge.count}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
          <input
            value={search}
            onChange={event => onSearch(event.target.value)}
            placeholder="Busca por proyecto, ubicación o responsable"
            className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </div>

        <select
          value={status}
          onChange={event => onStatusChange(event.target.value as CivilWorkStatus | 'ALL')}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="grid gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-4 shadow-sm dark:border-white/10 dark:bg-white/10 lg:col-span-3 lg:grid-cols-[repeat(2,minmax(0,1fr))_auto] lg:items-center">
          <label className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <CalendarRange className="h-4 w-4" /> Desde
            </span>
            <input
              type="date"
              value={from}
              onChange={event => onFromChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <CalendarRange className="h-4 w-4" /> Hasta
            </span>
            <input
              type="date"
              value={to}
              onChange={event => onToChange(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
            />
          </label>
          <div className="flex flex-col items-start gap-2 text-xs text-slate-500 dark:text-blue-200/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 font-semibold uppercase tracking-[0.28em] shadow-sm dark:border-white/10 dark:bg-white/10">
              <Layers className="h-4 w-4" /> Ventana temporal
            </span>
            <span>Ajusta fechas para analizar hitos semanales o cierres de mes.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{total} obras visibles</p>
          <div className="flex flex-wrap items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              >
                <FilterX className="h-4 w-4" /> Limpiar filtros
              </button>
            )}
            <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80">
              <Filter className="h-4 w-4" /> Vista refinada
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CivilWorksFilters;
