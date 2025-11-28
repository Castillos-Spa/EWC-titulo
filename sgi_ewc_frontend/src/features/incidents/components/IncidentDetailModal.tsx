import React, { useMemo } from 'react';
import type { Incident, IncidentStatus, IncidentSeverity, IncidentType } from '../../../types/Incident';
import { AlertTriangle, MapPin, X, Clock, UserCircle, Image } from 'lucide-react';

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
};

const TYPE_LABELS: Record<IncidentType, string> = {
  vehicle_breakdown: 'Avería de vehículo',
  accident: 'Accidente',
  traffic_delay: 'Retraso de tráfico',
  weather: 'Clima adverso',
  security: 'Seguridad',
  other: 'Otro',
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

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: 'Reportado',
  acknowledged: 'Reconocido',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
};

const IncidentDetailModal: React.FC<{ incident: Incident | null; onClose: () => void }> = ({ incident, onClose }) => {
  if (!incident) return null;

  let severityBg = 'bg-gradient-to-br from-emerald-500 to-teal-500';
  if (incident.severity === 'critical') severityBg = 'bg-gradient-to-br from-rose-500 to-red-600';
  else if (incident.severity === 'high') severityBg = 'bg-gradient-to-br from-orange-500 to-amber-600';
  else if (incident.severity === 'medium') severityBg = 'bg-gradient-to-br from-yellow-500 to-amber-500';

  const formatDateTime = (value?: string) => {
    if (!value) return 'Sin registrar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  const locationInfo = useMemo(() => {
    const loc = incident.location as unknown;
    if (!loc) {
      return { address: null as string | null, latitude: null as number | null, longitude: null as number | null };
    }
    if (typeof loc === 'string') {
      const trimmed = loc.trim();
      return { address: trimmed.length ? trimmed : null, latitude: null, longitude: null };
    }
    if (typeof loc === 'object') {
      const raw = loc as Record<string, unknown>;
      const addressRaw = raw.address ?? raw.direccion ?? raw.Direccion;
      const address = typeof addressRaw === 'string' && addressRaw.trim().length ? addressRaw.trim() : null;
      const lat = raw.latitude ?? raw.lat ?? raw.Latitude;
      const lng = raw.longitude ?? raw.lng ?? raw.Longitude;
      const toNumber = (value: unknown) => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string') {
          const parsed = Number.parseFloat(value);
          return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
      };
      const latitude = toNumber(lat);
      const longitude = toNumber(lng);
      if (!address) {
        if (latitude === null && longitude === null) {
          return { address: null, latitude: null, longitude: null };
        }
        if (latitude === 0 && longitude === 0) {
          return { address: null, latitude: null, longitude: null };
        }
      }
      return { address, latitude, longitude };
    }
    return { address: null, latitude: null, longitude: null };
  }, [incident.location]);

  const hasLocation = Boolean(locationInfo.address || (locationInfo.latitude !== null && locationInfo.longitude !== null));
  const hasPhotos = Array.isArray(incident.photos) && incident.photos.length > 0;
  const typeLabel = TYPE_LABELS[incident.type] ?? incident.type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <dialog
        open
        className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-700 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-white shadow ${severityBg}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 id="incident-detail-title" className="text-base font-semibold text-slate-900 dark:text-white">
              Detalle del incidente
            </h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/70" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${severityColorCls(incident.severity)}`}>
              <AlertTriangle className="h-4 w-4" /> {SEVERITY_LABELS[incident.severity]}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
              {STATUS_LABELS[incident.status]}
            </span>
            {incident.area && (
              <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 px-3 py-1 text-xs font-semibold text-sky-700 dark:border-sky-600 dark:text-sky-100">
                Área {incident.area}
              </span>
            )}
          </div>

          <header className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{typeLabel}</div>
            <h4 className="text-xl font-semibold text-slate-900 dark:text-white">{incident.title}</h4>
          </header>

          <section className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <p className="whitespace-pre-wrap leading-relaxed">{incident.description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <Clock className="h-4 w-4" /> Reportado
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatDateTime(incident.reportedAt)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  <UserCircle className="h-4 w-4" /> Reportado por
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{incident.reportedBy || 'Sin registro'}</p>
              </div>
            </div>
          </section>

          {hasLocation && (
            <section className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
                <MapPin className="h-4 w-4" /> Ubicación
              </div>
              {locationInfo.address && <p className="mt-2 text-sm leading-relaxed">{locationInfo.address}</p>}
              {locationInfo.latitude !== null && locationInfo.longitude !== null && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {locationInfo.latitude}, {locationInfo.longitude}
                </p>
              )}
            </section>
          )}

          {hasPhotos && (
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Image className="h-4 w-4" /> Evidencias
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {incident.photos.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <img src={src} alt="Registro del incidente" className="h-36 w-full object-cover transition group-hover:scale-105" />
                  </a>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              Cerrar
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default IncidentDetailModal;