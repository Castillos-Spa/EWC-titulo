import React, { useState } from 'react';
import { Plus, Search, Calendar, MapPin, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface CleaningReport {
  id: string;
  date: string;
  area: string;
  tasks: string[];
  responsibleStaff: string;
  timeSpent: number;
  issues: string[];
  status: 'completed' | 'partial' | 'pending';
  observations: string;
}

const CleaningReports: React.FC = () => {
  const [reports] = useState<CleaningReport[]>([
    {
      id: '1',
      date: '2025-01-27',
      area: 'Warehouse A - Main Floor',
      tasks: ['Floor mopping', 'Window cleaning', 'Trash collection', 'Restroom sanitization'],
      responsibleStaff: 'Maria Cleaning',
      timeSpent: 4.5,
      issues: ['Broken window in section C'],
      status: 'completed',
      observations: 'Area cleaned thoroughly, found broken window that needs repair'
    },
    {
      id: '2',
      date: '2025-01-27',
      area: 'Office Building - 2nd Floor',
      tasks: ['Desk cleaning', 'Vacuum carpets', 'Kitchen area', 'Meeting rooms'],
      responsibleStaff: 'Ana Rodriguez',
      timeSpent: 3.0,
      issues: [],
      status: 'completed',
      observations: 'All areas completed as scheduled'
    },
    {
      id: '3',
      date: '2025-01-27',
      area: 'Parking Lot - External Areas',
      tasks: ['Sweeping', 'Litter collection', 'Drain cleaning'],
      responsibleStaff: 'Carlos Maintenance',
      timeSpent: 2.0,
      issues: ['Clogged drain in section B'],
      status: 'partial',
      observations: 'Weather prevented complete cleaning of external areas'
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: CleaningReport['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const getStatusIcon = (status: CleaningReport['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'partial': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredReports = reports.filter(report =>
    report.area.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.responsibleStaff.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reportes de Limpieza</h2>
          <p className="text-gray-600 dark:text-gray-400">Actividades diarias de limpieza y reportes de mantenimiento</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Reporte</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tareas de Hoy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{reports.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
              <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Horas Trabajadas</p>
              <p className="text-2xl font-bold text-blue-600">{reports.reduce((sum, r) => sum + r.timeSpent, 0)}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Problemas Encontrados</p>
              <p className="text-2xl font-bold text-yellow-600">{reports.reduce((sum, r) => sum + r.issues.length, 0)}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por área o personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Buscar reportes"
            className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
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

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">Fecha:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{report.date}</span>
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

                {/* Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Tareas Completadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.tasks.map((task) => (
                      <span key={`${report.id}-${task}`} className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs rounded-full">
                        {task}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {report.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Problemas Encontrados:</span>
                    </h4>
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

                {/* Observations */}
                {report.observations && (
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Observaciones:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{report.observations}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-100 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                  Ver Detalles
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredReports.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No se encontraron reportes</h3>
          <p className="text-gray-600 dark:text-gray-400">Intenta ajustar tu búsqueda o crear un nuevo reporte de limpieza.</p>
        </div>
      )}

      {/* New Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nuevo Reporte de Limpieza</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Registrar actividades diarias de limpieza y problemas encontrados</p>
            </div>
            
            <form className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fecha</label>
                  <input
                    type="date"
                    id="report-date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="report-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tiempo Trabajado (horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="4.5"
                    id="report-time"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="report-area" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área/Ubicación</label>
                <input
                  type="text"
                  placeholder="Almacén A - Planta Principal"
                  id="report-area"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="report-staff" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Personal Responsable</label>
                <select id="report-staff" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                  <option>Seleccionar personal</option>
                  <option>Maria Cleaning</option>
                  <option>Ana Rodriguez</option>
                  <option>Carlos Maintenance</option>
                </select>
              </div>

              <fieldset>
                <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tareas Completadas</legend>
                <div className="grid grid-cols-2 gap-2">
                  {['Trapear pisos', 'Limpiar ventanas', 'Recolección basura', 'Sanitización baños', 'Limpiar escritorios', 'Aspirar alfombras', 'Área cocina', 'Salas reuniones'].map((task, idx) => {
                    const id = `task-${idx}`;
                    return (
                      <div key={task} className="flex items-center gap-2">
                        <input id={id} type="checkbox" className="rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500" />
                        <label htmlFor={id} className="text-sm text-gray-700 dark:text-gray-300">{task}</label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="report-issues" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Problemas Encontrados</label>
                <textarea
                  rows={3}
                  placeholder="Describe cualquier problema encontrado durante la limpieza..."
                  id="report-issues"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              <div>
                <label htmlFor="report-observations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Observaciones</label>
                <textarea
                  rows={3}
                  placeholder="Observaciones adicionales o notas..."
                  id="report-observations"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

              <div>
                <label htmlFor="report-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Estado</label>
                <select id="report-status" className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:text-gray-100">
                  <option value="completed">Completado</option>
                  <option value="partial">Parcialmente Completado</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-100 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Reporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningReports;