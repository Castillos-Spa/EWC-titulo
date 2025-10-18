import React from 'react';
import type { CivilWorkType, CivilWorkStatus, CreateCivilWorkPayload } from '../../../types/CivilWork';
import { useCivilWorks } from '../hooks/useCivilWorks';

const WORK_TYPES: CivilWorkType[] = ['CONSTRUCTION','REPAIR','MAINTENANCE','INSPECTION'];
const STATUS: CivilWorkStatus[] = ['IN_PROGRESS','PENDING','ON_HOLD','COMPLETED'];

export const CreateCivilWorkModal: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { create } = useCivilWorks();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const getStr = (name: string, fallback = '') => {
      const val = fd.get(name);
      return typeof val === 'string' ? val : fallback;
    };

    const project = getStr('project').trim();
    const location = getStr('location').trim();
    const startDateInput = getStr('startDate');
    const estimatedEndDateInput = getStr('estimatedEndDate');
    const startDate = startDateInput ? new Date(startDateInput).toISOString() : new Date().toISOString();
    const estimatedEndDate = estimatedEndDateInput ? new Date(estimatedEndDateInput).toISOString() : startDate;
    const workType = (getStr('workType') || 'CONSTRUCTION') as CivilWorkType;
    const status = (getStr('status') || 'IN_PROGRESS') as CivilWorkStatus;
    const observations = getStr('observations');
    const issuesText = getStr('issues');
    const issues = issuesText ? issuesText.split('\n').map(s=>s.trim()).filter(Boolean) : [];
    const staffText = getStr('responsibleStaffUsernames');
    const responsibleStaffUsernames = staffText ? staffText.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const materialsText = getStr('materialsUsed');
    const materialsUsed = materialsText ? materialsText.split('\n').map(s=>s.trim()).filter(Boolean) : [];
    const tasksText = getStr('tasks');
    const taskNames = tasksText ? tasksText.split(',').map(s=>s.trim()).filter(Boolean) : [];
    const tasks = taskNames.map(name => ({ name, completed: false }));

    const payload: CreateCivilWorkPayload = {
      project,
      location,
      startDate,
      estimatedEndDate,
      workType,
      tasks,
      progress: 0,
      status,
      observations,
      issues,
      photos: [],
      responsibleStaffUsernames,
      materialsUsed,
    };

    await create(payload);
    onClose();
    form.reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nueva Obra Civil</h3>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Registra un nuevo proyecto</p>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="cw-project" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Proyecto</label>
              <input id="cw-project" name="project" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="cw-location" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Ubicación</label>
              <input id="cw-location" name="location" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="cw-startDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Inicio</label>
              <input id="cw-startDate" type="date" name="startDate" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="cw-estimatedEndDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Término Estimado</label>
              <input id="cw-estimatedEndDate" type="date" name="estimatedEndDate" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="cw-type" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
              <select id="cw-type" name="workType" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {WORK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cw-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
              <select id="cw-status" name="status" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="cw-staff" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal Responsable (coma)</label>
            <input id="cw-staff" name="responsibleStaffUsernames" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
          </div>
          <div>
            <label htmlFor="cw-tasks" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tareas (separadas por coma)</label>
            <input id="cw-tasks" name="tasks" className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="cw-issues" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Incidencias</label>
              <textarea id="cw-issues" name="issues" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="cw-materials" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Materiales (una por línea)</label>
              <textarea id="cw-materials" name="materialsUsed" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label htmlFor="cw-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
            <textarea id="cw-observations" name="observations" rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg dark:border-slate-600 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCivilWorkModal;
