import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getFleetFuelSummary } from '../../utils/fuelApi';
import type { FleetFuelSummary, VehicleFuelSummary } from '../../types/Fuel';
import { Fuel as FuelIcon, Search, TrendingUp, TrendingDown, Gauge, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';

const efficiencyColor = (eff: FleetFuelSummary['efficiency']) => {
  switch (eff) {
    case 'excellent': return 'text-green-700';
    case 'good': return 'text-lime-700';
    case 'average': return 'text-amber-700';
    case 'poor': return 'text-red-700';
    default: return 'text-gray-700';
  }
};

const efficiencyBadge = (eff: FleetFuelSummary['efficiency']) => `${efficiencyColor(eff)} bg-gray-50 px-2.5 py-1 rounded-full text-xs font-semibold`;

const FuelByFleet: React.FC = () => {
  const { user } = useAuth();
  const [fleets, setFleets] = useState<FleetFuelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
  // Futuro: pasar rango cuando la API lo soporte
  const data = await getFleetFuelSummary();
        // Filtrar por áreas/usuario si aplica (mock simple)
        const filtered = user?.areas?.includes('Transporte') || user?.isAdmin ? data : data.slice(0, 1);
        setFleets(filtered);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('No se pudo cargar el consumo de combustible.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fleets;
    return fleets.filter(f => f.fleetName.toLowerCase().includes(q) || f.vehicles.some(v => v.vehiclePlate.toLowerCase().includes(q)));
  }, [fleets, search]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, f) => {
      acc.totalConsumption += f.totalConsumption;
      acc.totalRefueled += f.totalRefueled;
      acc.vehicles += f.vehicles.length;
      return acc;
    }, { totalConsumption: 0, totalRefueled: 0, vehicles: 0 });
  }, [filtered]);

  const extraKpis = useMemo(() => {
    let vehicleCount = 0;
    let sumAvgConsWeighted = 0;
    let poorVehicles = 0;

    filtered.forEach(f => {
      const count = f.vehicles.length;
      vehicleCount += count;
      sumAvgConsWeighted += (f.averageConsumption || 0) * count;
      f.vehicles.forEach(v => {
        if (v.analytics.efficiency === 'poor') poorVehicles += 1;
      });
    });
    const avgConsumption = vehicleCount > 0 ? sumAvgConsWeighted / vehicleCount : 0;

    return { avgConsumption, poorVehicles };
  }, [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center text-gray-600">Cargando consumo de combustible…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Consumo de Combustible por Vehiculo</h2>
          <p className="text-gray-600">Resumen de consumo y eficiencia, flotas vinculadas a tu usuario</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consumo Total</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalConsumption.toFixed(1)} L</p>
            </div>
            <TrendingDown className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reabastecido</p>
              <p className="text-2xl font-bold text-gray-900">{totals.totalRefueled.toFixed(1)} L</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">{totals.vehicles}</p>
            </div>
            <FuelIcon className="w-8 h-8 text-amber-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consumo Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{extraKpis.avgConsumption.toFixed(1)} L/100km</p>
            </div>
            <Gauge className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Eficiencia Pobre</p>
              <p className="text-2xl font-bold text-gray-900">{extraKpis.poorVehicles}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por flota o patente…"
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="from" className="block text-sm text-gray-700 mb-1">Desde</label>
            <input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="to" className="block text-sm text-gray-700 mb-1">Hasta</label>
            <input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Flotas */}
      <div className="grid gap-4">
        {filtered.map((fleet) => {
          const open = !!expanded[fleet.fleetId];
          return (
            <div key={fleet.fleetId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    className="p-2 rounded-md bg-gray-50 hover:bg-gray-100"
                    aria-label={open ? 'Contraer' : 'Expandir'}
                    onClick={() => setExpanded(s => ({ ...s, [fleet.fleetId]: !open }))}
                  >
                    {open ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{fleet.fleetName}</h3>
                    <p className="text-sm text-gray-600">Responsable: {fleet.manager || '—'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-gray-600">Consumo: <strong>{fleet.totalConsumption.toFixed(1)} L</strong></span>
                  <span className="text-sm text-gray-600">Reabastecido: <strong>{fleet.totalRefueled.toFixed(1)} L</strong></span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                    <Gauge className="w-4 h-4" /> {fleet.averageConsumption.toFixed(1)} L/100km
                  </span>
                  <span className={efficiencyBadge(fleet.efficiency)}>{fleet.efficiency.toUpperCase()}</span>
                </div>
              </div>

              {open && (
                <div className="mt-4 border-t border-gray-100 pt-4 grid gap-3">
                  {fleet.vehicles.map((v: VehicleFuelSummary) => (
                    <div key={v.vehicleId} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <FuelIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{v.vehiclePlate}</div>
                          <div className="text-sm text-gray-600">Consumo: {v.analytics.totalConsumption.toFixed(1)} L • Refuel: {v.analytics.totalRefueled.toFixed(1)} L</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                          <Gauge className="w-4 h-4" /> {v.analytics.averageConsumption > 0 ? v.analytics.averageConsumption.toFixed(1) : '--'} L/100km
                        </span>
                        <span className={efficiencyBadge(v.analytics.efficiency)}>{v.analytics.efficiency.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron flotas</h3>
          <p className="text-gray-600">Ajusta los filtros o el rango de fechas.</p>
        </div>
      )}
    </div>
  );
};

export default FuelByFleet;
