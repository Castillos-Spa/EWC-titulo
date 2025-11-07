import type { ITFilters, ITAssetCategory, ITAssetStatus } from '../types';

interface Props {
  filters: ITFilters;
  categorias: ITAssetCategory[];
  onChange: (next: ITFilters) => void;
  onReset: () => void;
  total: number;
}

export default function ITInventoryFilters({ filters, categorias, onChange, onReset, total }: Readonly<Props>) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col">
          <label htmlFor="it-search" className="text-xs font-medium text-slate-500 dark:text-blue-100">Buscar</label>
          <input id="it-search" type="text" value={filters.search ?? ''} onChange={e => onChange({ ...filters, search: e.target.value })} placeholder="assetTag, serie, nombre…" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none dark:border-white/10 dark:bg-slate-900/40 dark:text-white" />
        </div>
        <div className="flex flex-col">
          <label htmlFor="it-cat" className="text-xs font-medium text-slate-500 dark:text-blue-100">Categoría</label>
          <select id="it-cat" value={filters.categoria ?? 'all'} onChange={e => onChange({ ...filters, categoria: e.target.value === 'all' ? 'all' : e.target.value as ITAssetCategory })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none dark:border-white/10 dark:bg-slate-900/40 dark:text-white">
            <option value="all">Todas</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col">
          <label htmlFor="it-status" className="text-xs font-medium text-slate-500 dark:text-blue-100">Estado</label>
          <select id="it-status" value={filters.estado ?? 'all'} onChange={e => onChange({ ...filters, estado: e.target.value === 'all' ? 'all' : e.target.value as ITAssetStatus })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-sky-400 focus:outline-none dark:border-white/10 dark:bg-slate-900/40 dark:text-white">
            <option value="all">Todos</option>
            <option value="EN_STOCK">En stock</option>
            <option value="ASIGNADO">Asignado</option>
            <option value="EN_REPARACION">En reparación</option>
            <option value="RETIRADO">Retirado</option>
          </select>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-600 dark:text-blue-100/70">{total} activo(s)</span>
          <button type="button" onClick={onReset} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Reiniciar</button>
        </div>
      </div>
    </div>
  );
}
