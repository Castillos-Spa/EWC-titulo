import React, { useMemo, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { MaintenanceProvider } from '../context/MaintenanceContext';
import useMaintenance from '../hooks/useMaintenance';
import MaintenanceStats from '../components/MaintenanceStats';
import MaintenanceFilters from '../components/MaintenanceFilters';
import MaintenanceBoard from '../components/MaintenanceBoard';
import MaintenanceComposerModal from '../components/MaintenanceComposerModal';
import MaintenanceDetailModal from '../components/MaintenanceDetailModal';
import type { MaintenanceStatus, MaintenanceType } from '../context/MaintenanceContext';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';
import type { CreateTallerWorkOrderPayload } from '../../../utils/tallerApi';

const MaintenancePageInner: React.FC = () => {
  const { records, vehicles, users, mechanics, loading, error, createRecord, updateStatus } = useMaintenance();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<MaintenanceStatus | 'all'>('all');
  const [type, setType] = useState<MaintenanceType | 'all'>('all');
  const [composerOpen, setComposerOpen] = useState(false);
  const [detail, setDetail] = useState<OrdenTrabajo | null>(null);

  const filteredRecords = useMemo(() => {
    const lookupVehicle = new Map(vehicles.map(vehicle => [vehicle.id, vehicle]));
    const lookupUser = new Map(users.map(user => [user.id, user]));
    const query = search.trim().toLowerCase();

    return records.filter(record => {
      if (status !== 'all' && record.estado !== status) return false;
      if (type !== 'all' && (record.tipo?.toLowerCase() ?? '') !== type.toLowerCase()) return false;

      if (query) {
        const vehicle = lookupVehicle.get(record.vehiculoId);
        const mechanic = record.responsableId ? lookupUser.get(record.responsableId) : undefined;
        const haystack = [
          record.description ?? '',
          vehicle?.patente ?? '',
          vehicle?.marca ?? '',
          vehicle?.modelo ?? '',
          mechanic?.username ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [records, vehicles, users, search, status, type]);

  const resetFilters = () => {
    setSearch('');
    setStatus('all');
    setType('all');
  };

  const handleCreate = async (payload: (CreateTallerWorkOrderPayload & { estado?: MaintenanceStatus })) => {
    const { estado, ...rest } = payload;
    const created = await createRecord(rest);
    if (estado && estado !== 'abierta') {
      await updateStatus(created.id, estado);
    }
    setComposerOpen(false);
  };

  const handleStatusChange = async (record: OrdenTrabajo, nextStatus: MaintenanceStatus) => {
    await updateStatus(record.id, nextStatus);
  };

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Wrench className="h-4 w-4" />
              <span>Mantenimiento</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Órdenes de taller</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Coordina actividades preventivas y correctivas con el nuevo diseño translúcido. Mantén visibilidad sobre responsables, costos y repuestos desde una vista consistente con el resto del hub.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Nueva orden
          </button>
        </div>
      </section>

      <MaintenanceStats records={records} loading={loading} />

      <MaintenanceFilters
        records={records}
        search={search}
        status={status}
        type={type}
        total={filteredRecords.length}
        onSearch={setSearch}
        onStatusChange={setStatus}
        onTypeChange={setType}
        onReset={resetFilters}
      />

      <MaintenanceBoard
        records={filteredRecords}
        vehicles={vehicles}
        users={users}
        loading={loading}
        error={error}
        onView={setDetail}
        onStatusChange={handleStatusChange}
      />

      <div className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-amber-50/80 px-6 py-5 text-amber-700 shadow-lg shadow-amber-200/40 backdrop-blur dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
        <div className="pointer-events-none absolute -right-16 -top-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl dark:bg-amber-400/20" />
        <div className="relative text-xs leading-relaxed">
          <strong className="font-semibold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-200">Nota</strong>
          <p className="mt-2 max-w-3xl">
            Los datos provienen de endpoints simulados del módulo de taller. Conecta la API real reutilizando estos componentes para mantener una experiencia cohesionada.
          </p>
        </div>
      </div>

      <MaintenanceComposerModal
        open={composerOpen}
        vehicles={vehicles}
        mechanics={mechanics}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleCreate}
      />

      <MaintenanceDetailModal
        record={detail}
        vehicles={vehicles}
        users={users}
        onClose={() => setDetail(null)}
      />
    </div>
  );
};

const MaintenancePage: React.FC = () => (
  <MaintenanceProvider>
    <MaintenancePageInner />
  </MaintenanceProvider>
);

export default MaintenancePage;
