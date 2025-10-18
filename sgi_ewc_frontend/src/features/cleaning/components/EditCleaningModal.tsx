import React from 'react';
import type { Aseo } from '../../../types/Aseo';
import { CLEANING_TASK_OPTIONS } from './constants';

function isoToDateInput(iso?: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

export const EditCleaningModal: React.FC<{
  report: Aseo;
  onClose: () => void;
  onUpdate: (id: string, payload: Partial<Aseo>) => Promise<void>;
}> = ({ report, onClose, onUpdate }) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const dateVal = fd.get('date');
    const date = typeof dateVal === 'string' && dateVal ? dateVal : report.date;
    const timeSpentVal = fd.get('timeSpent');
    const timeSpent = typeof timeSpentVal === 'string' && timeSpentVal ? Number(timeSpentVal) : report.timeSpent;
    const areaVal = fd.get('area');
    const area = typeof areaVal === 'string' ? areaVal.trim() : report.area;
    const responsibleStaffVal = fd.get('responsibleStaff');
    const responsibleStaff = typeof responsibleStaffVal === 'string' ? responsibleStaffVal.trim() : report.responsibleStaff;
    const tasks = fd.getAll('tasks').map((v) => (typeof v === 'string' ? v : '')).filter(Boolean);
    const issuesVal = fd.get('issues');
    const issuesText = typeof issuesVal === 'string' ? issuesVal : '';
    const issues = issuesText ? issuesText.split('\n').map(s => s.trim()).filter(Boolean) : report.issues;
    const observationsVal = fd.get('observations');
    const observations = typeof observationsVal === 'string' && observationsVal.trim() ? observationsVal.trim() : report.observations;
    const statusVal = fd.get('status');
    const status = (typeof statusVal === 'string' ? statusVal : report.status).toUpperCase() as Aseo['status'];

    const payload: Partial<Aseo> = { date, area, tasks, responsibleStaff, timeSpent, issues, status, observations };
    await onUpdate(report.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Editar Reporte #{report.id}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="edit-date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
              <input id="edit-date" type="date" name="date" defaultValue={isoToDateInput(report.date)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="edit-time" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo Trabajado (horas)</label>
              <input id="edit-time" type="number" step="0.5" name="timeSpent" defaultValue={String(report.timeSpent)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label htmlFor="edit-area" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área/Ubicación</label>
            <input id="edit-area" name="area" defaultValue={report.area} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
          </div>
          <div>
            <label htmlFor="edit-staff" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable</label>
            <input id="edit-staff" name="responsibleStaff" defaultValue={report.responsibleStaff} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
          </div>
          <fieldset>
            <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tareas Completadas</legend>
            <div className="grid grid-cols-2 gap-2">
              {CLEANING_TASK_OPTIONS.map((task, idx) => {
                const id = `edit-task-${idx}`;
                return (
                  <div key={task} className="flex items-center gap-2">
                    <input id={id} name="tasks" value={task} type="checkbox" defaultChecked={report.tasks.includes(task)} className="text-blue-600 border border-gray-300 rounded dark:border-slate-600 focus:ring-blue-500" />
                    <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">{task}</label>
                  </div>
                );
              })}
            </div>
          </fieldset>
          <div>
            <label htmlFor="edit-issues" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Problemas Encontrados</label>
            <textarea id="edit-issues" name="issues" defaultValue={report.issues.join('\n')} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" rows={3} />
          </div>
          <div>
            <label htmlFor="edit-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
            <textarea id="edit-observations" name="observations" defaultValue={report.observations ?? ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" rows={3} />
          </div>
          <div>
            <label htmlFor="edit-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
            <select id="edit-status" name="status" defaultValue={report.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
              <option value="COMPLETED">Completado</option>
              <option value="PARTIAL">Parcialmente Completado</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded dark:border-slate-600 dark:text-slate-100 dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCleaningModal;
