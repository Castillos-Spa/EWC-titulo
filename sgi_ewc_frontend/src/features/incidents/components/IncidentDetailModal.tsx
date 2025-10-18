import React from 'react';
import type { Incident, IncidentStatus, IncidentSeverity } from '../../../types/Incident';
import { AlertTriangle } from 'lucide-react';

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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Cerrar" />
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
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-200">
              {STATUS_LABELS[incident.status]}
            </span>
          </div>

          <div>
            <div className="text-sm font-semibold text-blue-700 uppercase dark:text-blue-400">{incident.type.replace('_', ' ')}</div>
            <h4 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{incident.title}</h4>
            <p className="mt-2 text-gray-700 whitespace-pre-wrap dark:text-gray-300">{incident.description}</p>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default IncidentDetailModal;