import React from 'react';
import { Calendar, MapPin, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { Aseo } from '../../../types/Aseo';

function formatDate(iso?: string) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
  } catch {
    return iso ?? '';
  }
}

const getStatusColor = (status: Aseo['status']) => {
  switch (status) {
    case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
    case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    case 'PENDING': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
    default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
  }
};

const getStatusIcon = (status: Aseo['status']) => {
  switch (status) {
    case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
    case 'PARTIAL': return <AlertTriangle className="w-4 h-4" />;
    case 'PENDING': return <Clock className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export const CleaningCard: React.FC<{
  report: Aseo;
  onView: (r: Aseo) => void;
  onEdit: (r: Aseo) => void;
}> = ({ report, onView, onEdit }) => {
  return (
    <div className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-slate-800 dark:border-slate-700 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{report.area}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Report #{report.id}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
              {getStatusIcon(report.status)}
              <span className="capitalize">{report.status}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{formatDate(report.date)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">Tiempo:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{report.timeSpent}h</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 dark:text-gray-400">Personal:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{report.responsibleStaff}</span>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-gray-100">Tareas Completadas:</h4>
            <div className="flex flex-wrap gap-2">
              {report.tasks.map((task) => (
                <span key={`${report.id}-${task}`} className="px-2 py-1 text-xs text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-100">{task}</span>
              ))}
            </div>
          </div>

          {report.issues.length > 0 && (
            <div>
              <h4 className="flex items-center mb-2 space-x-2 text-sm font-medium text-gray-900 dark:text-gray-100"><AlertTriangle className="w-4 h-4 text-yellow-600" /> <span>Problemas Encontrados:</span></h4>
              <div className="space-y-1">
                {report.issues.map((issue) => (
                  <div key={`${report.id}-${issue}`} className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.observations && (
            <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
              <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">Observaciones:</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{report.observations}</p>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button onClick={() => onView(report)} className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg dark:bg-slate-700 dark:text-slate-100 hover:bg-gray-200 dark:hover:bg-slate-600">Ver Detalles</button>
          <button onClick={() => onEdit(report)} className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">Editar</button>
        </div>
      </div>
    </div>
  );
};

export default CleaningCard;
