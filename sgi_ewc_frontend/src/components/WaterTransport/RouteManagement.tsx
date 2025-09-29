import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Calendar, MapPin, Truck, User, Clock, CheckCircle2, PlayCircle, PauseCircle, XCircle } from 'lucide-react';
import type { RoutePlan, RouteStatus } from '../../types/Route';
import { listRoutes, createRoute, updateRouteStatus, deleteRoute, type CreateRoutePayload } from '../../utils/routeApi';

const statusColor = (s: RouteStatus) => {
  switch (s) {
    case 'planned': return 'bg-gray-100 text-gray-800';
    case 'scheduled': return 'bg-amber-100 text-amber-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const statusLabel = (s: RouteStatus) => ({
  planned: 'Planificada',
  scheduled: 'Programada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}[s]);

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<RoutePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await listRoutes();
        setRoutes(data);
        setError(null);
      } catch (e) {
        console.error(e);
        setError('No se pudieron cargar las rutas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = routes.length;
    const completed = routes.filter(r => r.status === 'completed').length;
    const inProgress = routes.filter(r => r.status === 'in_progress').length;
    const planned = routes.filter(r => r.status === 'planned').length;
    const scheduled = routes.filter(r => r.status === 'scheduled').length;
    const cancelled = routes.filter(r => r.status === 'cancelled').length;
    const nonCancelled = Math.max(total - cancelled, 0);
    const completionRate = nonCancelled > 0 ? Math.round((completed / nonCancelled) * 100) : 0;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const isWithinNext7Days = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= start && d <= end;
    };

    const upcoming = routes.filter(r => (r.status === 'planned' || r.status === 'scheduled') && isWithinNext7Days(r.plannedDate)).length;
    const todayCount = routes.filter(r => new Date(r.plannedDate).toDateString() === start.toDateString()).length;
    const upcomingVolume = routes.reduce((sum, r) => {
      if ((r.status === 'planned' || r.status === 'scheduled') && r.plannedVolumeLiters && isWithinNext7Days(r.plannedDate)) {
        return sum + (r.plannedVolumeLiters || 0);
      }
      return sum;
    }, 0);

    return { total, completed, inProgress, planned, scheduled, cancelled, completionRate, upcoming, todayCount, upcomingVolume };
  }, [routes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return routes;
    return routes.filter(r => r.name.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q) || r.vehiclePlate.toLowerCase().includes(q));
  }, [routes, search]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
  const payload: CreateRoutePayload = {
      name: String(fd.get('name') || ''),
      origin: { latitude: Number(fd.get('origLat') || 0), longitude: Number(fd.get('origLng') || 0), address: String(fd.get('origAddr') || '') || undefined },
      destination: { latitude: Number(fd.get('destLat') || 0), longitude: Number(fd.get('destLng') || 0), address: String(fd.get('destAddr') || '') || undefined },
      plannedDate: String(fd.get('date') || ''),
      plannedStartTime: String(fd.get('start') || '') || undefined,
      plannedEndTime: String(fd.get('end') || '') || undefined,
      vehicleId: String(fd.get('vehicleId') || ''),
      vehiclePlate: String(fd.get('vehiclePlate') || ''),
      driverId: String(fd.get('driverId') || ''),
      driverName: String(fd.get('driverName') || ''),
      plannedVolumeLiters: fd.get('volume') ? Number(fd.get('volume')) : undefined,
      status: 'planned',
      notes: String(fd.get('notes') || '') || undefined,
      createdBy: 'planner',
    };
    if (!payload.name || !payload.plannedDate || !payload.vehiclePlate || !payload.driverName) {
      alert('Nombre, fecha, vehículo y conductor son obligatorios');
      return;
    }
    const created = await createRoute(payload);
    setRoutes(r => [created, ...r]);
    setShowForm(false);
  };

  const setStatus = async (id: string, status: RouteStatus) => {
    const updated = await updateRouteStatus(id, status);
    if (updated) setRoutes(rs => rs.map(r => r.id === id ? updated : r));
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar ruta?')) return;
    await deleteRoute(id);
    setRoutes(rs => rs.filter(r => r.id !== id));
  };

  if (loading) return <div className="text-center text-gray-600">Cargando rutas…</div>;

  return (
    <div className="space-y-6">
      {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">{error}</div>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Rutas</h2>
          <p className="text-gray-600">Crea y programa rutas; la ejecución y seguimiento se registra en Reportes de Viajes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>Nueva Ruta</span>
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Rutas</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.total.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Planificadas/Prog.: {(stats.planned + stats.scheduled).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">En Progreso</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.inProgress.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Hoy: {stats.todayCount.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <PlayCircle className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completadas</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.completed.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Canceladas: {stats.cancelled.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Próximas (7 días)</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.upcoming.toLocaleString()}</p>
              <p className="mt-1 text-xs text-gray-500">Volumen plan.: {stats.upcomingVolume.toLocaleString()} L</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa de Finalización</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="mt-1 text-xs text-gray-500">Sobre rutas no canceladas</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ruta, conductor o vehículo…" className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="text-sm text-gray-600 flex items-center">{routes.length} rutas</div>
      </div>

      {/* Lista de rutas */}
      <div className="grid gap-4">
        {filtered.map(r => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{r.name}</h3>
                      <p className="text-sm text-gray-600">Ruta ID: {r.id}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>{statusLabel(r.status)}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{r.plannedDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Conductor:</span>
                    <span className="font-medium">{r.driverName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Vehículo:</span>
                    <span className="font-medium">{r.vehiclePlate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Origen:</span>
                    <span className="font-medium">{r.origin.address ?? `${r.origin.latitude.toFixed(3)}, ${r.origin.longitude.toFixed(3)}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Destino:</span>
                    <span className="font-medium">{r.destination.address ?? `${r.destination.latitude.toFixed(3)}, ${r.destination.longitude.toFixed(3)}`}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Inicio: <span className="font-medium">{r.plannedStartTime || '—'}</span></div>
                  <div className="flex items-center gap-2">Fin: <span className="font-medium">{r.plannedEndTime || '—'}</span></div>
                  {r.plannedVolumeLiters ? (<div className="flex items-center gap-2">Volumen: <span className="font-medium">{r.plannedVolumeLiters} L</span></div>) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {r.status !== 'cancelled' && r.status !== 'completed' && (
                  <button onClick={() => setStatus(r.id, 'cancelled')} className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 inline-flex items-center gap-2"><XCircle className="w-4 h-4" /> Cancelar</button>
                )}
                {r.status === 'planned' && (
                  <button onClick={() => setStatus(r.id, 'scheduled')} className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 inline-flex items-center gap-2"><PauseCircle className="w-4 h-4" /> Programar</button>
                )}
                {(r.status === 'planned' || r.status === 'scheduled') && (
                  <button onClick={() => setStatus(r.id, 'in_progress')} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"><PlayCircle className="w-4 h-4" /> Iniciar</button>
                )}
                {r.status === 'in_progress' && (
                  <button onClick={() => setStatus(r.id, 'completed')} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Completar</button>
                )}
                <button onClick={() => remove(r.id)} className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Eliminar</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Crear Ruta */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Nueva Ruta</h3>
              <p className="text-gray-600 mt-1">Planifica una ruta asignando vehículo y conductor</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">Nombre</label>
                <input id="name" name="name" placeholder="Origen → Destino" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="date">Fecha</label>
                  <input id="date" name="date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="start">Inicio</label>
                    <input id="start" name="start" type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="end">Fin</label>
                    <input id="end" name="end" type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="vehiclePlate">Vehículo (Patente)</label>
                  <input id="vehiclePlate" name="vehiclePlate" placeholder="TK-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="hidden" name="vehicleId" value="veh-unknown" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="driverName">Conductor</label>
                  <input id="driverName" name="driverName" placeholder="John Driver" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  <input type="hidden" name="driverId" value="user-unknown" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="origAddr">Origen</label>
                  <input id="origAddr" name="origAddr" placeholder="Dirección origen" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input name="origLat" type="number" step="any" placeholder="Lat" className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input name="origLng" type="number" step="any" placeholder="Lng" className="px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="destAddr">Destino</label>
                  <input id="destAddr" name="destAddr" placeholder="Dirección destino" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input name="destLat" type="number" step="any" placeholder="Lat" className="px-3 py-2 border border-gray-300 rounded-lg" />
                    <input name="destLng" type="number" step="any" placeholder="Lng" className="px-3 py-2 border border-gray-300 rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="volume">Volumen planificado (L)</label>
                  <input id="volume" name="volume" type="number" placeholder="15000" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="notes">Notas</label>
                  <input id="notes" name="notes" placeholder="Notas (opcional)" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-gray-700 border-gray-300 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Crear Ruta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteManagement;
