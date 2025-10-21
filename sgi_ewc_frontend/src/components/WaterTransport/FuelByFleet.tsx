import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFleetFuelSummary, type VehicleWithFuelHistory } from '../../utils/fuelApi';
import { Fuel as FuelIcon, Plus, Search, TrendingUp, Gauge, AlertTriangle, ChevronDown, ChevronRight, Route } from 'lucide-react';
import FuelLogFormModal from '../../features/fuel/components/FuelLogFormModal';

type FleetFuelSummary = {
  fleetId: string;
  fleetName: string;
  manager: string | null;
  totalConsumption: number;
  totalRefueled: number;
  averageConsumption: number;
  efficiency: 'excellent' | 'good' | 'average' | 'poor';
  vehicles: VehicleWithFuelHistory[];
};
const efficiencyColor = (eff: FleetFuelSummary['efficiency']) => {
  switch (eff) {
    case 'excellent': return 'text-green-700 dark:text-green-300';
    case 'good': return 'text-lime-700 dark:text-lime-300';
    case 'average': return 'text-amber-700 dark:text-amber-300';
    case 'poor': return 'text-red-700 dark:text-red-300';
    default: return 'text-gray-700 dark:text-gray-300';
  }
};

const efficiencyBadge = (eff: FleetFuelSummary['efficiency']) => `${efficiencyColor(eff)} bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-full text-xs font-semibold`;

const FuelByFleet: React.FC = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<VehicleWithFuelHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showFuelForm, setShowFuelForm] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFleetFuelSummary();
      setVehicles(data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('No se pudo cargar el consumo de combustible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, user]); // El user es dependencia por si cambia el login

  const handleSuccess = () => {
    setShowFuelForm(false);
    // En lugar de recargar la página, volvemos a buscar los datos.
    fetchData();
  };

  const vehiclesByDate = useMemo(() => {
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    return vehicles.map((vehicle) => {
      const filteredLogs = (vehicle.fuelLogs ?? []).filter((log) => {
        const timestamp = new Date(log.date).getTime();
        if (Number.isNaN(timestamp)) return true;
        if (fromDate && timestamp < fromDate.getTime()) return false;
        if (toDate && timestamp > toDate.getTime()) return false;
        return true;
      });

      if (filteredLogs.length === vehicle.fuelLogs?.length) {
        return vehicle;
      }

      return { ...vehicle, fuelLogs: filteredLogs };
    });
  }, [vehicles, from, to]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vehiclesByDate;
    return vehiclesByDate.filter(v => v.patente.toLowerCase().includes(q) || v.marca.toLowerCase().includes(q) || v.modelo.toLowerCase().includes(q));
  }, [vehiclesByDate, search]);

  const calculateEfficiency = (avgConsumption: number): FleetFuelSummary['efficiency'] => {
    if (avgConsumption <= 0) return 'average';
    if (avgConsumption < 20) return 'excellent';
    if (avgConsumption < 30) return 'good';
    if (avgConsumption < 40) return 'average';
    return 'poor';
  };

  /**
   * Calcula el consumo promedio de un vehículo (L/100km) basándose en su historial de cargas.
   * Utiliza el método de "carga a carga": la distancia recorrida entre dos cargas se divide
   * por los litros de la *primera* carga. Se promedian todos los segmentos válidos.
   */
 const calculateVehicleMetrics = (vehicle: VehicleWithFuelHistory): { consumption: number, totalDistance: number, totalLiters: number } => {
    const fuelLogs = (vehicle.fuelLogs || []).slice().sort((a, b) => a.odometer - b.odometer);

    if (fuelLogs.length < 2) {
      return { consumption: 0, totalDistance: 0, totalLiters: 0 };
    }

    let totalDistance = 0;
    let totalLiters = 0;

    for (let i = 1; i < fuelLogs.length; i++) {
      const prevLog = fuelLogs[i - 1];
      const currentLog = fuelLogs[i];

      const distance = currentLog.odometer - prevLog.odometer;
      const liters = prevLog.liters;

      if (distance > 0 && liters > 0) {
        totalDistance += distance;
        totalLiters += liters;
      }
    }

    const consumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;
    return { consumption, totalDistance, totalLiters };
  };

  const extraKpis = useMemo(() => {
    const metrics = filtered.map(calculateVehicleMetrics);
    const consumptions = metrics.map(m => m.consumption).filter(c => c > 0);

    const avgConsumption = consumptions.reduce((sum, c) => sum + c, 0) / consumptions.length;
    let poorVehicles = 0;
    for (const consumption of consumptions) {
      if (calculateEfficiency(consumption) === 'poor') poorVehicles++;
    }

    const totalDistance = metrics.reduce((sum, m) => sum + m.totalDistance, 0);
    const totalLiters = (filtered || []).flatMap(v => v.fuelLogs || []).reduce((sum, log) => sum + log.liters, 0);


    return { avgConsumption: avgConsumption || 0, poorVehicles, totalDistance, totalLiters };
  }, [filtered]);

  const canRegisterFuel = useMemo(() => {
    if (!user) return false;
    // Revisamos asignaciones para detectar conductores y supervisores de Transporte
    const isDriver = !!user.roleAssignments?.some(ra => ra.specialty === 'DRIVER');
    const isTransportSupervisor = !!user.roleAssignments?.some(ra => ra.area === 'Transporte' && (ra.role === 'Supervisor' || ra.role === 'Jefe'));
    return user.isAdmin || isDriver || isTransportSupervisor;
  }, [user]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center text-gray-600 dark:text-gray-300">Cargando consumo de combustible…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 text-red-700 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Consumo de Combustible por Vehículo</h2>
          <p className="text-gray-600 dark:text-gray-300">Resumen de consumo y eficiencia de los vehículos a tu cargo.</p>
        </div>
        {canRegisterFuel && (
          <button onClick={() => setShowFuelForm(true)} className="inline-flex items-center gap-2 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            <span>Registrar Carga</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Distancia Recorrida</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{extraKpis.totalDistance.toLocaleString()} km</p>
            </div>
            <Route className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Cargado</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{extraKpis.totalLiters.toFixed(1)} L</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Vehículos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{filtered.length}</p>
            </div>
            <FuelIcon className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Consumo Promedio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{extraKpis.avgConsumption.toFixed(1)} L/100km</p>
            </div>
            <Gauge className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-300">Eficiencia Pobre</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{extraKpis.poorVehicles}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm lg:grid-cols-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative lg:col-span-2">
          <Search className="absolute w-4 h-4 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por patente, marca o modelo..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
            aria-label="Buscar"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="from" className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Desde</label>
            <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
          </div>
          <div>
            <label htmlFor="to" className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Hasta</label>
            <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700" />
          </div>
        </div>
      </div>

      {/* Vehículos */}
      <div className="grid gap-4">
        {filtered.map(vehicle => {
          const open = !!expanded[vehicle.id];
          const { consumption } = calculateVehicleMetrics(vehicle);
          const efficiency = calculateEfficiency(consumption);
          return (
            <div key={vehicle.id} className="p-6 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-3">
                  <button
                    className="p-2 rounded-md bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                    aria-label={open ? 'Contraer' : 'Expandir'}
                    onClick={() => setExpanded(s => ({ ...s, [vehicle.id]: !open }))}
                  >
                    {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{vehicle.patente}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{vehicle.marca} {vehicle.modelo}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total Cargado: <strong className="text-gray-900 dark:text-gray-100">{(vehicle.fuelLogs || []).reduce((s, l) => s + l.liters, 0).toFixed(1)} L</strong></span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    <Gauge className="w-4 h-4" /> {consumption > 0 ? consumption.toFixed(1) : '--'} L/100km
                  </span>
                  <span className={efficiencyBadge(efficiency)}>{efficiency.toUpperCase()}</span>
                </div>
              </div>

              {open && (
                <div className="grid gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">Historial de Cargas</h4>
                  {(vehicle.fuelLogs || []).length > 0 ? (vehicle.fuelLogs || []).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                    <div key={log.id} className="flex flex-col gap-3 p-4 rounded-lg md:flex-row md:items-center md:justify-between bg-gray-50 dark:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600"><FuelIcon className="w-5 h-5 text-amber-600" /></div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100">{new Date(log.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-300">Registrado por: {log.driver.username}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 dark:text-gray-200">Odómetro: <strong className="text-gray-900 dark:text-gray-100">{log.odometer.toLocaleString()} km</strong></span>
                        <span className="text-sm text-gray-700 dark:text-gray-200">Litros: <strong className="text-gray-900 dark:text-gray-100">{log.liters.toFixed(1)} L</strong></span>
                        {log.cost && <span className="text-sm text-gray-700 dark:text-gray-200">Costo: <strong className="text-gray-900 dark:text-gray-100">${log.cost.toLocaleString()}</strong></span>}
                      </div>
                    </div>
                  )) : <p className="p-4 text-sm text-gray-500">No hay registros de combustible para este vehículo.</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">No se encontraron vehículos</h3>
          <p className="text-gray-600 dark:text-gray-300">No tienes vehículos asignados o no hay resultados para tu búsqueda.</p>
        </div>
      )}

      <FuelLogFormModal
        isOpen={showFuelForm}
        onClose={() => setShowFuelForm(false)}
        onSuccess={handleSuccess}
        vehiclesForDriver={vehicles} // El modal decidirá si necesita buscar más vehículos
      />
    </div>
  );
};

export default FuelByFleet;
