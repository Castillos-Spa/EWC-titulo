import React, { useMemo, useState } from 'react';
import { CivilWorksProvider } from '../context/CivilWorksContext';
import { useCivilWorks } from '../hooks/useCivilWorks';
import CivilWorksKpis from '../components/CivilWorksKpis';
import CivilWorkCard from '../components/CivilWorkCard';
import CivilWorkDetailModal from '../components/CivilWorkDetailModal';
import CreateCivilWorkModal from '../components/CreateCivilWorkModal';
import EditCivilWorkModal from '../components/EditCivilWorkModal';
import { Search, Plus } from 'lucide-react';
import type { CivilWorkStatus } from '../../../types/CivilWork';

const CivilWorksInner: React.FC = () => {
  const { items, selectById, selected } = useCivilWorks();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'ALL' | CivilWorkStatus>('ALL');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter((r) => {
        const project = (r.project ?? '').toLowerCase();
        const location = (r.location ?? '').toLowerCase();
        const staff: string[] = Array.isArray(r.responsibleStaffUsernames) ? r.responsibleStaffUsernames : [];
        return project.includes(q) || location.includes(q) || staff.some((s) => s.toLowerCase().includes(q));
      });
    }
    if (status !== 'ALL') list = list.filter((r) => r.status === status);
  const toTs = to ? new Date(to).getTime() : Number.NaN;
  const fromTs = from ? new Date(from).getTime() : Number.NaN;
    if (Number.isFinite(fromTs)) {
      list = list.filter((r) => {
        const start = r.startDate ? new Date(r.startDate).getTime() : undefined;
        return start === undefined ? true : start >= fromTs;
      });
    }
    if (Number.isFinite(toTs)) {
      list = list.filter((r) => {
        const start = r.startDate ? new Date(r.startDate).getTime() : undefined;
        return start === undefined ? true : start <= toTs;
      });
    }
    return list;
  }, [items, search, status, from, to]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Obras Civiles</h2>
          <p className="text-gray-600 dark:text-gray-400">Gestión de proyectos y tareas</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nueva Obra</span>
        </button>
      </div>

      <CivilWorksKpis />

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 space-y-3">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por proyecto, ubicación o personal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar obras civiles"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label htmlFor="cw-filter-status" className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Estado</label>
            <select
              id="cw-filter-status"
              value={status}
              onChange={(e) => {
                const v = e.target.value as CivilWorkStatus | 'ALL';
                const allowed: ReadonlyArray<CivilWorkStatus | 'ALL'> = ['ALL','IN_PROGRESS','PENDING','ON_HOLD','COMPLETED'] as const;
                setStatus(allowed.includes(v) ? v : 'ALL');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="ALL">Todos</option>
              <option value="IN_PROGRESS">En Progreso</option>
              <option value="PENDING">Pendiente</option>
              <option value="ON_HOLD">En Pausa</option>
              <option value="COMPLETED">Completado</option>
            </select>
          </div>
          <div>
            <label htmlFor="cw-filter-from" className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Desde</label>
            <input id="cw-filter-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100" />
          </div>
          <div>
            <label htmlFor="cw-filter-to" className="block mb-1 text-sm text-gray-600 dark:text-gray-400">Hasta</label>
            <input id="cw-filter-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100" />
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.map((cw) => {
          const isRenderable = cw.id !== undefined && cw.project && cw.location && cw.startDate && cw.estimatedEndDate && cw.status && cw.workType && typeof cw.progress === 'number';
          if (!isRenderable) return null;
          const item = cw as unknown as Pick<import('../../../types/CivilWork').CivilWork, 'id' | 'project' | 'location' | 'startDate' | 'estimatedEndDate' | 'status' | 'workType' | 'progress'>;
          return (
            <CivilWorkCard key={item.id} item={item} onView={(id) => { void selectById(id); }} />
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron obras</h3>
          <p className="text-gray-600 dark:text-gray-400">Ajusta la búsqueda o crea una nueva obra civil.</p>
        </div>
      )}
      {showCreate && (
        <CreateCivilWorkModal onClose={() => setShowCreate(false)} />
      )}
      {selected && (
        <CivilWorkDetailModal report={selected} onClose={() => { /* cerrar */ }} onEdit={() => setShowEdit(true)} />
      )}
      {selected && showEdit && (
        <EditCivilWorkModal report={selected} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
};

const CivilWorksPage: React.FC = () => (
  <CivilWorksProvider>
    <CivilWorksInner />
  </CivilWorksProvider>
);

export default CivilWorksPage;
