import React, { useMemo, useState } from 'react';
import { Search, Filter, MapPin, Truck, Calendar, User, PlayCircle, CheckCircle2, Clock, Droplets } from 'lucide-react';

interface Trip {
  id: string;
  date: string;
  route: string;
  driver: string;
  vehicle: string;
  volumeTransported: number;
  status: 'completed' | 'in_progress' | 'pending';
  observations: string;
}

const TripReports: React.FC = () => {
  const [trips] = useState<Trip[]>([
    {
      id: '1',
      date: '2025-01-27',
      route: 'Warehouse A → Distribution Center B',
      driver: 'John Driver',
      vehicle: 'TK-001',
      volumeTransported: 15000,
      status: 'completed',
      observations: 'Normal delivery, no incidents'
    },
    {
      id: '2',
      date: '2025-01-27',
      route: 'Distribution Center B → Client Site C',
      driver: 'Maria Santos',
      vehicle: 'TK-002',
      volumeTransported: 12500,
      status: 'in_progress',
      observations: 'Traffic delay on highway'
    },
    {
      id: '3',
      date: '2025-01-26',
      route: 'Warehouse A → Emergency Site D',
      driver: 'Carlos Rodriguez',
      vehicle: 'TK-003',
      volumeTransported: 8000,
      status: 'completed',
      observations: 'Emergency delivery completed successfully'
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  };

  const filteredTrips = trips.filter(trip =>
    trip.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.vehicle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const total = filteredTrips.length;
    const completed = filteredTrips.filter(t => t.status === 'completed').length;
    const inProgress = filteredTrips.filter(t => t.status === 'in_progress').length;
    const pending = filteredTrips.filter(t => t.status === 'pending').length;
    const totalVolume = filteredTrips.reduce((sum, t) => sum + (t.volumeTransported || 0), 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, totalVolume, completionRate };
  }, [filteredTrips]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes de Viajes</h2>
          <p className="text-gray-600">Seguimiento de la ejecución y progreso en tiempo real</p>
        </div>
        {/* La creación de rutas/reportes se gestiona en Gestión de Rutas */}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Viajes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress.toLocaleString()}</p>
            </div>
            <PlayCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed.toLocaleString()}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending.toLocaleString()}</p>
            </div>
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Volumen Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalVolume.toLocaleString()} L</p>
              <p className="mt-1 text-xs text-gray-500">Tasa fin.: {stats.completionRate}%</p>
            </div>
            <Droplets className="w-8 h-8 text-cyan-600" />
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
              placeholder="Search trips by route, driver, or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Trip Cards */}
      <div className="grid gap-4">
        {filteredTrips.map((trip) => (
          <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{trip.route}</h3>
                      <p className="text-sm text-gray-600">Trip ID: {trip.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                    {getStatusLabel(trip.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{trip.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Conductor:</span>
                    <span className="font-medium">{trip.driver}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Vehículo:</span>
                    <span className="font-medium">{trip.vehicle}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Volumen:</span>
                    <span className="text-sm font-medium">{trip.volumeTransported.toLocaleString()} L</span>
                  </div>
                  {trip.observations && (
                    <div className="text-sm text-gray-600 max-w-xs">
                      <span className="font-medium">Notas:</span> {trip.observations}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-2">
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Ver Detalles
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTrips.length === 0 && (
        <div className="text-center py-12">
          <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron viajes</h3>
          <p className="text-gray-600">Intenta ajustar tu búsqueda. La creación de rutas se realiza en Gestión de Rutas.</p>
        </div>
      )}
      {/* Modal de creación eliminado: la planificación/creación se realiza en Gestión de Rutas */}
    </div>
  );
};

export default TripReports;