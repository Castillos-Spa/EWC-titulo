import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Search,
  MapPin,
  Clock,
  Camera,
  User,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
} from 'lucide-react';

// Tipos compartidos
import type { Incident, IncidentType, IncidentSeverity, IncidentStatus } from '../../types/Incident';

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

function severityColorCls(severity: IncidentSeverity) {
  switch (severity) {
    case 'critical':
      return 'text-red-700 bg-red-50';
    case 'high':
      return 'text-orange-700 bg-orange-50';
    case 'medium':
      return 'text-amber-700 bg-amber-50';
    default:
      return 'text-green-700 bg-green-50';
  }
}

function statusColor(status: IncidentStatus) {
  switch (status) {
    case 'resolved':
      return { text: 'text-green-700', bg: 'bg-green-50' };
    case 'in_progress':
      return { text: 'text-blue-700', bg: 'bg-blue-50' };
    case 'acknowledged':
      return { text: 'text-amber-700', bg: 'bg-amber-50' };
    default:
      return { text: 'text-gray-700', bg: 'bg-gray-100' };
  }
}

function StatusIcon({ status, className }: { status: IncidentStatus; className?: string }) {
  switch (status) {
    case 'resolved':
      return <CheckCircle className={className} />;
    case 'in_progress':
      return <Zap className={className} />;
    case 'acknowledged':
      return <AlertCircle className={className} />;
    default:
      return <XCircle className={className} />;
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Card de incidente (estilo alineado a otros módulos con Tailwind)
const IncidentCard: React.FC<{ incident: Incident; onClick: () => void }> = ({ incident, onClick }) => {
  const status = statusColor(incident.status);
  return (
    <button onClick={onClick} className="w-full text-left bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${severityColorCls(incident.severity)}`}>
              <AlertTriangle className="w-4 h-4" /> {SEVERITY_LABELS[incident.severity]}
            </span>
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              <StatusIcon status={incident.status} className="w-4 h-4" /> {STATUS_LABELS[incident.status]}
            </span>
          </div>

          <div className="text-sm text-blue-700 font-semibold uppercase">{TYPE_LABELS[incident.type]}</div>
          <h3 className="text-lg font-bold text-gray-900 mt-1 mb-1 break-words">{incident.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{incident.description}</p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {incident.location.address || `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" /> {formatTime(incident.reportedAt)}
            </div>
            {incident.photos.length > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="w-4 h-4 text-gray-400" /> {incident.photos.length} foto{incident.photos.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};

const DetailModal: React.FC<{ incident: Incident | null; onClose: () => void }> = ({ incident, onClose }) => {
  if (!incident) return null;
  const status = statusColor(incident.status);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <dialog open className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 id="incident-detail-title" className="text-xl font-semibold text-gray-900">Detalle del Incidente</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${severityColorCls(incident.severity)}`}>
              <AlertTriangle className="w-4 h-4" /> {SEVERITY_LABELS[incident.severity]}
            </span>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${status.bg} ${status.text}`}>
              <StatusIcon status={incident.status} className="w-4 h-4" /> {STATUS_LABELS[incident.status]}
            </span>
          </div>

          <div>
            <div className="text-sm font-semibold text-blue-700 uppercase">{TYPE_LABELS[incident.type]}</div>
            <h4 className="text-2xl font-bold text-gray-900">{incident.title}</h4>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap">{incident.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600"><User className="w-4 h-4" /> Reportado por</div>
              <div className="mt-1 font-semibold">{incident.reportedBy}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-600"><Clock className="w-4 h-4" /> Fecha y hora</div>
              <div className="mt-1 font-semibold">{formatDateTime(incident.reportedAt)}</div>
            </div>
          </div>

          <div>
            <h5 className="text-base font-semibold text-gray-900 mb-2">Ubicación</h5>
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-start gap-2 text-gray-700">
                <MapPin className="w-4 h-4 text-blue-600 mt-[2px]" />
                <div>
                  <div className="font-semibold">{incident.location.address || 'Ubicación GPS'}</div>
                  <div className="text-gray-600 text-sm">{incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)}</div>
                </div>
              </div>
              <a
                className="inline-flex items-center gap-2 text-blue-600 text-sm hover:underline"
                href={`https://maps.google.com/?q=${incident.location.latitude},${incident.location.longitude}`}
                target="_blank" rel="noreferrer"
              >
                Ver en Mapas
              </a>
            </div>
          </div>

          {incident.photos?.length > 0 && (
            <div>
              <h5 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2"><Camera className="w-4 h-4" /> Evidencia Fotográfica</h5>
              <div className="flex gap-3 overflow-x-auto pr-2">
                {incident.photos.map((src, i) => (
                  <div key={src} className="relative w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                    <img src={src} alt={`foto-${i + 1}`} className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                    <div className="absolute top-2 right-2 text-xs font-bold text-white bg-gray-900/80 rounded-full px-2 py-0.5">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5 className="text-base font-semibold text-gray-900 mb-2">Sincronización</h5>
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
              <span className={`inline-block w-3 h-3 rounded-full ${incident.syncStatus === 'synced' ? 'bg-green-600' : 'bg-amber-500'}`} />
              <span className="text-gray-700 text-sm">{incident.syncStatus === 'synced' ? 'Sincronizado' : 'Pendiente de sincronización'}</span>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
};

const CreateIncidentModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onCreate: (data: Pick<Incident, 'type' | 'severity' | 'title' | 'description' | 'location'>) => void;
}> = ({ open, onClose, onCreate }) => {
  const [type, setType] = useState<IncidentType>('other');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = typeof latitude === 'number' ? latitude : Number(latitude);
    const lng = typeof longitude === 'number' ? longitude : Number(longitude);
    if (!title || !description || Number.isNaN(lat) || Number.isNaN(lng)) {
      alert('Completa Título, Descripción y coordenadas válidas');
      return;
    }
    onCreate({
      type,
      severity,
      title,
      description,
      location: { latitude: lat, longitude: lng, address: address || undefined },
    });
    onClose();
    // reset
    setType('other');
    setSeverity('medium');
    setTitle('');
    setDescription('');
    setAddress('');
    setLatitude('');
    setLongitude('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Cerrar" />
      <dialog open className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Reportar Incidente</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="incident-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select id="incident-type" value={type} onChange={(e) => setType(e.target.value as IncidentType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="incident-severity" className="block text-sm font-medium text-gray-700 mb-1">Severidad</label>
              <select id="incident-severity" value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="incident-title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input id="incident-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Breve resumen" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="incident-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea id="incident-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe el incidente..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="incident-address" className="block text-sm font-medium text-gray-700 mb-1">Dirección (opcional)</label>
            <input id="incident-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Principal 123" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="incident-lat" className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input id="incident-lat" value={latitude} onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="incident-lng" className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input id="incident-lng" value={longitude} onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="any" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg text-gray-700 border-gray-300 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Crear</button>
          </div>
        </form>
      </dialog>
    </div>
  );
};

const Incidents: React.FC = () => {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>(() => [
    {
      id: 'incident-001',
      type: 'vehicle_breakdown',
      severity: 'high',
      title: 'Avería en Sistema de Frenos',
      description:
        'El vehículo ABC-123 presenta problemas en el sistema de frenos durante la ruta matutina. Se requiere asistencia técnica inmediata.',
      location: { latitude: -34.6037, longitude: -58.3816, address: 'Av. Corrientes 1234, Buenos Aires' },
      photos: [],
      reportedBy: 'Juan Pérez',
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'reported',
      syncStatus: 'pending',
    },
    {
      id: 'incident-002',
      type: 'traffic_delay',
      severity: 'medium',
      title: 'Retraso por Tráfico Intenso',
      description:
        'Tráfico congestionado en Av. 9 de Julio causando retrasos significativos en las entregas programadas.',
      location: { latitude: -34.6118, longitude: -58.396, address: 'Av. 9 de Julio, Buenos Aires' },
      photos: [],
      reportedBy: 'María González',
      reportedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'acknowledged',
      syncStatus: 'synced',
    },
  ]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | IncidentStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | IncidentSeverity>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | IncidentType>('all');
  const [detail, setDetail] = useState<Incident | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const s = search.trim().toLowerCase();
      const matchesS = !s || i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || (i.location.address || '').toLowerCase().includes(s);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      const matchesType = typeFilter === 'all' || i.type === typeFilter;
      return matchesS && matchesStatus && matchesSeverity && matchesType;
    });
  }, [incidents, search, statusFilter, severityFilter, typeFilter]);

  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter((i) => i.status !== 'resolved').length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
    photos: incidents.reduce((a, i) => a + (i.photos?.length || 0), 0),
  }), [incidents]);

  const handleCreate = (data: Pick<Incident, 'type' | 'severity' | 'title' | 'description' | 'location'>) => {
    const newIncident: Incident = {
      id: `incident-${Date.now()}`,
      ...data,
      photos: [],
      reportedBy: user?.username || 'Usuario',
      reportedAt: new Date().toISOString(),
      status: 'reported',
      syncStatus: 'pending',
    };
    setIncidents((prev) => [newIncident, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Incidentes</h2>
          <p className="text-gray-600">Reportes de incidentes operativos y de seguridad</p>
        </div>
        <button onClick={() => setOpenCreate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Reportar incidente</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Incidentes totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Abiertos</p>
              <p className="text-2xl font-bold text-amber-600">{stats.open}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Críticos</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fotos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.photos}</p>
            </div>
            <Camera className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título, descripción o ubicación..." className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | IncidentStatus)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            aria-label="Filtrar por tipo"
          >
            <option value="all">Todos los tipos</option>
            {Object.keys(TYPE_LABELS).map((k) => (
              <option key={k} value={k}>{TYPE_LABELS[k as IncidentType]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      <div className="grid gap-4">
        {filtered.map((inc) => (
          <IncidentCard key={inc.id} incident={inc} onClick={() => setDetail(inc)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron incidentes</h3>
          <p className="text-gray-600">Intenta ajustar los filtros o crea un nuevo incidente.</p>
        </div>
      )}

      <DetailModal incident={detail} onClose={() => setDetail(null)} />
      <CreateIncidentModal open={openCreate} onClose={() => setOpenCreate(false)} onCreate={handleCreate} />
    </div>
  );
};

export default Incidents;
