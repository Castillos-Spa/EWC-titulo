import React, { useMemo, useState } from 'react';
import { Plus, Search, AlertTriangle, AlertCircle, XCircle, Camera } from 'lucide-react';
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../../../types/Incident';
import { useAuth } from '../../../contexts/AuthContext';
import { IncidentsProvider } from '../context/IncidentsContext';
import { useIncidents } from '../hooks/useIncidents';
import IncidentCard from '../components/IncidentCard';
import IncidentDetailModal from '../components/IncidentDetailModal';
import CreateIncidentModal from '../components/CreateIncidentModal';

const TYPE_LABELS: Record<IncidentType, string> = {
  vehicle_breakdown: 'Avería de Vehículo',
  accident: 'Accidente',
  traffic_delay: 'Retraso de Tráfico',
  weather: 'Clima Adverso',
  security: 'Seguridad',
  other: 'Otro',
};

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: 'Reportado',
  acknowledged: 'Reconocido',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
};

const IncidentsPageInner: React.FC = () => {
  const { user } = useAuth();
  const { items, create, update } = useIncidents();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | IncidentType>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [detail, setDetail] = useState<Incident | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  const stats = useMemo(() => ({
    total: items.length,
    open: items.filter((i) => i.status !== 'resolved').length,
    critical: items.filter((i) => i.severity === 'critical').length,
    photos: items.reduce((a, i) => a + (i.photos?.length || 0), 0),
  }), [items]);

  const handleCreate = async (data: Pick<Incident, 'area' | 'type' | 'severity' | 'title' | 'description' | 'location'>) => {
    try {
      await create({
        ...data,
        reportedBy: user?.username || 'Usuario',
        reportedAt: new Date().toISOString(),
        status: 'reported',
      });
    } catch (err) {
      console.error('No se pudo crear el incidente', err);
      alert('No se pudo crear el incidente en el servidor');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Incidentes</h2>
          <p className="text-gray-600 dark:text-gray-400">Reportes de incidentes operativos y de seguridad</p>
        </div>
        <button onClick={() => setOpenCreate(true)} className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          <span>Reportar incidente</span>
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Incidentes totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Abiertos</p>
              <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Fotos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.photos}</p>
            </div>
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, descripción o ubicación..." aria-label="Buscar incidentes" className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
        </div>
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Filtrar por área"
        >
          <option value="all">Todas las áreas</option>
          {userAreas.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | IncidentStatus)}
          className="px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          {Object.keys(STATUS_LABELS).map((k) => (
            <option key={k} value={k}>{STATUS_LABELS[k as IncidentStatus]}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as 'all' | IncidentSeverity)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Filtrar por severidad"
          >
            <option value="all">Todas las severidades</option>
            {Object.keys(SEVERITY_LABELS).map((k) => (
              <option key={k} value={k}>{SEVERITY_LABELS[k as IncidentSeverity]}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | IncidentType)}
            className="px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos los tipos</option>
            {Object.keys(TYPE_LABELS).map((k) => (
              <option key={k} value={k}>{TYPE_LABELS[k as IncidentType]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((inc) => (
          <IncidentCard key={inc.id} incident={inc} onClick={() => setDetail(inc)} onQuickResolve={handleAdvanceStatus} updatingId={updatingId} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron incidentes</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar los filtros o crea un nuevo incidente.</p>
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