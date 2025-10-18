import React, { useState, useMemo } from 'react';
import type { TransportRoute } from '../context/RouteContext';
import { useRouteContext } from '../context/useRouteContext';
import { Pencil, Power, Download } from 'lucide-react';
import ReactDOM from 'react-dom';

const RouteList: React.FC = () => {
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

  const thCls = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300';

  return (
    <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
      <div className="p-4 mb-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
        <div className="grid items-end gap-4 md:grid-cols-4 lg:grid-cols-6">
          <div className="md:col-span-2 lg:col-span-2">
            <label htmlFor="route-search" className="block mb-1 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Buscar (código / origen / destino)</label>
            <input id="route-search" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder="Ej: R-001 o Planta" className="w-full px-3 py-2 text-sm text-gray-900 border rounded focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>
          <div>
            <label htmlFor="freq-filter" className="block mb-1 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Frecuencia</label>
            <select id="freq-filter" value={frequencyFilter} onChange={e => { setFrequencyFilter(e.target.value); setPage(1); }} className="w-full px-3 py-2 text-sm text-gray-900 border rounded focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <option value=''>Todas</option>
              <option value='Diaria'>Diaria</option>
              <option value='Semanal'>Semanal</option>
              <option value='Mensual'>Mensual</option>
              <option value='Ocasional'>Ocasional</option>
            </select>
          </div>
          <fieldset className="md:col-span-2 lg:col-span-2">
            <legend className="block mb-1 text-xs font-medium text-gray-500 uppercase dark:text-gray-400">Estado</legend>
            <div className="inline-flex overflow-hidden text-xs bg-white border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-900">
              <button
                type="button"
                aria-pressed={!onlyActive}
                onClick={() => {
                  if (onlyActive) {
                    setOnlyActive(false);
                    setPage(1);
                  }
                }}
                className={`px-3 py-1 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${onlyActive ? 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300' : 'bg-blue-600 text-white dark:bg-blue-500'}`}
              >
                Todas
              </button>
              <button
                type="button"
                aria-pressed={onlyActive}
                onClick={() => {
                  if (onlyActive === false) {
                    setOnlyActive(true);
                    setPage(1);
                  }
                }}
                className={`px-3 py-1 font-medium border-l border-gray-300 dark:border-gray-600 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${onlyActive ? 'bg-blue-600 text-white dark:bg-blue-500' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >
                Solo activas
              </button>
            </div>
          </fieldset>
          <div className="flex gap-4">
            {(query || frequencyFilter || onlyActive) && (
              <button onClick={() => { setQuery(''); setFrequencyFilter(''); setOnlyActive(false); setPage(1); setSort(null); }} className="px-2 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Limpiar</button>
            )}
            <button onClick={exportFiltered} className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-white border border-blue-600 rounded hover:bg-blue-50 dark:bg-gray-900 dark:hover:bg-gray-800">
              <Download className="w-4 h-4 mr-1" /> Exportar
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <SortableTh label="Código" field="code" sort={sort} onToggle={toggleSort} />
              <SortableTh label="Origen" field="origin" sort={sort} onToggle={toggleSort} />
              <SortableTh label="Destino" field="destination" sort={sort} onToggle={toggleSort} />
              <SortableTh label="Distancia (km)" field="distanceKm" sort={sort} onToggle={toggleSort} />
              <SortableTh label="Frecuencia" field="frequency" sort={sort} onToggle={toggleSort} />
              <SortableTh label="Estado" field="active" sort={sort} onToggle={toggleSort} />
              <SortableTh label="Creada" field="createdAt" sort={sort} onToggle={toggleSort} />
              <th className={thCls}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-sm text-center text-gray-500 dark:text-gray-400">Cargando rutas...</td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-sm text-center text-red-500 dark:text-red-400">
                  Error: {error}
                </td>
              </tr>
            )}
            {paged.map(r => <RouteRow key={r.id} route={r} onEdit={() => setEditTarget(r)} onToggle={() => toggleActive(r.id)} />)}
            {paged.length === 0 && loading === false && error == null && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editTarget && <RouteListEditPortal route={editTarget} onClose={() => setEditTarget(null)} />}
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
};

interface RowProps { route: TransportRoute; onEdit: () => void; onToggle: () => void; }

const RouteRow: React.FC<RowProps> = ({ route, onEdit, onToggle }) => {
  const tdCls = 'px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap';
  return (
    <tr className="border-b border-gray-200 last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60">
      <td className={tdCls}>{route.code}</td>
      <td className={tdCls}>{route.origin}</td>
      <td className={tdCls}>{route.destination}</td>
      <td className={tdCls}>{route.distanceKm.toLocaleString()}</td>
      <td className={tdCls}>{route.frequency}</td>
      <td className={tdCls}>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${route.active ? 'bg-green-100 text-green-700 dark:bg-green-800/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-800/40 dark:text-red-300'}`}>{route.active ? 'Activa' : 'Inactiva'}</span>
      </td>
      <td className={tdCls}>{route.createdAt.toLocaleDateString()}</td>
      <td className={tdCls}>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1 text-blue-600 transition rounded hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Editar">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={onToggle} className={`p-1 transition rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${route.active ? 'text-amber-600' : 'text-green-600'}`} title={route.active ? 'Desactivar' : 'Activar'}>
            <Power className="w-4 h-4" />
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl p-6 mt-10 bg-white border border-gray-200 rounded-lg shadow-xl dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Editar {route.code}</h2>
          <button onClick={onClose} className="p-2 text-gray-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Cerrar">×</button>
        </div>
        <form onSubmit={(e) => {
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
        }} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="edit-code" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Código</label>
              <input id="edit-code" name="code" defaultValue={route.code} className="w-full px-3 py-2 text-sm text-gray-900 border rounded dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label htmlFor="edit-frequency" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Frecuencia</label>
              <select id="edit-frequency" name="frequency" defaultValue={route.frequency} className="w-full px-3 py-2 text-sm text-gray-900 border rounded dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700">
                <option>Diaria</option>
                <option>Semanal</option>
                <option>Mensual</option>
                <option>Ocasional</option>
              </select>
            </div>
            <div>
              <label htmlFor="edit-origin" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Origen</label>
              <input id="edit-origin" name="origin" defaultValue={route.origin} className="w-full px-3 py-2 text-sm text-gray-900 border rounded dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label htmlFor="edit-destination" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Destino</label>
              <input id="edit-destination" name="destination" defaultValue={route.destination} className="w-full px-3 py-2 text-sm text-gray-900 border rounded dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div>
              <label htmlFor="edit-distance" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Distancia (km)</label>
              <input id="edit-distance" name="distanceKm" type="number" min={1} defaultValue={route.distanceKm} className="w-full px-3 py-2 text-sm text-gray-900 border rounded dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
            </div>
            <div className="flex items-center pt-6 space-x-2">
              <input id="active-edit" name="active" type="checkbox" defaultChecked={route.active} />
              <label htmlFor="active-edit" className="text-sm text-gray-700 dark:text-gray-200">Activa</label>
            </div>
          </div>
          <div className="flex justify-end pt-2 space-x-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SortableTh: React.FC<{ label: string; field: string; sort: { field: string; dir: 'asc' | 'desc' } | null; onToggle: (f: string) => void; }> = ({ label, field, sort, onToggle }) => {
  const active = sort?.field === field;
  const dir = active ? sort?.dir : undefined;
  const thCls = 'px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300';
  return (
    <th onClick={() => onToggle(field)} className={`${thCls} cursor-pointer select-none hover:text-gray-900 dark:hover:text-white`}>
      <span className="inline-flex items-center gap-1">{label}{active && (dir === 'asc' ? '▲' : '▼')}</span>
    </th>
  );
};

const Pagination: React.FC<{ page: number; totalPages: number; onChange: (p: number) => void; }> = ({ page, totalPages, onChange }) => {
  const canPrev = page > 1;
  const canNext = page < totalPages;
  return (
    <div className="flex items-center justify-between mt-4 text-xs">
      <div className="text-gray-600 dark:text-gray-400">Página {page} de {totalPages}</div>
      <div className="flex gap-2">
        <button disabled={!canPrev} onClick={() => canPrev && onChange(page - 1)} className={`px-2 py-1 rounded border text-gray-700 dark:text-gray-200 ${canPrev ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600' : 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700'}`}>Anterior</button>
        <button disabled={!canNext} onClick={() => canNext && onChange(page + 1)} className={`px-2 py-1 rounded border text-gray-700 dark:text-gray-200 ${canNext ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600' : 'opacity-40 cursor-not-allowed border-gray-200 dark:border-gray-700'}`}>Siguiente</button>
      </div>
    </div>
  );
};

export default RouteList;
