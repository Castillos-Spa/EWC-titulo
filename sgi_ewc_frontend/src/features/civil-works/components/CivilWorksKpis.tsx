import React from 'react';
import { Hammer, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { useCivilWorks } from '../hooks/useCivilWorks';

export const CivilWorksKpis: React.FC = () => {
  const { items } = useCivilWorks();
  const total = items.length;
  const completed = items.filter((r) => r.status === 'COMPLETED').length;
  const inProgress = items.filter((r) => r.status === 'IN_PROGRESS').length;
  const onHold = items.filter((r) => r.status === 'ON_HOLD').length;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Proyectos</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
          </div>
          <Hammer className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
            <p className="text-2xl font-bold text-blue-600">{inProgress}</p>
          </div>
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">En Pausa</p>
            <p className="text-2xl font-bold text-yellow-600">{onHold}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
      </div>
    </div>
  );
};

export default CivilWorksKpis;
