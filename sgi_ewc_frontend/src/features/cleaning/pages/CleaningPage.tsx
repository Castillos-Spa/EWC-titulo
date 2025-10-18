import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { CleaningProvider } from '../context/CleaningContext';
import { useCleaning } from '../hooks/useCleaning';
import CleaningKpis from '../components/CleaningKpis';
import CleaningCard from '../components/CleaningCard';
import CleaningDetailModal from '../components/CleaningDetailModal';
import CreateCleaningModal from '../components/CreateCleaningModal';
import EditCleaningModal from '../components/EditCleaningModal';
import type { Aseo } from '../../../types/Aseo';

const CleaningInner: React.FC = () => {
  const { items, create, update } = useCleaning();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<Aseo | null>(null);
  const [edit, setEdit] = useState<Aseo | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(r => r.area.toLowerCase().includes(q) || r.responsibleStaff.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes de Limpieza</h2>
          <p className="text-gray-600 dark:text-gray-400">Actividades diarias de limpieza y reportes de mantenimiento</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      <CleaningKpis />

      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por área o personal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar reportes"
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filtered.map((r) => (
          <CleaningCard key={r.id} report={r} onView={setDetail} onEdit={setEdit} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron reportes</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar tu búsqueda o crear un nuevo reporte de limpieza.</p>
        </div>
      )}

      {showCreate && (
        <CreateCleaningModal onClose={() => setShowCreate(false)} onCreate={async (p) => { await create(p); }} />
      )}
      {detail && (
        <CleaningDetailModal report={detail} onClose={() => setDetail(null)} onEdit={(r) => { setDetail(null); setEdit(r); }} />
      )}
      {edit && (
        <EditCleaningModal report={edit} onClose={() => setEdit(null)} onUpdate={async (id, p) => { await update(id, p); }} />
      )}
    </div>
  );
};

const CleaningPage: React.FC = () => (
  <CleaningProvider>
    <CleaningInner />
  </CleaningProvider>
);

export default CleaningPage;