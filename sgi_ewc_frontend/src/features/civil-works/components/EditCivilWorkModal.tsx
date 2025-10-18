import React from 'react';
import type { CivilWork, CivilWorkStatus } from '../../../types/CivilWork';
import { useCivilWorks } from '../hooks/useCivilWorks';

const STATUS: CivilWorkStatus[] = ['IN_PROGRESS','PENDING','ON_HOLD','COMPLETED'];

function isoToDateInput(iso?: string | null) {
  if (!iso) return '';
  try { return new Date(iso).toISOString().split('T')[0]; } catch { return ''; }
}

export const EditCivilWorkModal: React.FC<{
  report: CivilWork;
  onClose: () => void;
}> = ({ report, onClose }) => {
  const { update } = useCivilWorks();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);

    const getStr = (name: string, fallback = '') => {
      const val = fd.get(name);
      return typeof val === 'string' ? val : fallback;
    };

    const startDateInput = getStr('startDate', report.startDate);
    const estimatedEndDateInput = getStr('estimatedEndDate', report.estimatedEndDate);
    const actualEndDateInput = getStr('actualEndDate', report.actualEndDate ?? '');
    const status = (getStr('status', report.status) as CivilWorkStatus);
    const observations = getStr('observations', report.observations ?? '');
    const progressStr = getStr('progress', String(report.progress));
    const progress = Number(progressStr);

    const payload = {
      startDate: startDateInput ? new Date(startDateInput).toISOString() : report.startDate,
      estimatedEndDate: estimatedEndDateInput ? new Date(estimatedEndDateInput).toISOString() : report.estimatedEndDate,
      actualEndDate: actualEndDateInput ? new Date(actualEndDateInput).toISOString() : null,
      status,
      observations,
      progress: Number.isFinite(progress) ? progress : report.progress,
    } as Partial<CivilWork>;

    await update(report.id, payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Editar Obra #{report.id}</h3>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="cw-edit-startDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Inicio</label>
              <input id="cw-edit-startDate" type="date" name="startDate" defaultValue={isoToDateInput(report.startDate)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="cw-edit-estimatedEndDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Término Estimado</label>
              <input id="cw-edit-estimatedEndDate" type="date" name="estimatedEndDate" defaultValue={isoToDateInput(report.estimatedEndDate)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
            <div>
              <label htmlFor="cw-edit-actualEndDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Término Real</label>
              <input id="cw-edit-actualEndDate" type="date" name="actualEndDate" defaultValue={isoToDateInput(report.actualEndDate ?? undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="cw-edit-status" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
              <select id="cw-edit-status" name="status" defaultValue={report.status} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                {STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="cw-edit-progress" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Progreso (%)</label>
              <input id="cw-edit-progress" type="number" min={0} max={100} step={1} name="progress" defaultValue={String(report.progress)} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label htmlFor="cw-edit-observations" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
            <textarea id="cw-edit-observations" name="observations" defaultValue={report.observations ?? ''} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100" />
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg dark:border-slate-600 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
            <button type="submit" className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCivilWorkModal;
