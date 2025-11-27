import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../../../types/Incident';
import { useAuth } from '../../../contexts/AuthContext';
import { IncidentsProvider } from '../context/IncidentsContext';
import { useIncidents } from '../hooks/useIncidents';
import IncidentCard from '../components/IncidentCard';
import IncidentDetailModal from '../components/IncidentDetailModal';
import CreateIncidentModal from '../components/CreateIncidentModal';
import IncidentsKpis from '../components/IncidentsKpis';
import IncidentsFilters from '../components/IncidentsFilters';

const IncidentsPageInner: React.FC = () => {
  const { user } = useAuth();
  const { items, create, update, loadPhotos } = useIncidents();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | IncidentType>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [detail, setDetail] = useState<Incident | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Global search + deep-open wiring from Header
  useEffect(() => {
    const onGlobalSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail as { query?: string } | undefined;
      if (detail && typeof detail.query === 'string') setSearch(detail.query);
    };
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as { id?: string | number } | undefined;
      const id = d?.id;
      if (typeof id === 'string') {
        const found = items.find(i => i.id === id) || null;
        setDetail(found);
        if (!found) setSearch(String(id));
      } else if (typeof id === 'number') {
        const found = items.find(i => i.id === String(id)) || null;
        setDetail(found);
        if (!found) setSearch(String(id));
      }
    };
    globalThis.addEventListener('global-search', onGlobalSearch as EventListener);
    globalThis.addEventListener('incidents:open', onOpen as EventListener);
    return () => {
      globalThis.removeEventListener('global-search', onGlobalSearch as EventListener);
      globalThis.removeEventListener('incidents:open', onOpen as EventListener);
    };
  }, [items]);

  const userAreas = useMemo(() => {
    const fromUser = user?.areas ?? [];
    const fromData = items.map(i => i.area);
    return Array.from(new Set([...fromUser, ...fromData]));
  }, [user?.areas, items]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const s = search.trim().toLowerCase();
      const locStr = (() => {
        const locUnknown: unknown = i.location;
        if (typeof locUnknown === 'object' && locUnknown !== null) return JSON.stringify(locUnknown).toLowerCase();
        if (typeof locUnknown === 'string') return locUnknown.toLowerCase();
        return '';
      })();
      const matchesS = !s || i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || locStr.includes(s);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      const matchesType = typeFilter === 'all' || i.type === typeFilter;
      const matchesArea = areaFilter === 'all' || i.area === areaFilter;
      return matchesS && matchesStatus && matchesSeverity && matchesType && matchesArea;
    });
  }, [items, search, statusFilter, severityFilter, typeFilter, areaFilter]);

  const handleCreate = async (
    data: Pick<Incident, 'area' | 'type' | 'severity' | 'title' | 'description' | 'location'>,
    attachments: File[],
  ) => {
    try {
      await create({
        ...data,
        reportedBy: user?.username || 'Usuario',
        reportedAt: new Date().toISOString(),
        status: 'reported',
      }, attachments);
    } catch (err) {
      console.error('No se pudo crear el incidente', err);
      alert('No se pudo crear el incidente en el servidor');
      throw err;
    }
  };

  const handleUpdateStatus = async (id: string, status: IncidentStatus) => {
    setUpdatingId(id);
    try {
      await update(id, { status });
    } catch (err) {
      console.error('Failed to update status', err);
      alert('No se pudo actualizar el estado en el servidor');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdvanceStatus = (id: string) => {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const seq: Record<IncidentStatus, IncidentStatus | null> = {
      reported: 'acknowledged',
      acknowledged: 'in_progress',
      in_progress: 'resolved',
      resolved: null,
    };
    const next = seq[current.status];
    if (!next) return;
    void handleUpdateStatus(id, next);
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSeverityFilter('all');
    setTypeFilter('all');
    setAreaFilter('all');
  };

  const handleOpenDetail = useCallback((incident: Incident) => {
    setDetail(incident);
    if (!incident.photos || incident.photos.length === 0) {
      loadPhotos(incident.id)
        .then((photos) => {
          if (!photos.length) return;
          setDetail((current) => (current && current.id === incident.id ? { ...current, photos } : current));
        })
        .catch((err) => {
          console.error('No se pudieron cargar las fotografías del incidente', err);
        });
    }
  }, [loadPhotos]);

  useEffect(() => {
    if (!detail) return;
    const refreshed = items.find((i) => i.id === detail.id);
    if (refreshed && refreshed !== detail) {
      setDetail(refreshed);
    }
  }, [items, detail]);

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-rose-100 via-white to-sky-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-rose-400/35 blur-3xl dark:bg-rose-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl dark:bg-sky-500/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <ShieldAlert className="h-4 w-4" /> Radar de incidentes
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Monitoreo operativo con visibilidad total</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Escala y resuelve alertas de seguridad, logística y clima dentro del nuevo panel traslúcido. Prioriza respuestas rápidas con indicadores y filtros listos para la acción.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpenCreate(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-rose-500 to-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-400/40 transition hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" /> Reportar incidente
          </button>
        </div>
      </section>

      <IncidentsKpis />

      <IncidentsFilters
        items={items}
        search={search}
        status={statusFilter}
        severity={severityFilter}
        type={typeFilter}
        area={areaFilter}
        areas={userAreas}
        total={filtered.length}
        onSearch={setSearch}
        onStatusChange={value => setStatusFilter(value)}
        onSeverityChange={value => setSeverityFilter(value)}
        onTypeChange={value => setTypeFilter(value)}
        onAreaChange={value => setAreaFilter(value)}
        onReset={resetFilters}
      />

      <div className="grid gap-6">
        {filtered.map((incident) => (
          <IncidentCard
            key={incident.id}
            incident={incident}
            onClick={() => handleOpenDetail(incident)}
            onQuickResolve={handleAdvanceStatus}
            updatingId={updatingId}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 px-6 py-10 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.2),_rgba(15,23,42,0)_70%)]" />
          <div className="relative space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No se encontraron incidentes con los filtros actuales</h3>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">Ajusta la búsqueda o registra un nuevo reporte para iniciar el seguimiento.</p>
            <button
              type="button"
              onClick={() => setOpenCreate(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-rose-500 to-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-400/40 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" /> Registrar incidente
            </button>
          </div>
        </div>
      )}

      <IncidentDetailModal incident={detail} onClose={() => setDetail(null)} />
      <CreateIncidentModal open={openCreate} onClose={() => setOpenCreate(false)} onCreate={handleCreate} />
    </div>
  );
};

const IncidentsPage: React.FC = () => (
  <IncidentsProvider>
    <IncidentsPageInner />
  </IncidentsProvider>
);

export default IncidentsPage;