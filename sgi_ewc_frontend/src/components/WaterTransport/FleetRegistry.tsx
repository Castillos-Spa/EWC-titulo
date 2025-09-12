import React, { useState } from 'react';
import { Plus, Search, Filter, Truck, Calendar, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';

interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  brand: string;
  year: number;
  mileage: number;
  status: 'active' | 'maintenance' | 'inactive';
  assignedArea: string;
  assignedDriver: string;
  lastMaintenance: string;
  nextMaintenance: string;
}

const FleetRegistry: React.FC = () => {
  const [vehicles] = useState<Vehicle[]>([
    {
      id: '1',
      plateNumber: 'TK-001',
      model: 'Water Tank Truck',
      brand: 'Volvo',
      year: 2020,
      mileage: 125000,
      status: 'active',
      assignedArea: 'North Route',
      assignedDriver: 'John Driver',
      lastMaintenance: '2025-01-15',
      nextMaintenance: '2025-04-15'
    },
    {
      id: '2',
      plateNumber: 'TK-002',
      model: 'Water Tank Truck',
      brand: 'Mercedes',
      year: 2019,
      mileage: 98000,
      status: 'maintenance',
      assignedArea: 'South Route',
      assignedDriver: 'Maria Santos',
      lastMaintenance: '2025-01-20',
      nextMaintenance: '2025-02-01'
    },
    {
      id: '3',
      plateNumber: 'TK-003',
      model: 'Water Tank Truck',
      brand: 'Scania',
      year: 2021,
      mileage: 67000,
      status: 'active',
      assignedArea: 'Emergency Response',
      assignedDriver: 'Carlos Rodriguez',
      lastMaintenance: '2025-01-10',
      nextMaintenance: '2025-04-10'
    },
    {
      id: '4',
      plateNumber: 'PK-001',
      model: 'Pickup Truck',
      brand: 'Toyota',
      year: 2018,
      mileage: 156000,
      status: 'active',
      assignedArea: 'Supervision',
      assignedDriver: 'Ana Supervisor',
      lastMaintenance: '2024-12-15',
      nextMaintenance: '2025-03-15'
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <Wrench className="w-4 h-4" />;
      case 'inactive': return <AlertTriangle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.assignedDriver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.assignedArea.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isMaintenanceDue = (nextMaintenance: string) => {
    const next = new Date(nextMaintenance);
    const today = new Date();
    const diffTime = next.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Registro de Flota</h2>
          <p className="text-gray-600">Gestiona todos los vehículos de la empresa y sus asignaciones</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Vehículo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'active').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Mantenimiento</p>
              <p className="text-2xl font-bold text-yellow-600">{vehicles.filter(v => v.status === 'maintenance').length}</p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mantenimiento Vencido</p>
              <p className="text-2xl font-bold text-red-600">{vehicles.filter(v => isMaintenanceDue(v.nextMaintenance)).length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por placa, marca, conductor o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid gap-6">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Vehicle Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{vehicle.plateNumber}</h3>
                      <p className="text-gray-600">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(vehicle.status)}`}>
                      {getStatusIcon(vehicle.status)}
                      <span className="capitalize">{vehicle.status}</span>
                    </span>
                    {isMaintenanceDue(vehicle.nextMaintenance) && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Due</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Kilometraje</p>
                    <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Área Asignada</p>
                    <p className="font-medium">{vehicle.assignedArea}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Conductor Asignado</p>
                    <p className="font-medium">{vehicle.assignedDriver}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Próximo Mantenimiento</p>
                    <p className={`font-medium ${isMaintenanceDue(vehicle.nextMaintenance) ? 'text-red-600' : 'text-gray-900'}`}>
                      {vehicle.nextMaintenance}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Último Mantenimiento:</span>
                      <span className="font-medium">{vehicle.lastMaintenance}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Ver Detalles
                </button>
                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                  Programar Mantenimiento
                </button>
                <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                  Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron vehículos</h3>
          <p className="text-gray-600">Intenta ajustar tu búsqueda o agregar un nuevo vehículo a la flota.</p>
        </div>
      )}

      {/* Add Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Agregar Nuevo Vehículo</h3>
              <p className="text-gray-600 mt-1">Registrar un nuevo vehículo en la flota</p>
            </div>
            
            <form className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Número de Placa</label>
                  <input
                    type="text"
                    placeholder="TK-004"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                  <input
                    type="text"
                    placeholder="Volvo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                  <input
                    type="text"
                    placeholder="Camión Cisterna"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Año</label>
                  <input
                    type="number"
                    placeholder="2023"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kilometraje Inicial (km)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="active">Activo</option>
                    <option value="maintenance">En Mantenimiento</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área Asignada</label>
                  <input
                    type="text"
                    placeholder="Ruta Norte"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conductor Asignado</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option>Seleccionar conductor</option>
                    <option>John Driver</option>
                    <option>Maria Santos</option>
                    <option>Carlos Rodriguez</option>
                    <option>Ana Supervisor</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Agregar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetRegistry;