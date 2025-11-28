import React, { useMemo } from 'react';
import { Search, Filter, FilterX, Wrench } from 'lucide-react';
import type { MaintenanceStatus, MaintenanceType } from '../context/MaintenanceContext';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';

const STATUS_OPTIONS: Array<{ value: MaintenanceStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'abierta', label: 'Abiertas' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'pendiente_revision', label: 'Pendiente QA' },
  { value: 'completado', label: 'Completadas' },
];

const TYPE_OPTIONS: MaintenanceType[] = ['Preventivo', 'Correctivo', 'Emergencia'];

interface MaintenanceFiltersProps {
  search: string;
  status: MaintenanceStatus | 'all';
  type: MaintenanceType | 'all';
  total: number;
  records: OrdenTrabajo[];
  onSearch: (value: string) => void;
  onStatusChange: (value: MaintenanceStatus | 'all') => void;
  onTypeChange: (value: MaintenanceType | 'all') => void;
  onReset: () => void;
}

const MaintenanceFilters: React.FC<MaintenanceFiltersProps> = ({
  search,
  status,
  type,
  total,
  records,
  onSearch,
  onStatusChange,
  onTypeChange,
  onReset,
}) => {
  const hasActiveFilters = search.trim() !== '' || status !== 'all' || type !== 'all';

  const statusBadges = useMemo(() => {
    return STATUS_OPTIONS.filter(option => option.value !== 'all').map(option => {
      const count = records.filter(record => record.estado === option.value).length;
      return {
        ...option,
        count,
      };
    });
  }, [records]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(165,243,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.45))]" />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
        <div className="space-y-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
            <Wrench className="h-4 w-4" />
            <span>Panel de filtros</span>
          </span>
          <p className="text-sm text-slate-500 dark:text-blue-200/80">
            Ajusta la búsqueda para aislar órdenes por estado, tipología o referencia del vehículo.
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
            placeholder="Busca por vehículo, descripción o técnico"
            className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500"
          />
        </div>

        <select
          value={status}
          onChange={event => onStatusChange(event.target.value as MaintenanceStatus | 'all')}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={type}
          onChange={event => onTypeChange(event.target.value as MaintenanceType | 'all')}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          <option value="all">Todas las tipologías</option>
          {TYPE_OPTIONS.map(option => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
            {total} órdenes encontradas
          </p>
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
              <Filter className="h-4 w-4" /> Visor refinado
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MaintenanceFilters;
