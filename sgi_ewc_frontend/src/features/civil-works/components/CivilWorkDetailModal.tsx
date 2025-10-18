import React, { useCallback } from 'react';
import type { CivilWork, CivilWorkTask } from '../../../types/CivilWork';
import { useCivilWorks } from '../hooks/useCivilWorks';

function fmtDate(iso?: string | null) {
  if (!iso) return 'N/A';
  try { return new Date(iso).toLocaleDateString('es-CL'); } catch { return String(iso); }
}

export const CivilWorkDetailModal: React.FC<{
  report: CivilWork;
  onClose: () => void;
  onEdit?: (r: CivilWork) => void;
}> = ({ report, onClose, onEdit }) => {
  const { updateTasks } = useCivilWorks();

  const handleToggle = useCallback(async (idx: number) => {
    const list: CivilWorkTask[] = Array.isArray(report.tasks) ? report.tasks.map((t, i) => ({ ...t, completed: i === idx ? !t.completed : t.completed })) : [];
    await updateTasks(report.id, list);
  }, [report, updateTasks]);

  const staff = Array.isArray(report.responsibleStaffUsernames) ? report.responsibleStaffUsernames : [];
  const issues = Array.isArray(report.issues) ? report.issues : [];
  const materials = Array.isArray(report.materialsUsed) ? report.materialsUsed : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Detalle del Proyecto</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">{report.project}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{report.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Trabajo</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{report.workType}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Inicio</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{fmtDate(report.startDate)}</p>
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Estimada de Término</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{fmtDate(report.estimatedEndDate)}</p>
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Real de Término</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{report.actualEndDate ? fmtDate(report.actualEndDate) : 'Aún en progreso'}</p>
            </div>
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</p>
              <p className="mt-1 text-gray-900 dark:text-gray-100">{report.location}</p>
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {staff.map((s) => (
                <span key={`${report.id}-${s}`} className="px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-100">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tareas</p>
            <div className="mt-2 space-y-2">
              {report.tasks.map((task, index) => (
                <label key={`${report.id}-task-${task.name}-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-gray-50 dark:bg-slate-800/50">
                  <input type="checkbox" checked={task.completed} onChange={() => { void handleToggle(index); }} className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`}>{task.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Materiales Utilizados</p>
            <div className="grid grid-cols-2 gap-3 mt-2 md:grid-cols-3">
              {materials.map((m, i) => (
                <div key={`${report.id}-mat-${i}`} className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{m}</div>
                </div>
              ))}
            </div>
          </div>

          {issues.length > 0 && (
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Incidencias</p>
              <ul className="mt-1 text-sm text-gray-700 list-disc list-inside dark:text-gray-300">
                {issues.map((it, i) => <li key={`${report.id}-issue-${i}`}>{it}</li>)}
              </ul>
            </div>
          )}

          {report.observations && (
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{report.observations}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose} className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">Cerrar</button>
            {onEdit && (
              <button onClick={() => onEdit(report)} className="px-3 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Editar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilWorkDetailModal;
