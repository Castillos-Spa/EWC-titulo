import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Filter, Truck, Wrench, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { createVehiculoFromTaller, getVehiculosFromTaller, updateVehiculoFromTaller, type CreateVehiculoPayload } from '../../utils/tallerApi';
import type { Vehiculo, VehiculoStatus } from '../../types/Vehiculo';
import { getUsers } from '../../utils/userApi';
import type { User as AppUser } from '../../types/User';

const VEHICLE_AREAS = ['IT', 'Transporte', 'Obras', 'Aseo', 'RRHH', 'Finanza', 'P_Riesgo'];

const FleetRegistry: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingVehicle, setEditingVehicle] = useState<Vehiculo | null>(null);
  const [vehicleType, setVehicleType] = useState<'camion' | 'camioneta'>('camion');
  const [hasMaintenance, setHasMaintenance] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await getVehiculosFromTaller();
        setVehicles(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar los vehículos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const usersData = await getUsers();
        setUsers(usersData);
      } catch (err) {
        console.error('Error al cargar los usuarios:', err);
      }
    };

    fetchVehicles();
    fetchUsers();
  }, []);

  // Helpers seguros para leer valores desde FormData
  const getStr = (fd: FormData, key: string, fallback = ''): string => {
    const v = fd.get(key);
    return typeof v === 'string' ? v : fallback;
  };
  const getNum = (fd: FormData, key: string): number | undefined => {
    const v = fd.get(key);
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };
  const toInputDate = (d: Date | string | null | undefined): string => {
    if (!d) return '';
    const dt = typeof d === 'string' ? new Date(d) : d;
    try {
      return dt.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const driverId = getNum(formData, 'driver');
    const maintenanceDate = getStr(formData, 'lastMaintenanceDate');

    const estadoCreate = getStr(formData, 'estado') as unknown as CreateVehiculoPayload['estado'];
    const payload: CreateVehiculoPayload = {
      patente: getStr(formData, 'patente'),
      marca: getStr(formData, 'marca'),
      modelo: getStr(formData, 'modelo'),
      capacidad: vehicleType === 'camion' ? (getNum(formData, 'capacidad') ?? 0) : 0,
      odometro: getNum(formData, 'odometro') ?? 0,
      estado: estadoCreate,
      areaAsignada: getStr(formData, 'area'),
      codigo: getStr(formData, 'codigo'),
      lastMaintenanceDate: maintenanceDate ? new Date(maintenanceDate).toISOString() : undefined,
    };

    try {
      const newVehicle = await createVehiculoFromTaller(payload);
      setVehicles([newVehicle, ...vehicles]);
      setShowForm(false);
    } catch (err) {
      alert('Error al crear el vehículo.');
      console.error(err);
    }
  };

  const handleUpdateVehicle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const formData = new FormData(e.currentTarget);
    const driverId = getNum(formData, 'driver');
    const maintenanceDate = getStr(formData, 'lastMaintenanceDate');
    const currentVehicleType = getStr(formData, 'vehicleType') as 'camion' | 'camioneta';

    const estadoUpdate = getStr(formData, 'estado') as unknown as CreateVehiculoPayload['estado'];
    const payload: Partial<CreateVehiculoPayload> = {
      patente: getStr(formData, 'patente'),
      marca: getStr(formData, 'marca'),
      modelo: getStr(formData, 'modelo'),
      capacidad: currentVehicleType === 'camion' ? (getNum(formData, 'capacidad') ?? 0) : 0,
      odometro: getNum(formData, 'odometro') ?? 0,
      estado: estadoUpdate,
      areaAsignada: getStr(formData, 'area'),
      codigo: getStr(formData, 'codigo'),
      lastMaintenanceDate: maintenanceDate ? new Date(maintenanceDate).toISOString() : undefined,
    };

    try {
      const updatedVehicle = await updateVehiculoFromTaller(editingVehicle.id, payload);
      setVehicles(vehicles.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
      setEditingVehicle(null);
    } catch (err) {
      alert('Error al actualizar el vehículo.');
      console.error(err);
    }
  };

  const getStatusColor = (status: VehiculoStatus) => {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'en_mantenimiento':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
      case 'inactivo':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'en_uso':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: VehiculoStatus) => {
    switch (status) {
      case 'disponible': return <CheckCircle className="w-4 h-4" />;
      case 'en_mantenimiento': return <Wrench className="w-4 h-4" />;
      case 'inactivo': return <AlertTriangle className="w-4 h-4" />;
      case 'en_uso': return <Truck className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.patente.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-6">
      {error && <div className="p-4 text-red-700 bg-red-100 rounded-lg dark:bg-red-900/50 dark:text-red-300">{error}</div>}
      {loading && <div className="p-4 text-center text-gray-700 dark:text-gray-200">Cargando vehículos...</div>}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Registro de Flota</h2>
          <p className="text-gray-600 dark:text-gray-300">Gestiona todos los vehículos de la empresa y sus asignaciones</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 space-x-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Vehículo</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Vehículos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vehicles.length}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Disponibles</p>
              <p className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.estado === 'disponible').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">En Mantenimiento</p>
              <p className="text-2xl font-bold text-yellow-600">{vehicles.filter(v => v.estado === 'en_mantenimiento').length}</p>
            </div>
            <Wrench className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Mantenimiento Vencido</p>
              <p className="text-2xl font-bold text-red-600">{/* Lógica a implementar */ 0}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por placa, marca, conductor o área..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:placeholder-gray-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
            />
          </div>
          <button className="flex items-center px-4 py-2 space-x-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700">
            <Filter className="w-4 h-4" />
            <span>Filtrar</span>
          </button>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid gap-6">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="p-6 transition-shadow bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md dark:bg-gray-800 dark:border-gray-700 dark:shadow-none dark:hover:shadow-md dark:hover:shadow-black/20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              {/* Vehicle Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg dark:bg-blue-900/30">
                      <Truck className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{vehicle.patente}</h3>
                      <p className="text-gray-600 dark:text-gray-300">{vehicle.marca} {vehicle.modelo} - Capacidad: {vehicle.capacidad}L</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(vehicle.estado)}`}>
                      {getStatusIcon(vehicle.estado)}
                      <span className="capitalize">{vehicle.estado.replace('_', ' ')}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Kilometraje</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.odometro.toLocaleString()} km</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Área Asignada</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.areaAsignada || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Conductor Asignado</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{vehicle.codigo || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-300">Último Mantenimiento</p>
                    <p className={`font-medium text-gray-900 dark:text-gray-100`}>
                      {vehicle.lastMaintenanceDate ? new Date(vehicle.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                <button onClick={() => setEditingVehicle(vehicle)} className="px-4 py-2 text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                  Ver / Editar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="py-12 text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron vehículos</h3>
          <p className="text-gray-600 dark:text-gray-300">Intenta ajustar tu búsqueda o agregar un nuevo vehículo a la flota.</p>
        </div>
      )}

      {/* Add Vehicle Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Agregar Nuevo Vehículo</h3>
              <p className="mt-1 text-gray-600 dark:text-gray-300">Registrar un nuevo vehículo en la flota</p>
            </div>
            
            <form onSubmit={handleCreateVehicle} className="p-6 space-y-4">
              <fieldset>
                <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Vehículo</legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2" htmlFor="vehicleType-camion">
                    <input id="vehicleType-camion" type="radio" name="vehicleType" value="camion" checked={vehicleType === 'camion'} onChange={() => setVehicleType('camion')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span>Camión</span>
                  </label>
                  <label className="flex items-center gap-2" htmlFor="vehicleType-camioneta">
                    <input id="vehicleType-camioneta" type="radio" name="vehicleType" value="camioneta" checked={vehicleType === 'camioneta'} onChange={() => setVehicleType('camioneta')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span>Camioneta</span>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="patente" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Número de Placa</label>
                  <input
                    id="patente"
                    name="patente"
                    type="text"
                    placeholder="TK-004"
                    className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="marca" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                  <input id="marca" name="marca" type="text" placeholder="Volvo" className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="modelo" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
                  <input
                    id="modelo"
                    name="modelo"
                    type="text"
                    placeholder="FMX"
                    className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500"
                    required
                  />
                </div>
                {vehicleType === 'camion' && (
                  <div>
                    <label htmlFor="capacidad" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Capacidad (Litros)</label>
                    <input
                      id="capacidad"
                      name="capacidad"
                      type="number"
                      placeholder="30000"
                      className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="odometro" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Odómetro (km)</label>
                  <input
                    id="odometro"
                    name="odometro"
                    type="number"
                    placeholder="0"
                    className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="estado" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                  <select id="estado" name="estado" defaultValue="disponible" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                    <option value="disponible">Disponible</option>
                    <option value="en_mantenimiento">En Mantenimiento</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="en_uso">En Uso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="area" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área Asignada</label>
                  <select id="area" name="area" defaultValue="" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                    <option value="" disabled>Seleccionar área</option>
                    {VEHICLE_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="codigo" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Código en Faena</label>
                  <input
                    id="codigo"
                    name="codigo"
                    type="text"
                    placeholder="Ej: C-101"
                    className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={hasMaintenance} onChange={(e) => setHasMaintenance(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span>¿Ha tenido mantenimiento previo?</span>
                </label>
                {hasMaintenance && (
                  <div className="mt-2">
                    <label htmlFor="lastMaintenanceDate" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del último mantenimiento</label>
                    <input
                      id="lastMaintenanceDate"
                      name="lastMaintenanceDate"
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Agregar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Details Vehicle Form Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-gray-800">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Detalles del Vehículo</h3>
                <p className="mt-1 text-gray-600 dark:text-gray-300">Vea o actualice la información del vehículo {editingVehicle.patente}</p>
              </div>
              <button onClick={() => setEditingVehicle(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateVehicle} className="p-6 space-y-4">
              <fieldset>
                <legend className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de Vehículo</legend>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2" htmlFor="vehicleType-camion-edit">
                    <input id="vehicleType-camion-edit" type="radio" name="vehicleType" value="camion" defaultChecked={editingVehicle.capacidad > 0} onChange={(e) => setVehicleType(e.target.value as 'camion' | 'camioneta')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span>Camión</span>
                  </label>
                  <label className="flex items-center gap-2" htmlFor="vehicleType-camioneta-edit">
                    <input id="vehicleType-camioneta-edit" type="radio" name="vehicleType" value="camioneta" defaultChecked={editingVehicle.capacidad === 0} onChange={(e) => setVehicleType(e.target.value as 'camion' | 'camioneta')} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                    <span>Camioneta</span>
                  </label>
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="patente-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Número de Placa</label>
                  <input id="patente-edit" name="patente" type="text" defaultValue={editingVehicle.patente} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                </div>
                <div>
                  <label htmlFor="marca-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Marca</label>
                  <input id="marca-edit" name="marca" type="text" defaultValue={editingVehicle.marca} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="modelo-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Modelo</label>
                  <input id="modelo-edit" name="modelo" type="text" defaultValue={editingVehicle.modelo} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                </div>
                {(editingVehicle.capacidad > 0 || vehicleType === 'camion') && (
                  <div>
                    <label htmlFor="capacidad-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Capacidad (Litros)</label>
                    <input id="capacidad-edit" name="capacidad" type="number" defaultValue={editingVehicle.capacidad} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="odometro-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Odómetro (km)</label>
                  <input id="odometro-edit" name="odometro" type="number" defaultValue={editingVehicle.odometro} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" required />
                </div>
                <div>
                  <label htmlFor="estado-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                  <select id="estado-edit" name="estado" defaultValue={editingVehicle.estado} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                    <option value="disponible">Disponible</option>
                    <option value="en_mantenimiento">En Mantenimiento</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="en_uso">En Uso</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="area-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Área Asignada</label>
                  <select id="area-edit" name="area" defaultValue={editingVehicle.areaAsignada || ""} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
                    <option value="" disabled>Seleccionar área</option>
                    {VEHICLE_AREAS.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="codigo-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Código en Faena</label>
                  <input
                    id="codigo-edit"
                    name="codigo"
                    type="text"
                    defaultValue={editingVehicle.codigo || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <input type="checkbox" defaultChecked={!!editingVehicle.lastMaintenanceDate} onChange={(e) => setHasMaintenance(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span>¿Ha tenido mantenimiento previo?</span>
                </label>
                {(hasMaintenance || editingVehicle.lastMaintenanceDate) && (
                  <div className="mt-2">
                    <label htmlFor="lastMaintenanceDate-edit" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Fecha del último mantenimiento</label>
                    <input
                      id="lastMaintenanceDate-edit"
                      name="lastMaintenanceDate"
                      type="date"
                      defaultValue={toInputDate(editingVehicle.lastMaintenanceDate)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-4 py-2 text-gray-700 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Guardar Cambios
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