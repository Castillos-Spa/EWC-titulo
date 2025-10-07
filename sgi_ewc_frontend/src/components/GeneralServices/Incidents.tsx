import React, { useMemo, useState, useEffect } from 'react';
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
import { fetchIncidents, createIncident as apiCreateIncident } from '../../utils/incidentApi';

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
      return 'text-red-700 bg-red-50 dark:text-red-100 dark:bg-red-900';
    case 'high':
      return 'text-orange-700 bg-orange-50 dark:text-orange-100 dark:bg-orange-900';
    case 'medium':
      return 'text-amber-700 bg-amber-50 dark:text-amber-100 dark:bg-amber-900';
    default:
      return 'text-green-700 bg-green-50 dark:text-green-100 dark:bg-green-900';
  }
}

function statusColor(status: IncidentStatus) {
  switch (status) {
    case 'resolved':
      return { text: 'text-green-700 dark:text-green-100', bg: 'bg-green-50 dark:bg-green-900' };
    case 'in_progress':
      return { text: 'text-blue-700 dark:text-blue-100', bg: 'bg-blue-50 dark:bg-blue-900' };
    case 'acknowledged':
      return { text: 'text-amber-700 dark:text-amber-100', bg: 'bg-amber-50 dark:bg-amber-900' };
    default:
      return { text: 'text-gray-700 dark:text-slate-200', bg: 'bg-gray-100 dark:bg-slate-700' };
  }
}

function StatusIcon({ status, className }: Readonly<{ status: IncidentStatus; className?: string }>) {
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

function isGeoLocation(x: unknown): x is { latitude: number; longitude: number; address?: string } {
  if (typeof x !== 'object' || x === null) return false;
  const y = x as Record<string, unknown>;
  return 'latitude' in y && 'longitude' in y && typeof y.latitude === 'number' && typeof y.longitude === 'number';
}

// Card de incidente (estilo alineado a otros módulos con Tailwind)
const IncidentCard: React.FC<{ incident: Incident; onClick: () => void }> = ({ incident, onClick }) => {
  const status = statusColor(incident.status);
  return (
    <button onClick={onClick} className="w-full p-5 text-left transition-shadow bg-white border border-gray-200 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${severityColorCls(incident.severity)}`}>
              <AlertTriangle className="w-4 h-4" /> {SEVERITY_LABELS[incident.severity]}
            </span>
            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              <StatusIcon status={incident.status} className="w-4 h-4" /> {STATUS_LABELS[incident.status]}
            </span>
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200">
              {incident.area}
            </span>
          </div>

          <div className="text-sm font-semibold text-blue-700 uppercase dark:text-blue-400">{TYPE_LABELS[incident.type]}</div>
          <h3 className="mt-1 mb-1 text-lg font-bold text-gray-900 break-words dark:text-gray-100">{incident.title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{incident.description}</p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center min-w-0 gap-1">
              <MapPin className="flex-shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="truncate">
                {(() => {
                  const loc = incident.location;
                  if (isGeoLocation(loc)) return loc.address || `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`;
                  if (loc && typeof loc === 'object') return JSON.stringify(loc);
                  return '';
                })()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" /> {formatTime(incident.reportedAt)}
            </div>
            {incident.photos.length > 0 && (
              <div className="flex items-center gap-1">
                <Camera className="w-4 h-4 text-gray-400 dark:text-gray-500" /> {incident.photos.length} foto{incident.photos.length !== 1 ? 's' : ''}
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
      <dialog open className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <h3 id="incident-detail-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">Detalle del Incidente</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
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
            <div className="text-sm font-semibold text-blue-700 uppercase dark:text-blue-400">{TYPE_LABELS[incident.type]}</div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{incident.title}</h4>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap dark:text-gray-300">{incident.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><User className="w-4 h-4" /> Reportado por</div>
              <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{incident.reportedBy}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><Clock className="w-4 h-4" /> Fecha y hora</div>
              <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{formatDateTime(incident.reportedAt)}</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400"><AlertCircle className="w-4 h-4" /> Área</div>
              <div className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{incident.area}</div>
            </div>
          </div>

          <div>
            <h5 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Ubicación</h5>
            <div className="flex flex-col gap-2 p-4 bg-white border border-gray-200 rounded-lg dark:bg-slate-900 dark:border-slate-700">
              <div className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-blue-600 mt-[2px]" />
                <div>
                  {(() => {
                    const loc = incident.location;
                    if (isGeoLocation(loc)) {
                      return (
                        <>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{loc.address || 'Ubicación GPS'}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</div>
                        </>
                      );
                    }
                    return (
                      <>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{typeof loc === 'string' ? loc : 'Ubicación'}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{typeof loc === 'object' ? JSON.stringify(loc) : ''}</div>
                      </>
                    );
                  })()}
                </div>
              </div>
              <a
                className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                href={`https://maps.google.com/?q=${incident.location.latitude},${incident.location.longitude}`}
                target="_blank" rel="noreferrer"
              >
                Ver en Mapas
              </a>
            </div>
          </div>

          {incident.photos?.length > 0 && (
            <div>
              <h5 className="flex items-center gap-2 mb-2 text-base font-semibold text-gray-900 dark:text-gray-100"><Camera className="w-4 h-4" /> Evidencia Fotográfica</h5>
              <div className="flex gap-3 pr-2 overflow-x-auto">
                {incident.photos.map((src, i) => (
                  <div key={src} className="relative flex items-center justify-center w-32 h-32 overflow-hidden bg-gray-100 rounded-lg dark:bg-slate-800">
                    <img src={src} alt={`foto-${i + 1}`} className="object-cover w-full h-full" onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
                    <div className="absolute top-2 right-2 text-xs font-bold text-white bg-gray-900/80 rounded-full px-2 py-0.5">{i + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h5 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">Sincronización</h5>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-slate-800">
              <span className={`inline-block w-3 h-3 rounded-full ${incident.syncStatus === 'synced' ? 'bg-green-600' : 'bg-amber-500'}`} />
              <span className="text-sm text-gray-700 dark:text-gray-300">{incident.syncStatus === 'synced' ? 'Sincronizado' : 'Pendiente de sincronización'}</span>
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
  onCreate: (data: Pick<Incident, 'area' | 'type' | 'severity' | 'title' | 'description' | 'location'>) => void;
}> = ({ open, onClose, onCreate }) => {
        // user not used here because areas are fixed
  const [type, setType] = useState<IncidentType>('other');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  // Lista fija de áreas para el formulario (según requerido)
  const FORM_AREAS = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'];
  const userAreas = FORM_AREAS;
  const [area, setArea] = useState<string>(userAreas[0]);

  // Attempt to auto-fill coordinates when the modal opens
  useEffect(() => {
    if (!open) return;
    if (!('geolocation' in navigator)) return;
    let mounted = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mounted) return;
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
  setLatitude(lat);
  setLongitude(lon);
      },
      (err) => {
        // ignore errors silently; user can input manually
        console.debug('Geolocation unavailable or denied', err);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
    return () => { mounted = false; };
  }, [open]);

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
      area,
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
    setArea(userAreas[0]);
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Cerrar" />
      <dialog open className="relative w-full max-w-2xl bg-white border border-transparent shadow-xl dark:bg-slate-900 rounded-xl dark:border-slate-700">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reportar Incidente</h3>
          <button onClick={onClose} className="px-2 py-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="incident-area" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Área</label>
            <select id="incident-area" value={area} onChange={(e) => setArea(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100">
              {userAreas.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="incident-type" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select id="incident-type" value={type} onChange={(e) => setType(e.target.value as IncidentType)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {Object.entries(TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="incident-severity" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Severidad</label>
              <select id="incident-severity" value={severity} onChange={(e) => setSeverity(e.target.value as IncidentSeverity)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {Object.entries(SEVERITY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="incident-title" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <input id="incident-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Breve resumen" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>
          <div>
            <label htmlFor="incident-description" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
            <textarea id="incident-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe el incidente..." className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>

          <div>
            <label htmlFor="incident-address" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Dirección (opcional)</label>
            <input id="incident-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Av. Principal 123" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="incident-lat" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Latitud</label>
              <input id="incident-lat" value={latitude} onChange={(e) => setLatitude(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="any" disabled={typeof latitude === 'number' && typeof longitude === 'number'} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
              {typeof latitude === 'number' && typeof longitude === 'number' && <div className="mt-1 text-xs text-gray-500">Coordenadas detectadas automáticamente (no editables)</div>}
            </div>
            <div>
              <label htmlFor="incident-lng" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Longitud</label>
              <input id="incident-lng" value={longitude} onChange={(e) => setLongitude(e.target.value === '' ? '' : Number(e.target.value))} type="number" step="any" disabled={typeof latitude === 'number' && typeof longitude === 'number'} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
              {typeof latitude === 'number' && typeof longitude === 'number' && <div className="mt-1 text-xs text-gray-500">Coordenadas detectadas automáticamente (no editables)</div>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg dark:text-slate-100 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">Crear</button>
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
      area: 'Transporte',
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
      area: 'Taller',
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
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [detail, setDetail] = useState<Incident | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  
  // Load incidents from backend on mount
  useEffect(() => {
    let mounted = true;
    fetchIncidents()
      .then((list) => {
        if (!mounted) return;
        setIncidents(list.map((i) => ({ ...i, syncStatus: 'synced' } as Incident)));
      })
      .catch((err) => {
        console.error('Failed to load incidents', err);
      });
    return () => { mounted = false; };
  }, []);

  const userAreas = useMemo(() => {
    const fromUser = user?.areas ?? [];
    const fromData = incidents.map(i => i.area);
    return Array.from(new Set([...fromUser, ...fromData]));
  }, [user?.areas, incidents]);

      const filtered = useMemo(() => {
    return incidents.filter((i) => {
      const s = search.trim().toLowerCase();
      const locStr = (() => {
        const locUnknown: unknown = i.location;
        if (isGeoLocation(locUnknown) && locUnknown.address) return locUnknown.address.toLowerCase();
        if (typeof locUnknown === 'string') return locUnknown.toLowerCase();
        if (typeof locUnknown === 'object' && locUnknown !== null) return JSON.stringify(locUnknown).toLowerCase();
        return '';
      })();
      const matchesS = !s || i.title.toLowerCase().includes(s) || i.description.toLowerCase().includes(s) || locStr.includes(s);
      const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || i.severity === severityFilter;
      const matchesType = typeFilter === 'all' || i.type === typeFilter;
      const matchesArea = areaFilter === 'all' || i.area === areaFilter;
      return matchesS && matchesStatus && matchesSeverity && matchesType && matchesArea;
    });
  }, [incidents, search, statusFilter, severityFilter, typeFilter, areaFilter]);

  const stats = useMemo(() => ({
    total: incidents.length,
    open: incidents.filter((i) => i.status !== 'resolved').length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
    photos: incidents.reduce((a, i) => a + (i.photos?.length || 0), 0),
  }), [incidents]);

  const handleCreate = async (data: Pick<Incident, 'area' | 'type' | 'severity' | 'title' | 'description' | 'location'>) => {
    const tempId = `incident-local-${Date.now()}`;
    const newIncident: Incident = {
      id: tempId,
      ...data,
      photos: [],
      reportedBy: user?.username || 'Usuario',
      reportedAt: new Date().toISOString(),
      status: 'reported',
      syncStatus: 'pending',
    };
    // optimistic UI
    setIncidents((prev) => [newIncident, ...prev]);
    try {
      const created = await apiCreateIncident(newIncident);
      // replace temp item with created one
      setIncidents((prev) => [created, ...prev.filter((i) => i.id !== tempId)]);
    } catch (err) {
      console.error('Error creating incident', err);
      // mark failed
      setIncidents((prev) => prev.map((i) => (i.id === tempId ? { ...i, syncStatus: 'failed' } : i)));
      alert('No se pudo crear el incidente en el servidor');
    }
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

      {/* Filtros y búsqueda */}
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

      {/* Lista */}
      <div className="grid gap-4">
        {filtered.map((inc) => (
          <IncidentCard key={inc.id} incident={inc} onClick={() => setDetail(inc)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron incidentes</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar los filtros o crea un nuevo incidente.</p>
        </div>
      )}

      <DetailModal incident={detail} onClose={() => setDetail(null)} />
      <CreateIncidentModal open={openCreate} onClose={() => setOpenCreate(false)} onCreate={handleCreate} />
    </div>
  );
};

export default Incidents;
