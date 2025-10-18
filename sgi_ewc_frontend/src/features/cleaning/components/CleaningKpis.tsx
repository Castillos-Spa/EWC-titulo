import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useCleaning } from '../hooks/useCleaning';

export const CleaningKpis: React.FC = () => {
  const { items } = useCleaning();
  const total = items.length;
  const completed = items.filter((r) => r.status === 'COMPLETED').length;
  const hours = items.reduce((sum, r) => sum + (r.timeSpent || 0), 0);
  const issues = items.reduce((sum, r) => sum + (r.issues?.length || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Tareas de Hoy</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
            <p className="text-2xl font-bold text-green-600">{completed}</p>
          </div>
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Horas Trabajadas</p>
            <p className="text-2xl font-bold text-blue-600">{hours}h</p>
          </div>
          <Clock className="w-8 h-8 text-blue-600" />
        </div>
      </div>
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Problemas Encontrados</p>
            <p className="text-2xl font-bold text-yellow-600">{issues}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-yellow-600" />
        </div>
      </div>
    </div>
  );
};

export default CleaningKpis;
