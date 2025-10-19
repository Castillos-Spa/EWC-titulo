import React from 'react';
import { CalendarRange, Search } from 'lucide-react';

interface FuelFiltersProps {
  search: string;
  from: string;
  to: string;
  total: number;
  onSearchChange: (value: string) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
}

const FuelFilters: React.FC<FuelFiltersProps> = ({ search, from, to, total, onSearchChange, onFromChange, onToChange }) => (
  <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_rgba(79,70,229,0.1)_55%,_rgba(15,23,42,0)_85%)]" />
    <div className="relative grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2 space-y-1">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.28em] text-slate-500 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
          <CalendarRange className="h-4 w-4" />
          <span>Filtros de análisis</span>
        </span>
        <p className="text-sm text-slate-500 dark:text-blue-200/80">Refina la vista según periodos y vehículos. {total > 0 ? `${total} resultados` : 'Sin coincidencias con la búsqueda actual'}.</p>
      </div>
      <div className="relative lg:col-span-2">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por patente, marca o modelo"
          className="w-full rounded-2xl border border-slate-200 bg-white/80 px-10 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
          aria-label="Buscar vehículos"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
          <span>Desde</span>
          <input
            type="date"
            value={from}
            onChange={(event) => onFromChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
          />
        </label>
        <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
          <span>Hasta</span>
          <input
            type="date"
            value={to}
            onChange={(event) => onToChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner shadow-slate-200/60 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-none dark:focus:border-sky-400 dark:focus:ring-sky-500/30"
          />
        </label>
      </div>
    </div>
  </section>
);

export default FuelFilters;
