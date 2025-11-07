import { useEffect, useMemo, useState } from 'react';
import { listGlobalMovements, movementsToCSV } from '../services/mockItMovementsService';
import type { ITMovement, ITMovementType } from '../types';
import { DownloadCloud, Filter } from 'lucide-react';

type Filters = {
  desde?: string;
  hasta?: string;
  tipo?: ITMovementType | 'all';
  q?: string;
};

export default function ITInventoryMovements() {
  const [movs, setMovs] = useState<ITMovement[]>([]);
  const [loading, setLoading] = useState(true);
  // sin estado de error visible; se puede mostrar banner si es necesario
  const [filters, setFilters] = useState<Filters>({ tipo: 'all' });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listGlobalMovements(filters)
      .then(d => { if (mounted) setMovs(d); })
      .catch((e) => { if (mounted) console.warn('Error al cargar movimientos', e); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filters]);

  const tipos = useMemo<ITMovementType[]>(() => ['ALTA','ASIGNACION','DEVOLUCION','REPARACION','BAJA'], []);

  const exportCSV = () => {
    const csv = movementsToCSV(movs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos_it_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2"><Filter className="h-5 w-5" /> Movimientos globales</h2>
        <button type="button" onClick={exportCSV} disabled={!movs.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
          <DownloadCloud className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-slate-900/40">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="desde" className="text-xs font-medium text-slate-600 dark:text-slate-300">Desde</label>
            <input id="desde" type="date" value={filters.desde ? filters.desde.slice(0,10) : ''} onChange={e => setFilters(prev => ({ ...prev, desde: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className="w-full rounded-lg border border-slate-300 bg-white/70 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div className="space-y-1">
            <label htmlFor="hasta" className="text-xs font-medium text-slate-600 dark:text-slate-300">Hasta</label>
            <input id="hasta" type="date" value={filters.hasta ? filters.hasta.slice(0,10) : ''} onChange={e => setFilters(prev => ({ ...prev, hasta: e.target.value ? new Date(e.target.value).toISOString() : undefined }))} className="w-full rounded-lg border border-slate-300 bg-white/70 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
          </div>
          <div className="space-y-1">
            <label htmlFor="tipo" className="text-xs font-medium text-slate-600 dark:text-slate-300">Tipo</label>
            <select id="tipo" value={filters.tipo ?? 'all'} onChange={e => setFilters(prev => ({ ...prev, tipo: e.target.value as ITMovementType | 'all' }))} className="w-full rounded-lg border border-slate-300 bg-white/70 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
              <option value="all">Todos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="q" className="text-xs font-medium text-slate-600 dark:text-slate-300">Buscar</label>
            <input id="q" value={filters.q ?? ''} onChange={e => setFilters(prev => ({ ...prev, q: e.target.value || undefined }))} placeholder="usuario o detalle" className="w-full rounded-lg border border-slate-300 bg-white/70 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
          </div>
        </div>
        <div className="mt-3 text-[11px] text-slate-500">Total: {loading ? '—' : movs.length}</div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 bg-white/80 dark:border-white/10 dark:bg-slate-900/40">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <tr>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Asset ID</th>
              <th className="px-4 py-2">Usuario</th>
              <th className="px-4 py-2">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Cargando…</td></tr>
            )}
            {!loading && movs.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Sin resultados</td></tr>
            )}
            {!loading && movs.map(m => (
              <tr key={`${m.id}-${m.assetId}`} className="border-t border-slate-100/70 dark:border-white/10">
                <td className="px-4 py-2 whitespace-nowrap">{new Date(m.fecha).toLocaleString()}</td>
                <td className="px-4 py-2"><span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">{m.tipo}</span></td>
                <td className="px-4 py-2">{m.assetId}</td>
                <td className="px-4 py-2">{m.usuario}</td>
                <td className="px-4 py-2 max-w-[520px] truncate" title={m.detalle}>{m.detalle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
