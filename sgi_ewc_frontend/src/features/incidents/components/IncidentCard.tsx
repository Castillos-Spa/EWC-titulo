import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, XCircle, Zap, MapPin, Clock, Camera } from 'lucide-react';
import type { Incident, IncidentStatus, IncidentSeverity } from '../../../types/Incident';

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
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

function isGeoLocation(x: unknown): x is { latitude: number; longitude: number; address?: string } {
  if (typeof x !== 'object' || x === null) return false;
  const y = x as Record<string, unknown>;
  return 'latitude' in y && 'longitude' in y && typeof y.latitude === 'number' && typeof y.longitude === 'number';
}

export const IncidentCard: React.FC<{
  incident: Incident;
  onClick: () => void;
  onQuickResolve?: (id: string) => void;
  updatingId?: string | null;
}> = ({ incident, onClick, onQuickResolve, updatingId }) => {
  const status = statusColor(incident.status);
  const nextMap: Record<IncidentStatus, IncidentStatus | null> = {
    reported: 'acknowledged',
    acknowledged: 'in_progress',
    in_progress: 'resolved',
    resolved: null,
  };
  const next = nextMap[incident.status];
  let actionLabel = '';
  let actionIcon: React.ReactNode = null;
  switch (next) {
    case 'acknowledged':
      actionLabel = 'Marcar como revisado';
      actionIcon = <AlertCircle className="w-4 h-4" />;
      break;
    case 'in_progress':
      actionLabel = 'Marcar en progreso';
      actionIcon = <Zap className="w-4 h-4" />;
      break;
    case 'resolved':
      actionLabel = 'Marcar resuelto';
      actionIcon = <CheckCircle className="w-4 h-4" />;
      break;
    default:
      break;
  }

  return (
    <div className="w-full p-5 transition-shadow bg-white border border-gray-200 shadow-sm dark:bg-slate-800 rounded-xl dark:border-slate-700 hover:shadow-md">
      <div className="flex justify-end mb-2">
        {next && onQuickResolve && (
          <button
            onClick={() => onQuickResolve(incident.id)}
            disabled={updatingId === incident.id}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            title={actionLabel}
          >
            {actionIcon}
            {actionLabel}
          </button>
        )}
      </div>
      <button onClick={onClick} className="w-full text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${severityColorCls(incident.severity)}`}>
                <AlertTriangle className="w-4 h-4" /> {SEVERITY_LABELS[incident.severity]}
              </span>
              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                <StatusIcon status={incident.status} className="w-4 h-4" /> {incident.status.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200">
                {incident.area}
              </span>
            </div>

            <div className="text-sm font-semibold text-blue-700 uppercase dark:text-blue-400">{incident.type.replace('_', ' ')}</div>
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
                  <Camera className="w-4 h-4 text-gray-400 dark:text-gray-500" /> {incident.photos.length} foto{incident.photos.length === 1 ? '' : 's'}
                </div>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export default IncidentCard;