import React from 'react';
import type { Aseo } from '../../../types/Aseo';

function formatDate(iso?: string) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return iso ?? '';
  }
}

export const CleaningDetailModal: React.FC<{
  report: Aseo;
  onClose: () => void;
  onEdit: (r: Aseo) => void;
}> = ({ report, onClose, onEdit }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-lg p-6 text-gray-900 bg-white border border-gray-200 dark:bg-slate-800 dark:text-slate-100 rounded-xl dark:border-slate-700">
        <h3 className="mb-2 text-lg font-semibold">Detalle Reporte #{report.id}</h3>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Área: <span className="font-medium">{report.area}</span></p>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Fecha: <span className="font-medium">{formatDate(report.date)}</span></p>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Personal: <span className="font-medium">{report.responsibleStaff}</span></p>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">Tiempo: <span className="font-medium">{report.timeSpent}h</span></p>
        <div className="mb-2">
          <h4 className="text-sm font-medium">Tareas</h4>
          <div className="flex flex-wrap gap-2 mt-1">
            {report.tasks.map((t) => (<span key={t} className="px-2 py-1 text-xs bg-green-100 rounded-full dark:bg-green-900">{t}</span>))}
          </div>
        </div>
        {report.issues.length > 0 && (
          <div className="mb-2">
            <h4 className="text-sm font-medium">Problemas</h4>
            <ul className="mt-1 text-sm text-gray-700 list-disc list-inside dark:text-gray-300">
              {report.issues.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </div>
        )}
        {report.observations && (
          <div className="mb-2">
            <h4 className="text-sm font-medium">Observaciones</h4>
            <p className="text-sm text-gray-700 dark:text-gray-300">{report.observations}</p>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">Cerrar</button>
          <button onClick={() => onEdit(report)} className="px-3 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Editar</button>
        </div>
      </div>
    </div>
  );
};

export default CleaningDetailModal;
