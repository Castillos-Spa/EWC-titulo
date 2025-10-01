import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Wrench, Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { createTallerWorkOrder, getTallerWorkOrders, getVehiculosFromTaller, updateWorkOrderStatus } from '../../utils/tallerApi';
import { getUsers } from '../../utils/userApi';
import type { Vehiculo } from '../../types/Vehiculo';
import type { User as AppUser } from '../../types/User';
import type { OrdenTrabajo } from '../../types/OrdenTrabajo';
import type { CreateTallerWorkOrderPayload } from '../../utils/tallerApi';


const MaintenanceManagement: React.FC = () => {
  const [maintenanceRecords, setMaintenanceRecords] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState<Partial<CreateTallerWorkOrderPayload & { nextServiceDate?: string }>>({
    tipo: 'Preventivo',
    description: '',
    vehiculoId: undefined,
    responsableId: undefined,
    scheduledDate: '',
    nextServiceDate: '',
    estimatedCost: undefined,
    repuestos: [],
    observations: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [selectedRecord, setSelectedRecord] = useState<OrdenTrabajo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      loadData();
    };
    fetchData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, vehiclesData, usersData] = await Promise.all([getTallerWorkOrders(), getVehiculosFromTaller(), getUsers()]);
      setMaintenanceRecords(records);
      setVehicles(vehiclesData);
      setUsers(usersData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos de mantenimiento.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const mechanics = useMemo(() => {
    return users.filter(user =>
      user.roleAssignments?.some(
        assignment =>
          assignment.specialty === 'MECHANIC'
      )
    );
  }, [users]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRecord(prev => {
      const updatedRecord = { ...prev, [name]: value };

      // Si el campo que cambia es el vehiculoId, actualizamos la fecha programada.
      if (name === 'vehiculoId') {
        const selectedVehicle = vehicles.find(v => v.id === Number(value));
        updatedRecord.scheduledDate = selectedVehicle?.lastMaintenanceDate?.split('T')[0] || '';
      }
      return updatedRecord;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.vehiculoId || !newRecord.description) {
      alert('Por favor, complete los campos de vehículo y descripción.');
      return;
    }
    setIsSubmitting(true);
    try {
      // Aseguramos que todos los campos del estado 'newRecord' se incluyan en el payload.
      const payload: CreateTallerWorkOrderPayload = {
        vehiculoId: Number(newRecord.vehiculoId),
        tipo: newRecord.tipo || 'Preventivo',
        description: newRecord.description!,
        responsableId: newRecord.responsableId ? Number(newRecord.responsableId) : undefined,
        estimatedCost: newRecord.estimatedCost ? Number(newRecord.estimatedCost) : undefined,
        scheduledDate: newRecord.scheduledDate || undefined,
        repuestos: newRecord.repuestos || [],
        observations: newRecord.observations || undefined,
        nextServiceDate: newRecord.nextServiceDate || undefined,
      };
      await createTallerWorkOrder(payload);
      setShowForm(false);
      setNewRecord({ // Reset form
        tipo: 'Preventivo',
        description: '',
        vehiculoId: undefined,
        responsableId: undefined,
        scheduledDate: '',
        nextServiceDate: '',
        estimatedCost: undefined,
        repuestos: [],
        observations: '',
      });
      await loadData(); // Recargar datos
    } catch (err) {
      alert('Error al crear la orden de trabajo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: OrdenTrabajo['estado']) => {
    try {
      const updatedRecord = await updateWorkOrderStatus(id, newStatus);
      setMaintenanceRecords(prevRecords =>
        prevRecords.map(r => (r.id === id ? updatedRecord : r))
      );
    } catch (err) {
      alert(`Error al cambiar el estado a "${newStatus}".`);
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'abierta':
        return 'bg-yellow-100 text-yellow-800';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800';
      case 'pendiente_revision':
        return 'bg-purple-100 text-purple-800';
      case 'completado':
        return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'en_progreso': return <Wrench className="w-4 h-4" />;
      case 'abierta': return <Clock className="w-4 h-4" />;
      case 'pendiente_revision': return <Eye className="w-4 h-4" />;
      case 'completado': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />; // NOSONAR
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
    const vehicle = vehicles.find(v => v.id === record.vehiculoId);
    const technician = users.find(u => u.id === record.responsableId);
    const matchesSearch = (vehicle?.patente.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
                         (technician?.username.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesType = filterType === 'all' || record.type === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalCost = maintenanceRecords.reduce((sum, record) => sum + (record.estimatedCost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Mantenimiento</h2>
          <p className="text-gray-600">Programa y gestiona mantenimientos de vehículos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Mantenimiento</span>
        </button>
      </div>

      {loading && <div className="p-4 text-center">Cargando registros...</div>}
      {error && <div className="p-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Programados</p>
              <p className="text-2xl font-bold text-yellow-600">{maintenanceRecords.filter(r => r.status === 'scheduled').length}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-green-600">{maintenanceRecords.filter(r => r.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{maintenanceRecords.filter(r => r.status === 'overdue').length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="text-2xl font-bold text-blue-600">${totalCost.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar por vehículo, descripción o técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          <div key={record.id} className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                      <Wrench className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{vehicles.find(v => v.id === record.vehiculoId)?.patente || 'N/A'}</h3>
                      <p className="text-gray-600">{record.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(record.estado)}`}>
                      {getStatusIcon(record.estado)}
                      <span className="capitalize">{record.estado.replace('_', ' ')}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(record.tipo)}`}>
                      {record.tipo === 'Preventivo' ? 'Preventivo' : 
                       record.tipo === 'Correctivo' ? 'Correctivo' : 'Emergencia'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-gray-600">Fecha Programada</p>
                    <p className="font-medium">{record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Última Mantención</p>
                    <p className="font-medium">
                      {vehicles.find(v => v.id === record.vehiculoId)?.lastMaintenanceDate ? new Date(vehicles.find(v => v.id === record.vehiculoId)!.lastMaintenanceDate!).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Técnico</p>
                    <p className="font-medium">{users.find(u => u.id === record.responsableId)?.username || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Costo</p>
                    <p className="font-medium">${(record.estimatedCost || 0).toLocaleString()}</p>
                  </div>                  
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-gray-900">Repuestos Utilizados:</h4>
                    <div className="flex flex-wrap gap-2">
                      {record.repuestos.map((part, index) => (
                        <span key={index} className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded-full">
                          {part}
                        </span>
                      ))}
                      {record.repuestos.length === 0 && <span className="text-xs text-gray-500">No se han registrado repuestos.</span>}
                    </div>
                  </div>

                  {record.observations && (
                    <div>
                      <h4 className="mb-1 text-sm font-medium text-gray-900">Observaciones:</h4>
                      <p className="text-sm text-gray-600">{record.observations}</p>
                    </div>
                  )}

                  {record.nextServiceDate && (
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Próximo Servicio:</span>
                        <span className="font-medium">{new Date(record.nextServiceDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                <button 
                  onClick={() => setSelectedRecord(record)}
                  className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Ver Detalles
                </button>
                <button className="px-4 py-2 text-blue-700 transition-colors bg-blue-100 rounded-lg hover:bg-blue-200">
                  Editar
                </button>
                {record.estado === 'abierta' && (
                  <button 
                    onClick={() => handleStatusChange(record.id, 'en_progreso')}
                    className="px-4 py-2 text-green-700 transition-colors bg-green-100 rounded-lg hover:bg-green-200"
                  >
                    Iniciar
                  </button>
                )}
                {record.estado === 'en_progreso' && (
                  <button 
                    onClick={() => handleStatusChange(record.id, 'pendiente_revision')}
                    className="px-4 py-2 text-purple-700 transition-colors bg-purple-100 rounded-lg hover:bg-purple-200"
                  >
                    Finalizar y Revisar
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <div className="py-12 text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">No se encontraron registros</h3>
          <p className="text-gray-600">Intenta ajustar tu búsqueda o crear un nuevo registro de mantenimiento.</p>
        </div>
      )}

      {/* New Maintenance Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Nuevo Registro de Mantenimiento</h3>
              <p className="mt-1 text-gray-600">Programa o registra una actividad de mantenimiento</p>
            </div>
            
            <form className="p-6 space-y-4" onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Vehículo</label>
                  <select 
                    name="vehiculoId"
                    value={newRecord.vehiculoId || ''}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar vehículo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.patente} - {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Tipo</label>
                  <select 
                    name="tipo"
                    value={newRecord.tipo || 'Preventivo'}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Preventivo">Preventivo</option>
                    <option value="Correctivo">Correctivo</option>
                    <option value="Emergencia">Emergencia</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Estado</label>
                <select 
                  name="estado"
                  value={newRecord.estado || 'abierta'}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="abierta">Abierta</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="cerrada">Cerrada</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Descripción</label>
                <input
                  name="description"
                  type="text"
                  value={newRecord.description || ''}
                  onChange={handleFormChange}
                  required
                  placeholder="Cambio de aceite y filtros"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Fecha Programada</label>
                  <input
                    name="scheduledDate"
                    type="date"
                    value={newRecord.scheduledDate ? newRecord.scheduledDate.split('T')[0] : ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">Técnico</label>
                  <select 
                    name="responsableId"
                    value={newRecord.responsableId || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar técnico</option>
                    {mechanics.map(m => (
                      <option key={m.id} value={m.id}>{m.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Costo Estimado</label>
                <input
                  name="estimatedCost"
                  type="number"
                  value={newRecord.estimatedCost || ''}
                  onChange={handleFormChange}
                  placeholder="250000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Repuestos/Materiales (separados por coma)</label>
                <textarea
                  name="repuestos"
                  rows={3}
                  value={Array.isArray(newRecord.repuestos) ? newRecord.repuestos.join(', ') : ''}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, repuestos: e.target.value.split(',').map(s => s.trim()) }))}
                  placeholder="Lista de repuestos y materiales necesarios..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Observaciones</label>
                <textarea
                  name="observations"
                  rows={3}
                  value={newRecord.observations || ''}
                  onChange={handleFormChange}
                  placeholder="Observaciones adicionales..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
              
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Fecha Próximo Servicio (Opcional)                  
                </label>
                <input
                  name="nextServiceDate"
                  value={newRecord.nextServiceDate || ''}
                  onChange={handleFormChange}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {isSubmitting ? 'Guardando...' : 'Programar Mantenimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Detalle de Mantenimiento</h3>
              <p className="mt-1 text-gray-600">{vehicles.find(v => v.id === selectedRecord.vehiculoId)?.patente} - {selectedRecord.description}</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedRecord.estado)}`}>
                    {selectedRecord.estado.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedRecord.tipo || '')}`}>
                    {selectedRecord.tipo === 'Preventivo' ? 'Preventivo' : 
                     selectedRecord.tipo === 'Correctivo' ? 'Correctivo' : 'Emergencia'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha Programada</label>
                  <p className="mt-1">{selectedRecord.scheduledDate ? new Date(selectedRecord.scheduledDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                {/* {selectedRecord.completedDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha Completada</label>
                    <p className="mt-1">{selectedRecord.completedDate}</p>
                  </div>
                )} */}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Técnico Responsable</label>
                <p className="mt-1">{users.find(u => u.id === selectedRecord.responsableId)?.username || 'No asignado'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Costo</label>
                <p className="mt-1 text-lg font-semibold">${(selectedRecord.estimatedCost || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Repuestos Utilizados</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedRecord.repuestos.map((part, index) => (
                    <span key={index} className="px-2 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                <p className="mt-1 text-gray-600">{selectedRecord.observations}</p>
              </div>

              {/* {selectedRecord.nextServiceDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Próximo Servicio</label>
                  <p className="mt-1">{selectedRecord.nextServiceDate}</p>
                </div>
              )} */}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
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