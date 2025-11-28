import type { InventoryFilters } from '../types';

interface Props {
  filters: InventoryFilters;
  categorias: string[];
  onChange: (next: InventoryFilters) => void;
  onReset: () => void;
  total: number;
}

function InventoryFilters({ filters, categorias, onChange, onReset, total }: Readonly<Props>) {
  // no React import needed with automatic JSX runtime
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col">
          <label htmlFor="inv-search" className="text-xs font-medium text-slate-500 dark:text-blue-100">Buscar</label>
          <input
            id="inv-search"
            type="text"
            value={filters.search ?? ''}
            onChange={e => onChange({ ...filters, search: e.target.value })}
            placeholder="SKU, nombre, ubicación…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="inv-category" className="text-xs font-medium text-slate-500 dark:text-blue-100">Categoría</label>
          <select
            id="inv-category"
            value={filters.categoria ?? ''}
            onChange={e => onChange({ ...filters, categoria: e.target.value || undefined })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
          >
            <option value="">Todas</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="inv-status" className="text-xs font-medium text-slate-500 dark:text-blue-100">Estado</label>
          <select
            id="inv-status"
            value={filters.estado ?? 'all'}
            onChange={e => {
              const val = e.target.value as 'all' | 'ACTIVO' | 'INACTIVO';
              onChange({ ...filters, estado: val });
            }}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none dark:border-white/10 dark:bg-slate-900/40 dark:text-white"
          >
            <option value="all">Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-600 dark:text-blue-100/70">{total} ítem(s)</span>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10"
          >
            Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryFilters;
