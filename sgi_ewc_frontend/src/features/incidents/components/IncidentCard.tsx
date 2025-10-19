import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle, XCircle, Zap, MapPin, Clock, Camera, UserCircle2, Timer } from 'lucide-react';
import type { Incident, IncidentStatus, IncidentSeverity } from '../../../types/Incident';

const SEVERITY_CONFIG: Record<IncidentSeverity, { label: string; badge: string }> = {
  critical: {
    label: 'Crítico',
    badge: 'border-rose-400/70 bg-rose-500/15 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100',
  },
  high: {
    label: 'Alto',
    badge: 'border-orange-400/70 bg-orange-500/15 text-orange-600 dark:border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-100',
  },
  medium: {
    label: 'Medio',
    badge: 'border-amber-400/70 bg-amber-500/15 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100',
  },
  low: {
    label: 'Bajo',
    badge: 'border-emerald-400/70 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100',
  },
};

const STATUS_CONFIG: Record<IncidentStatus, { label: string; badge: string; icon: React.ReactNode }> = {
  reported: {
    label: 'Reportado',
    badge: 'border-slate-300/70 bg-slate-200/70 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-blue-100',
    icon: <XCircle className="h-4 w-4" />,
  },
  acknowledged: {
    label: 'Reconocido',
    badge: 'border-amber-400/60 bg-amber-500/15 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100',
    icon: <AlertCircle className="h-4 w-4" />,
  },
  in_progress: {
    label: 'En progreso',
    badge: 'border-sky-400/60 bg-sky-500/15 text-sky-600 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-100',
    icon: <Zap className="h-4 w-4" />,
  },
  resolved: {
    label: 'Resuelto',
    badge: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100',
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

const STATUS_SEQUENCE: Record<IncidentStatus, IncidentStatus | null> = {
  reported: 'acknowledged',
  acknowledged: 'in_progress',
  in_progress: 'resolved',
  resolved: null,
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const computeSlaLabel = (incident: Incident) => {
  if (!incident.estimatedResolutionTime) return 'Sin estimación de resolución';
  const eta = new Date(incident.estimatedResolutionTime).getTime();
  if (!Number.isFinite(eta)) return 'Sin estimación de resolución';
  const diffHours = Math.round((eta - Date.now()) / (1000 * 60 * 60));
  if (diffHours < 0) return `${Math.abs(diffHours)}h de retraso`; // overdue
  if (diffHours === 0) return 'Entrega estimada en menos de 1h';
  return `Resolución estimada en ${diffHours}h`;
};

const getLocationText = (location: Incident['location']) => {
  const rawLocation = location as unknown;
  if (typeof rawLocation === 'string') return rawLocation;
  if (typeof rawLocation === 'object' && rawLocation !== null) {
    const locRecord = rawLocation as Record<string, unknown>;
    if ('latitude' in locRecord && 'longitude' in locRecord && typeof locRecord.latitude === 'number' && typeof locRecord.longitude === 'number') {
      const coords = `${locRecord.latitude.toFixed(4)}, ${locRecord.longitude.toFixed(4)}`;
      return typeof locRecord.address === 'string' && locRecord.address.length > 0 ? locRecord.address : coords;
    }
    return JSON.stringify(rawLocation);
  }
  return '';
};

export const IncidentCard: React.FC<{
  incident: Incident;
  onClick: () => void;
  onQuickResolve?: (id: string) => void;
  updatingId?: string | null;
}> = ({ incident, onClick, onQuickResolve, updatingId }) => {
  const severityInfo = SEVERITY_CONFIG[incident.severity];
  const statusInfo = STATUS_CONFIG[incident.status];
  const nextStatus = STATUS_SEQUENCE[incident.status];
  const slaLabel = useMemo(() => computeSlaLabel(incident), [incident]);
  const locationLabel = useMemo(() => getLocationText(incident.location), [incident.location]);

  const quickAction = useMemo(() => {
    if (!nextStatus || !onQuickResolve) return null;
    switch (nextStatus) {
      case 'acknowledged':
        return { label: 'Marcar revisado', icon: <AlertCircle className="h-4 w-4" /> };
      case 'in_progress':
        return { label: 'Marcar en progreso', icon: <Zap className="h-4 w-4" /> };
      case 'resolved':
        return { label: 'Resolver incidente', icon: <CheckCircle2 className="h-4 w-4" /> };
      default:
        return null;
    }
  }, [nextStatus, onQuickResolve]);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.12),_rgba(15,23,42,0)_70%)]" />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${severityInfo.badge}`}>
              <AlertTriangle className="h-4 w-4" /> {severityInfo.label}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${statusInfo.badge}`}>
              {statusInfo.icon}
              {statusInfo.label}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
              {incident.area}
            </span>
          </div>
          {quickAction && (
            <button
              type="button"
              onClick={() => onQuickResolve?.(incident.id)}
              disabled={updatingId === incident.id}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-400/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {quickAction.icon}
              {quickAction.label}
            </button>
          )}
        </div>

        <button type="button" onClick={onClick} className="flex flex-col gap-4 text-left">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{incident.type.replace('_', ' ')}</span>
            <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{incident.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-blue-200/80 line-clamp-2">{incident.description}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-blue-200/60">
            <span className="flex items-center gap-2 text-[0.7rem]">
              <MapPin className="h-4 w-4" />
              <span className="normal-case tracking-normal text-slate-600 dark:text-blue-100">{locationLabel || 'Ubicación no indicada'}</span>
            </span>
            <span className="flex items-center gap-2 text-[0.7rem]">
              <Clock className="h-4 w-4" />
              <span className="normal-case tracking-normal text-slate-600 dark:text-blue-100">{formatTime(incident.reportedAt)}</span>
            </span>
            <span className="flex items-center gap-2 text-[0.7rem]">
              <UserCircle2 className="h-4 w-4" />
              <span className="normal-case tracking-normal text-slate-600 dark:text-blue-100">{incident.reportedBy || 'Sin autor'}</span>
            </span>
            <span className="flex items-center gap-2 text-[0.7rem]">
              <Timer className="h-4 w-4" />
              <span className="normal-case tracking-normal text-slate-600 dark:text-blue-100">{slaLabel}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-blue-200/80">
            {incident.photos.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
                <Camera className="h-4 w-4" /> {incident.photos.length} evidencia{incident.photos.length === 1 ? '' : 's'}
              </span>
            )}
            {incident.supervisorNotes && incident.supervisorNotes.length > 0 && (
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
                Notas supervisión
              </span>
            )}
          </div>
        </button>
      </div>
    </article>
  );
};

export default IncidentCard;