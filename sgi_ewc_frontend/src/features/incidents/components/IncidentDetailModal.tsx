import React from 'react';
import type { Incident, IncidentStatus, IncidentSeverity } from '../../../types/Incident';
import { AlertTriangle, MapPin, X } from 'lucide-react';

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

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: 'Reportado',
  acknowledged: 'Reconocido',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
};

const IncidentDetailModal: React.FC<{ incident: Incident | null; onClose: () => void }> = ({ incident, onClose }) => {
  if (!incident) return null;
  // Determinar fondo del icono según severidad (evitar ternarios anidados en JSX)
  let severityBg = 'bg-gradient-to-br from-emerald-500 to-teal-500';
  if (incident.severity === 'critical') severityBg = 'bg-gradient-to-br from-rose-500 to-red-600';
  else if (incident.severity === 'high') severityBg = 'bg-gradient-to-br from-orange-500 to-amber-600';
  else if (incident.severity === 'medium') severityBg = 'bg-gradient-to-br from-yellow-500 to-amber-500';

  // Narrowing para location
  const isCoords = (loc: Incident['location']): loc is { latitude: number; longitude: number; address?: string } => {
    const obj = loc as Record<string, unknown>;
    return typeof obj?.latitude === 'number' && typeof obj?.longitude === 'number';
  };

  const loc = incident.location;
  const hasAddress = isCoords(loc) && !!loc.address;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Cerrar" />
      <dialog
        open
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50 via-white to-emerald-50 shadow-2xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-900/10"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 dark:border-white/10">
          <div className="flex items-center gap-3">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white shadow-lg ${severityBg}`}>
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 id="incident-detail-title" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              Detalle del incidente
            </h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-5">
          <section className="md:col-span-3 space-y-4">
            <div className="flex flex-wrap gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${severityColorCls(incident.severity)}`}>
                <AlertTriangle className="h-4 w-4" /> {SEVERITY_LABELS[incident.severity]}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10">
                {STATUS_LABELS[incident.status]}
              </span>
              {incident.area && (
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/30">
                  Área: {incident.area}
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">{incident.type.replace('_', ' ')}</div>
              <h4 className="text-2xl font-bold text-slate-900 dark:text-white">{incident.title}</h4>
              <p className="mt-2 whitespace-pre-wrap text-slate-700 dark:text-slate-300">{incident.description}</p>
            </div>
          </section>

          <aside className="md:col-span-2 space-y-4">
            {hasAddress && (
              <div className="rounded-3xl border border-slate-200/70 bg-white/80 px-4 py-4 text-slate-800 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-blue-200/70">
                  <MapPin className="h-4 w-4" /> Ubicación
                </div>
                <div className="text-sm">{isCoords(loc) ? loc.address : ''}</div>
                {isCoords(loc) && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {loc.latitude}, {loc.longitude}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={onClose} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-300 hover:text-rose-600 dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
                Cerrar
              </button>
            </div>
          </aside>
        </div>
      </dialog>
    </div>
  );
};

export default IncidentDetailModal;