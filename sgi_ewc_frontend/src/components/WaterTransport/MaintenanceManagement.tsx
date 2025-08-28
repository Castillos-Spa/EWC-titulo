import React, { useState } from 'react';
import { Plus, Search, Filter, Wrench, Calendar, DollarSign, User, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  type: 'preventive' | 'corrective' | 'emergency';
  status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
  scheduledDate: string;
  completedDate?: string;
  description: string;
  technician: string;
  cost: number;
  partsUsed: string[];
  observations: string;
  nextServiceDate?: string;
}

const MaintenanceManagement: React.FC = () => {
  const { t } = useLanguage();
  const [maintenanceRecords] = useState<MaintenanceRecord[]>([
    {
      id: '1',
      vehicleId: '1',
      vehiclePlate: 'TK-001',
      type: 'preventive',
      status: 'completed',
      scheduledDate: '2025-01-15',
      completedDate: '2025-01-15',
      description: 'Cambio de aceite y filtros',
      technician: 'Carlos Mecánico',
      cost: 250000,
      partsUsed: ['Aceite motor 15W40', 'Filtro de aceite', 'Filtro de aire'],
      observations: 'Mantenimiento completado sin inconvenientes',
      nextServiceDate: '2025-04-15'
    },
    {
      id: '2',
      vehicleId: '2',
      vehiclePlate: 'TK-002',
      type: 'corrective',
      status: 'in_progress',
      scheduledDate: '2025-01-20',
      description: 'Reparación sistema de frenos',
      technician: 'Miguel Técnico',
      cost: 450000,
      partsUsed: ['Pastillas de freno', 'Discos de freno', 'Líquido de frenos'],
      observations: 'Reemplazo completo del sistema de frenos delantero'
    },
    {
      id: '3',
      vehicleId: '3',
      vehiclePlate: 'TK-003',
      type: 'preventive',
      status: 'scheduled',
      scheduledDate: '2025-02-01',
      description: 'Inspección general y cambio de llantas',
      technician: 'Ana Técnica',
      cost: 800000,
      partsUsed: ['Llantas 295/80R22.5', 'Válvulas', 'Balanceado'],
      observations: 'Mantenimiento programado cada 3 meses'
    },
    {
      id: '4',
      vehicleId: '1',
      vehiclePlate: 'TK-001',
      type: 'emergency',
      status: 'overdue',
      scheduledDate: '2025-01-25',
      description: 'Falla en sistema eléctrico',
      technician: 'Luis Electricista',
      cost: 180000,
      partsUsed: ['Alternador', 'Cables', 'Fusibles'],
      observations: 'Reparación urgente requerida'
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <Wrench className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preventive': return 'bg-blue-100 text-blue-800';
      case 'corrective': return 'bg-yellow-100 text-yellow-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRecords = maintenanceRecords.filter(record => {
    const matchesSearch = record.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.technician.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesType = filterType === 'all' || record.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalCost = maintenanceRecords.reduce((sum, record) => sum + record.cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('maintenance.title')}</h2>
          <p className="text-gray-600">{t('maintenance.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{t('maintenance.newMaintenance')}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('maintenance.scheduled')}</p>
              <p className="text-2xl font-bold text-yellow-600">{maintenanceRecords.filter(r => r.status === 'scheduled').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('maintenance.completed')}</p>
              <p className="text-2xl font-bold text-green-600">{maintenanceRecords.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('maintenance.overdue')}</p>
              <p className="text-2xl font-bold text-red-600">{maintenanceRecords.filter(r => r.status === 'overdue').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{t('maintenance.totalCost')}</p>
              <p className="text-2xl font-bold text-blue-600">${totalCost.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`${t('common.search')} por vehículo, descripción o técnico...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="scheduled">Programados</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completados</option>
            <option value="overdue">Vencidos</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Todos los Tipos</option>
            <option value="preventive">Preventivo</option>
            <option value="corrective">Correctivo</option>
            <option value="emergency">Emergencia</option>
          </select>
        </div>
      </div>

      {/* Maintenance Records */}
      <div className="grid gap-6">
        {filteredRecords.map((record) => (
          <div key={record.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Wrench className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{record.vehiclePlate}</h3>
                      <p className="text-gray-600">{record.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(record.status)}`}>
                      {getStatusIcon(record.status)}
                      <span className="capitalize">{record.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(record.type)}`}>
                      {t(`maintenance.${record.type}`)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-600">Fecha Programada</p>
                    <p className="font-medium">{record.scheduledDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('maintenance.technician')}</p>
                    <p className="font-medium">{record.technician}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('maintenance.cost')}</p>
                    <p className="font-medium">${record.cost.toLocaleString()}</p>
                  </div>
                  {record.completedDate && (
                    <div>
                      <p className="text-gray-600">Fecha Completada</p>
                      <p className="font-medium">{record.completedDate}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">{t('maintenance.partsUsed')}:</h4>
                    <div className="flex flex-wrap gap-2">
                      {record.partsUsed.map((part, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>

                  {record.observations && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Observaciones:</h4>
                      <p className="text-sm text-gray-600">{record.observations}</p>
                    </div>
                  )}

                  {record.nextServiceDate && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Próximo Servicio:</span>
                        <span className="font-medium">{record.nextServiceDate}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                <button 
                  onClick={() => setSelectedRecord(record)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.viewDetails')}
                </button>
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  {t('common.edit')}
                </button>
                {record.status === 'scheduled' && (
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                    Iniciar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron registros</h3>
          <p className="text-gray-600">Intenta ajustar tu búsqueda o crear un nuevo registro de mantenimiento.</p>
        </div>
      )}

      {/* New Maintenance Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Nuevo Registro de Mantenimiento</h3>
              <p className="text-gray-600 mt-1">Programa o registra una actividad de mantenimiento</p>
            </div>
            
            <form className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('maintenance.vehicle')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Seleccionar vehículo</option>
                    <option>TK-001 - Volvo Water Tank</option>
                    <option>TK-002 - Mercedes Water Tank</option>
                    <option>TK-003 - Scania Water Tank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('maintenance.type')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="preventive">Preventivo</option>
                    <option value="corrective">Correctivo</option>
                    <option value="emergency">Emergencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  type="text"
                  placeholder="Cambio de aceite y filtros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Programada</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('maintenance.technician')}</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Seleccionar técnico</option>
                    <option>Carlos Mecánico</option>
                    <option>Miguel Técnico</option>
                    <option>Ana Técnica</option>
                    <option>Luis Electricista</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Costo Estimado</label>
                <input
                  type="number"
                  placeholder="250000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Repuestos/Materiales</label>
                <textarea
                  rows={3}
                  placeholder="Lista de repuestos y materiales necesarios..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Observaciones</label>
                <textarea
                  rows={3}
                  placeholder="Observaciones adicionales..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
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
                  Programar Mantenimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Detalle de Mantenimiento</h3>
              <p className="text-gray-600 mt-1">{selectedRecord.vehiclePlate} - {selectedRecord.description}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.status)}`}>
                    {selectedRecord.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedRecord.type)}`}>
                    {t(`maintenance.${selectedRecord.type}`)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Programada</label>
                  <p className="mt-1">{selectedRecord.scheduledDate}</p>
                </div>
                {selectedRecord.completedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Completada</label>
                    <p className="mt-1">{selectedRecord.completedDate}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Técnico Responsable</label>
                <p className="mt-1">{selectedRecord.technician}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Costo</label>
                <p className="mt-1 text-lg font-semibold">${selectedRecord.cost.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Repuestos Utilizados</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRecord.partsUsed.map((part, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <p className="mt-1 text-gray-600">{selectedRecord.observations}</p>
              </div>

              {selectedRecord.nextServiceDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Próximo Servicio</label>
                  <p className="mt-1">{selectedRecord.nextServiceDate}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
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

export default MaintenanceManagement;