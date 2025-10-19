import React from 'react';
import { Search, FilterX } from 'lucide-react';

type ScopeFilter = 'all' | 'global' | 'areas';

interface NotificationFiltersProps {
  search: string;
  scope: ScopeFilter;
  area: string;
  areaOptions: string[];
  total: number;
  onSearch: (value: string) => void;
  onScopeChange: (value: ScopeFilter) => void;
  onAreaChange: (value: string) => void;
  onReset: () => void;
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  search,
  scope,
  area,
  areaOptions,
  total,
  onSearch,
  onScopeChange,
  onAreaChange,
  onReset,
}) => {
  const hasActiveFilters = search.trim() !== '' || scope !== 'all' || area !== 'all';

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.16),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.4))]" />
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
            Filtros activos
          </span>
          <p className="text-sm text-slate-500 dark:text-blue-200/80">Refina las comunicaciones por texto, ámbito o áreas para localizar avisos relevantes.</p>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Buscar por título o mensaje"
            className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500"
          />
        </div>

        <select
          value={scope}
          onChange={(event) => onScopeChange(event.target.value as ScopeFilter)}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          <option value="all">Todos los ámbitos</option>
          <option value="global">Sólo globales</option>
          <option value="areas">Dirigidas por áreas</option>
        </select>

        <select
          value={area}
          onChange={(event) => onAreaChange(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
        >
          <option value="all">Todas las áreas</option>
          {areaOptions.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
            {total} notificaciones encontradas
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              <FilterX className="h-4 w-4" /> Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default NotificationFilters;
