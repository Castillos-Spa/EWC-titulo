import React from 'react';
import { CLEANING_TASK_OPTIONS } from './constants';
import type { Aseo } from '../../../types/Aseo';

export const CreateCleaningModal: React.FC<{
  onClose: () => void;
  onCreate: (payload: Partial<Aseo>) => Promise<void>;
}> = ({ onClose, onCreate }) => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const dateVal = fd.get('date');
    const date = typeof dateVal === 'string' && dateVal ? dateVal : new Date().toISOString();
    const timeSpentVal = fd.get('timeSpent');
    const timeSpent = typeof timeSpentVal === 'string' && timeSpentVal ? Number(timeSpentVal) : 0;
    const areaVal = fd.get('area');
    const area = typeof areaVal === 'string' ? areaVal.trim() : '';
    const responsibleStaffVal = fd.get('responsibleStaff');
    const responsibleStaff = typeof responsibleStaffVal === 'string' ? responsibleStaffVal.trim() : '';
    const tasks = fd.getAll('tasks').map((v) => (typeof v === 'string' ? v : '')).filter(Boolean);
    const issuesVal = fd.get('issues');
    const issuesText = typeof issuesVal === 'string' ? issuesVal : '';
    const issues = issuesText ? issuesText.split('\n').map(s => s.trim()).filter(Boolean) : [];
    const observationsVal = fd.get('observations');
    const observations = typeof observationsVal === 'string' && observationsVal.trim() ? observationsVal.trim() : undefined;
    const statusVal = fd.get('status');
    const status = (typeof statusVal === 'string' ? statusVal : 'PENDING').toUpperCase() as Aseo['status'];
    const payload: Partial<Aseo> = { date, area, tasks, responsibleStaff, timeSpent, issues, status, observations };
    await onCreate(payload);
    onClose();
    form.reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nuevo Reporte de Limpieza</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Registrar actividades diarias de limpieza y problemas encontrados</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="report-date" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</label>
              <input type="date" id="report-date" name="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label htmlFor="report-time" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tiempo Trabajado (horas)</label>
              <input type="number" step="0.5" placeholder="4.5" id="report-time" name="timeSpent" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
            </div>
          </div>
          <div>
            <label htmlFor="report-area" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área/Ubicación</label>
            <input type="text" placeholder="Almacén A - Planta Principal" id="report-area" name="area" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>
          <div>
            <label htmlFor="report-staff" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable</label>
            <input type="text" id="report-staff" name="responsibleStaff" placeholder="Nombre del personal" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500" />
          </div>
          <fieldset>
            <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tareas Completadas</legend>
            <div className="grid grid-cols-2 gap-2">
              {CLEANING_TASK_OPTIONS.map((task, idx) => {
                const id = `task-${idx}`;
                return (
                  <div key={task} className="flex items-center gap-2">
                    <input id={id} name="tasks" value={task} type="checkbox" className="text-blue-600 border-gray-300 rounded dark:border-slate-600 focus:ring-blue-500" />
                    <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">{task}</label>
                  </div>
                );
              })}
            </div>
          </fieldset>
          <div>
            <label htmlFor="report-issues" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Problemas Encontrados</label>
            <textarea rows={3} placeholder="Describe cualquier problema..." id="report-issues" name="issues" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"></textarea>
          </div>
          <div>
            <label htmlFor="report-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
            <textarea rows={3} placeholder="Observaciones adicionales o notas..." id="report-observations" name="observations" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"></textarea>
          </div>
          <div>
            <label htmlFor="report-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
            <select id="report-status" name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
              <option value="COMPLETED">Completado</option>
              <option value="PARTIAL">Parcialmente Completado</option>
              <option value="PENDING">Pendiente</option>
            </select>
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg dark:border-slate-600 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Guardar Reporte</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCleaningModal;
