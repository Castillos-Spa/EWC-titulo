import React, { useState } from 'react';
import { Plus, Search, Calendar, MapPin, HardHat, CheckCircle, Clock, AlertTriangle, Hammer } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface CivilWorksReport {
  id: string;
  date: string;
  project: string;
  location: string;
  workType: 'construction' | 'repair' | 'maintenance' | 'inspection';
  tasks: string[];
  responsibleStaff: string[];
  materialsUsed: { name: string; quantity: number; unit: string }[];
  timeSpent: number;
  progress: number;
  issues: string[];
  status: 'completed' | 'in_progress' | 'pending' | 'on_hold';
  observations: string;
  photos?: string[];
}

const CivilWorks: React.FC = () => {
  const { t } = useLanguage();
  const [reports] = useState<CivilWorksReport[]>([
    {
      id: '1',
      date: '2025-01-27',
      project: 'Reparación de Muro Perimetral - Sector Norte',
      location: 'Perímetro Norte - Warehouse A',
      workType: 'repair',
      tasks: ['Demolición parcial', 'Preparación de superficie', 'Aplicación de mortero', 'Acabado final'],
      responsibleStaff: ['Carlos Constructor', 'Miguel Albañil', 'Ana Ayudante'],
      materialsUsed: [
        { name: 'Cemento', quantity: 10, unit: 'sacos' },
        { name: 'Arena', quantity: 2, unit: 'm³' },
        { name: 'Ladrillos', quantity: 500, unit: 'unidades' },
        { name: 'Hierro 3/8', quantity: 20, unit: 'varillas' }
      ],
      timeSpent: 8,
      progress: 75,
      issues: ['Encontrada tubería no registrada en planos'],
      status: 'in_progress',
      observations: 'Trabajo avanzando según cronograma, se requiere coordinación con plomería'
    },
    {
      id: '2',
      date: '2025-01-27',
      project: 'Construcción de Rampa de Acceso',
      location: 'Entrada Principal - Oficinas',
      workType: 'construction',
      tasks: ['Excavación', 'Fundición de base', 'Instalación de barandas', 'Acabado antideslizante'],
      responsibleStaff: ['Luis Ingeniero', 'Pedro Constructor', 'María Soldadora'],
      materialsUsed: [
        { name: 'Concreto premezclado', quantity: 5, unit: 'm³' },
        { name: 'Acero estructural', quantity: 50, unit: 'kg' },
        { name: 'Pintura antideslizante', quantity: 4, unit: 'galones' }
      ],
      timeSpent: 6,
      progress: 100,
      issues: [],
      status: 'completed',
      observations: 'Proyecto completado exitosamente, cumple con normativas de accesibilidad'
    },
    {
      id: '3',
      date: '2025-01-26',
      project: 'Mantenimiento de Techos - Bodega Central',
      location: 'Bodega Central - Área de Almacenamiento',
      workType: 'maintenance',
      tasks: ['Inspección de estructura', 'Limpieza de canales', 'Sellado de filtraciones', 'Pintura protectiva'],
      responsibleStaff: ['Roberto Techador', 'Sandra Pintora'],
      materialsUsed: [
        { name: 'Sellador acrílico', quantity: 8, unit: 'tubos' },
        { name: 'Pintura impermeabilizante', quantity: 6, unit: 'galones' },
        { name: 'Láminas de zinc', quantity: 12, unit: 'unidades' }
      ],
      timeSpent: 4.5,
      progress: 60,
      issues: ['Estructura presenta oxidación avanzada en sector este'],
      status: 'in_progress',
      observations: 'Se requiere reemplazo de algunas láminas por corrosión'
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState<CivilWorksReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Hammer className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'on_hold': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getWorkTypeColor = (type: string) => {
    switch (type) {
      case 'construction': return 'bg-blue-100 text-blue-800';
      case 'repair': return 'bg-yellow-100 text-yellow-800';
      case 'maintenance': return 'bg-green-100 text-green-800';
      case 'inspection': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkTypeLabel = (type: string) => {
    switch (type) {
      case 'construction': return 'Construcción';
      case 'repair': return 'Reparación';
      case 'maintenance': return 'Mantenimiento';
      case 'inspection': return 'Inspección';
      default: return type;
    }
  };

  const filteredReports = reports.filter(report =>
    report.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.responsibleStaff.some(staff => staff.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Obras Civiles</h2>
          <p className="text-gray-600">Gestión de proyectos de construcción, reparación y mantenimiento</p>
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
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Proyectos Activos</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
            <HardHat className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-blue-600">{reports.filter(r => r.status === 'in_progress').length}</p>
            </div>
            <Hammer className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Horas Trabajadas</p>
              <p className="text-2xl font-bold text-purple-600">{reports.reduce((sum, r) => sum + r.timeSpent, 0)}h</p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por proyecto, ubicación o personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6">
        {filteredReports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <HardHat className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{report.project}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {report.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                      {getStatusIcon(report.status)}
                      <span className="capitalize">{report.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeColor(report.workType)}`}>
                      {getWorkTypeLabel(report.workType)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso</span>
                    <span className="text-sm text-gray-600">{report.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${report.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{report.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Tiempo:</span>
                    <span className="font-medium">{report.timeSpent}h</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">Personal:</span>
                    <span className="font-medium">{report.responsibleStaff.length} personas</span>
                  </div>
                </div>

                {/* Tasks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Tareas Realizadas:</h4>
                  <div className="flex flex-wrap gap-2">
                    {report.tasks.map((task, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {task}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Materiales Utilizados:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {report.materialsUsed.map((material, index) => (
                      <div key={index} className="bg-blue-50 p-2 rounded">
                        <span className="font-medium">{material.name}</span>
                        <br />
                        <span className="text-gray-600">{material.quantity} {material.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                {report.issues.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span>Incidencias:</span>
                    </h4>
                    <div className="space-y-1">
                      {report.issues.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-sm text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Observations */}
                {report.observations && (
                  <div className="pt-3 border-t border-gray-100">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Observaciones:</h4>
                    <p className="text-sm text-gray-600">{report.observations}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedReport(report)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
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
          <HardHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron reportes</h3>
          <p className="text-gray-600">Intenta ajustar tu búsqueda o crear un nuevo reporte de obras civiles.</p>
        </div>
      )}

      {/* New Report Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Nuevo Reporte de Obras Civiles</h3>
              <p className="text-gray-600 mt-1">Registra un nuevo proyecto o actividad de construcción</p>
            </div>
            
            <form className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Trabajo</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="construction">Construcción</option>
                    <option value="repair">Reparación</option>
                    <option value="maintenance">Mantenimiento</option>
                    <option value="inspection">Inspección</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proyecto</label>
                <input
                  type="text"
                  placeholder="Reparación de Muro Perimetral - Sector Norte"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                <input
                  type="text"
                  placeholder="Perímetro Norte - Warehouse A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tiempo Trabajado (horas)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="8"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Progreso (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="75"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personal Responsable</label>
                <textarea
                  rows={2}
                  placeholder="Carlos Constructor, Miguel Albañil, Ana Ayudante"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tareas Realizadas</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Demolición', 'Excavación', 'Fundición', 'Albañilería', 'Soldadura', 'Pintura', 'Instalación', 'Acabados'].map((task) => (
                    <label key={task} className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">{task}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Materiales Utilizados</label>
                <textarea
                  rows={4}
                  placeholder="Cemento: 10 sacos&#10;Arena: 2 m³&#10;Ladrillos: 500 unidades&#10;Hierro 3/8: 20 varillas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Incidencias o Problemas</label>
                <textarea
                  rows={3}
                  placeholder="Describe cualquier incidencia o problema encontrado durante el trabajo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  rows={3}
                  placeholder="Observaciones adicionales sobre el progreso del proyecto..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del Proyecto</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="pending">Pendiente</option>
                  <option value="on_hold">En Espera</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t('common.cancel')}
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

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Detalle del Proyecto</h3>
              <p className="text-gray-600 mt-1">{selectedReport.project}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedReport.status)}`}>
                    {selectedReport.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo de Trabajo</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getWorkTypeColor(selectedReport.workType)}`}>
                    {getWorkTypeLabel(selectedReport.workType)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Progreso</label>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{selectedReport.progress}% completado</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full" 
                      style={{ width: `${selectedReport.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ubicación</label>
                  <p className="mt-1">{selectedReport.location}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tiempo Trabajado</label>
                  <p className="mt-1">{selectedReport.timeSpent} horas</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Personal Responsable</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedReport.responsibleStaff.map((staff, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {staff}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tareas Realizadas</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedReport.tasks.map((task, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {task}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Materiales Utilizados</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedReport.materialsUsed.map((material, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-sm">{material.name}</div>
                      <div className="text-gray-600 text-sm">{material.quantity} {material.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReport.issues.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Incidencias</label>
                  <div className="mt-2 space-y-2">
                    {selectedReport.issues.map((issue, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <p className="mt-1 text-gray-600">{selectedReport.observations}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CivilWorks;