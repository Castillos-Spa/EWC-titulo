import React, { useState, useMemo } from 'react';
import type { TransportRoute } from '../context/RouteContext';
import { useRouteContext } from '../context/useRouteContext';
import { Pencil, Power, Download, Plus, SlidersHorizontal, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import ReactDOM from 'react-dom';

interface RouteListProps {
  onCreate?: () => void;
}

const RouteList: React.FC<RouteListProps> = ({ onCreate }) => {
  const { routes, toggleActive, loading, error } = useRouteContext();
  const [editTarget, setEditTarget] = useState<TransportRoute | null>(null);
  const [query, setQuery] = useState('');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('');
  const [onlyActive, setOnlyActive] = useState(false);
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    return routes.filter(r => {
      if (query) {
        const q = query.toLowerCase();
        if (!(
          r.code.toLowerCase().includes(q) ||
          r.origin.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q)
        )) return false;
      }
      if (frequencyFilter && r.frequency !== frequencyFilter) return false;
      if (onlyActive && !r.active) return false;
      return true;
    });
  }, [routes, query, frequencyFilter, onlyActive]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { field, dir } = sort;
    const copy = [...filtered];
    copy.sort((a,b) => {
      type Fields = keyof TransportRoute;
      const f = field as Fields;
      const av = a[f] as unknown;
      const bv = b[f] as unknown;
      if (av instanceof Date && bv instanceof Date) {
        return dir === 'asc' ? av.getTime() - bv.getTime() : bv.getTime() - av.getTime();
      }
      const norm = (v: unknown): string | number => {
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 1 : 0;
        return String(v);
      };
      const na = norm(av);
      const nb = norm(bv);
      if (na === nb) return 0;
      if (na > nb) return dir === 'asc' ? 1 : -1;
      return dir === 'asc' ? -1 : 1;
    });
    return copy;
  }, [filtered, sort]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));

  const toggleSort = (field: string) => {
    setPage(1);
    setSort(prev => {
      if (!prev || prev.field !== field) return { field, dir: 'asc' };
      if (prev.dir === 'asc') return { field, dir: 'desc' };
      return null;
    });
  };

  const exportFiltered = () => {
    const header = ['Codigo','Origen','Destino','DistanciaKm','Frecuencia','Activa','Creada'];
    const rows = sorted.map(r => [r.code, r.origin, r.destination, r.distanceKm, r.frequency, r.active ? 'SI' : 'NO', r.createdAt.toISOString().split('T')[0]]);
    const csv = [header, ...rows]
      .map(line => line.map(val => `"${String(val).split('"').join('""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rutas_filtradas_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(191,219,254,0.05))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_rgba(15,23,42,0.4))]" />
      <div className="relative space-y-5">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sm font-medium uppercase tracking-[0.32em] text-slate-500 dark:text-blue-200/70">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-300/40 dark:shadow-sky-900/40">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <span>Panel de control</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {(query || frequencyFilter || onlyActive) && (
              <button
                onClick={() => { setQuery(''); setFrequencyFilter(''); setOnlyActive(false); setPage(1); setSort(null); }}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 dark:hover:border-white/30 dark:hover:text-white"
              >
                Limpiar filtros
              </button>
            )}
            <button
              onClick={exportFiltered}
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-400 bg-white/70 px-3 py-2 text-xs font-semibold text-sky-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-50 dark:border-white/20 dark:bg-white/10 dark:text-white"
            >
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
            {onCreate && (
              <button
                onClick={onCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
              >
                <Plus className="h-4 w-4" /> Nueva Ruta
              </button>
            )}
          </div>
        </header>

        <section className="rounded-3xl border border-slate-200/70 bg-white/70 px-4 py-6 shadow-inner shadow-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
          <div className="grid items-end gap-4 md:grid-cols-4 lg:grid-cols-6">
            <div className="md:col-span-2 lg:col-span-3">
              <label htmlFor="route-search" className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                Buscar (código / origen / destino)
              </label>
              <input
                id="route-search"
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
                placeholder="Ej. R-001 o Planta Quilicura"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500"
              />
            </div>
            <div>
              <label htmlFor="freq-filter" className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                Frecuencia
              </label>
              <select
                id="freq-filter"
                value={frequencyFilter}
                onChange={e => { setFrequencyFilter(e.target.value); setPage(1); }}
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-sky-500"
              >
                <option value="">Todas</option>
                <option value="Diaria">Diaria</option>
                <option value="Semanal">Semanal</option>
                <option value="Mensual">Mensual</option>
                <option value="Ocasional">Ocasional</option>
              </select>
            </div>
            <fieldset className="md:col-span-2 lg:col-span-2">
              <legend className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                Estado
              </legend>
              <div className="inline-flex overflow-hidden rounded-2xl border border-slate-200 bg-white/70 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <button
                  type="button"
                  aria-pressed={!onlyActive}
                  onClick={() => {
                    if (onlyActive) {
                      setOnlyActive(false);
                      setPage(1);
                    }
                  }}
                  className={`px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500 ${onlyActive ? 'hover:bg-slate-100 dark:hover:bg-white/10' : 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-200/50 dark:shadow-sky-900/50'}`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  aria-pressed={onlyActive}
                  onClick={() => {
                    if (!onlyActive) {
                      setOnlyActive(true);
                      setPage(1);
                    }
                  }}
                  className={`px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500 ${onlyActive ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-200/50 dark:shadow-sky-900/50' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
                >
                  Sólo activas
                </button>
              </div>
            </fieldset>
          </div>
        </section>

        <div className="overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-200 text-xs uppercase tracking-[0.24em] text-slate-600 dark:from-slate-800 dark:to-slate-900 dark:text-blue-100">
                  <SortableTh label="Código" field="code" sort={sort} onToggle={toggleSort} />
                  <SortableTh label="Origen" field="origin" sort={sort} onToggle={toggleSort} />
                  <SortableTh label="Destino" field="destination" sort={sort} onToggle={toggleSort} />
                  <SortableTh label="Distancia (km)" field="distanceKm" sort={sort} onToggle={toggleSort} />
                  <SortableTh label="Frecuencia" field="frequency" sort={sort} onToggle={toggleSort} />
                  <SortableTh label="Estado" field="active" sort={sort} onToggle={toggleSort} />
                  <SortableTh label="Creada" field="createdAt" sort={sort} onToggle={toggleSort} />
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em]">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500 dark:text-blue-100/70">Cargando rutas...</td>
                  </tr>
                )}
                {error && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-rose-500 dark:text-rose-300">Error: {error}</td>
                  </tr>
                )}
                {paged.map(r => (
                  <RouteRow key={r.id} route={r} onEdit={() => setEditTarget(r)} onToggle={() => toggleActive(r.id)} />
                ))}
                {paged.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-500 dark:text-blue-100/70">Sin resultados con los filtros actuales</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
        {editTarget && <RouteListEditPortal route={editTarget} onClose={() => setEditTarget(null)} />}
      </div>
    </div>
  );
};

interface RowProps { route: TransportRoute; onEdit: () => void; onToggle: () => void; }

const RouteRow: React.FC<RowProps> = ({ route, onEdit, onToggle }) => {
  const tdCls = 'px-4 py-3 text-sm text-slate-700 dark:text-slate-100 whitespace-nowrap';
  return (
    <tr className="border-b border-slate-200/70 last:border-0 bg-white/60 backdrop-blur-sm transition hover:bg-sky-50/60 dark:border-white/5 dark:bg-white/5 dark:hover:bg-white/10">
      <td className={tdCls}>{route.code}</td>
      <td className={tdCls}>{route.origin}</td>
      <td className={tdCls}>{route.destination}</td>
      <td className={tdCls}>{route.distanceKm.toLocaleString()}</td>
      <td className={tdCls}>{route.frequency}</td>
      <td className={tdCls}>
        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${route.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'}`}>{route.active ? 'Activa' : 'Inactiva'}</span>
      </td>
      <td className={tdCls}>{route.createdAt.toLocaleDateString()}</td>
      <td className={tdCls}>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="group rounded-xl border border-sky-200 bg-white/80 p-1.5 text-sky-600 shadow-sm transition hover:border-sky-400 hover:text-sky-800 dark:border-white/10 dark:bg-white/5 dark:text-blue-100 dark:hover:border-white/30" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onToggle} className={`group rounded-xl border p-1.5 transition hover:-translate-y-0.5 ${route.active ? 'border-amber-300 bg-amber-50/60 text-amber-600 hover:border-amber-400 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200' : 'border-emerald-300 bg-emerald-50/60 text-emerald-600 hover:border-emerald-400 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200'}`} title={route.active ? 'Desactivar' : 'Activar'}>
            <Power className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const RouteListEditPortal: React.FC<{ route: TransportRoute; onClose: () => void; }> = ({ route, onClose }) => {
  const portalTarget = typeof document === 'undefined' ? null : document.body;
  if (!portalTarget) {
    return null;
  }
  return ReactDOM.createPortal(
    <EditOverlay route={route} onClose={onClose} />,
    portalTarget
  );
};

const EditOverlay: React.FC<{ route: TransportRoute; onClose: () => void; }> = ({ route, onClose }) => {
  const { updateRoute } = useRouteContext();
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-6 text-slate-800 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/70">Edición rápida</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight">Editar {route.code}</h2>
          </div>
          <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-slate-400 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100" aria-label="Cerrar">
            ×
          </button>
        </div>
        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const fd = new FormData(form);
          void updateRoute(route.id, {
            code: (fd.get('code') as string) || route.code,
            origin: (fd.get('origin') as string) || route.origin,
            destination: (fd.get('destination') as string) || route.destination,
            distanceKm: Number(fd.get('distanceKm')) || route.distanceKm,
            frequency: (fd.get('frequency') as string) || route.frequency,
            active: fd.get('active') === 'on',
          }).then(() => {
            onClose();
          });
        }}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="edit-code" className="mb-1 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Código</label>
              <input id="edit-code" name="code" defaultValue={route.code} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </div>
            <div>
              <label htmlFor="edit-frequency" className="mb-1 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Frecuencia</label>
              <select id="edit-frequency" name="frequency" defaultValue={route.frequency} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white">
                <option>Diaria</option>
                <option>Semanal</option>
                <option>Mensual</option>
                <option>Ocasional</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-origin" className="mb-1 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Origen</label>
              <input id="edit-origin" name="origin" defaultValue={route.origin} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </div>
            <div>
              <label htmlFor="edit-destination" className="mb-1 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Destino</label>
              <input id="edit-destination" name="destination" defaultValue={route.destination} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </div>
            <div>
              <label htmlFor="edit-distance" className="mb-1 block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Distancia (km)</label>
              <input id="edit-distance" name="distanceKm" type="number" min={1} defaultValue={route.distanceKm} className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input id="active-edit" name="active" type="checkbox" defaultChecked={route.active} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-400 dark:border-white/20 dark:bg-white/10" />
              <label htmlFor="active-edit" className="text-sm text-slate-600 dark:text-blue-100">Activa</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200/70 pt-4 dark:border-white/10">
            <button type="button" onClick={onClose} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">Cancelar</button>
            <button type="submit" className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SortableTh: React.FC<{ label: string; field: string; sort: { field: string; dir: 'asc' | 'desc' } | null; onToggle: (f: string) => void; }> = ({ label, field, sort, onToggle }) => {
  const active = sort?.field === field;
  const dir = active ? sort?.dir : undefined;
  let icon = <ArrowUpDown className="h-3 w-3" />;
  if (active) {
    icon = dir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }
  return (
    <th
      onClick={() => onToggle(field)}
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 transition hover:text-slate-900 dark:text-blue-100 dark:hover:text-white"
    >
      <span className="inline-flex items-center gap-2">
        {label}
        {icon}
      </span>
    </th>
  );
};

const Pagination: React.FC<{ page: number; totalPages: number; onChange: (p: number) => void; }> = ({ page, totalPages, onChange }) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200/70 bg-white/70 px-5 py-4 text-xs shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
      <div>Página {page} de {totalPages}</div>
      <div className="flex gap-2">
        <button
          disabled={!canPrev}
          onClick={() => canPrev && onChange(page - 1)}
          className={`flex-1 rounded-2xl border px-4 py-2 font-semibold transition ${canPrev ? 'border-slate-200 bg-white/80 text-slate-600 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100' : 'border-slate-200/60 text-slate-400/70 opacity-60 dark:border-white/5 dark:text-blue-100/40'}`}
        >
          Anterior
        </button>
        <button
          disabled={!canNext}
          onClick={() => canNext && onChange(page + 1)}
          className={`flex-1 rounded-2xl border px-4 py-2 font-semibold transition ${canNext ? 'border-slate-200 bg-white/80 text-slate-600 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100' : 'border-slate-200/60 text-slate-400/70 opacity-60 dark:border-white/5 dark:text-blue-100/40'}`}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default RouteList;
