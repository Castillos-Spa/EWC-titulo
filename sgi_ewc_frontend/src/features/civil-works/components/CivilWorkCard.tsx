import React from 'react';
import type { CivilWork, CivilWorkStatus, CivilWorkType } from '../../../types/CivilWork';
import { Calendar, MapPin, CheckCircle, Clock, AlertTriangle, Hammer } from 'lucide-react';

const statusColor = (status: CivilWorkStatus) => {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'ON_HOLD': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
    default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
  }
};

const statusIcon = (status: CivilWorkStatus) => {
  switch (status) {
    case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
    case 'IN_PROGRESS': return <Hammer className="w-4 h-4" />;
    case 'PENDING': return <Clock className="w-4 h-4" />;
    case 'ON_HOLD': return <AlertTriangle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

const typeLabel = (type: CivilWorkType) => {
  switch (type) {
    case 'CONSTRUCTION': return 'Construcción';
    case 'REPAIR': return 'Reparación';
    case 'MAINTENANCE': return 'Mantenimiento';
    case 'INSPECTION': return 'Inspección';
    default: return type;
  }
};

export const CivilWorkCard: React.FC<{
  item: Partial<CivilWork> & Pick<CivilWork, 'id' | 'project' | 'location' | 'startDate' | 'estimatedEndDate' | 'status' | 'workType' | 'progress'>;
  onView: (id: number) => void;
}> = ({ item, onView }) => {
  return (
    <div className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.project}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Obra #{item.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Inicio:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(item.startDate).toLocaleDateString('es-CL')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Estimada:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{new Date(item.estimatedEndDate).toLocaleDateString('es-CL')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{typeLabel(item.workType)}</span>
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progreso</span>
            <div className="w-full h-3 mt-2 bg-gray-200 rounded-full dark:bg-slate-700">
              <div className="h-3 bg-blue-600 rounded-full" style={{ width: `${item.progress}%` }} />
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${statusColor(item.status)}`}>
          {statusIcon(item.status)}
          <span className="capitalize">{item.status.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <button onClick={() => onView(item.id)} className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Ver Detalles</button>
      </div>
    </div>
  );
};

export default CivilWorkCard;
