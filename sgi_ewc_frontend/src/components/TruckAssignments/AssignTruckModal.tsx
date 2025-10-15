import React, { useEffect, useMemo, useState } from 'react';
import { useTruckAssignment } from './useTruckAssignment';
import { useRouteContext } from '../TransportRoutes/useRouteContext';

interface Props {
  open: boolean;
  onClose: () => void;
  truckId: string;
  refDay: Date;
}

const dateOnly = (d: Date) => {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
};

const sameDay = (a?: Date, b?: Date) => {
  if (!a || !b) return false;
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
};

const AssignTruckModal: React.FC<Props> = ({ open, onClose, truckId, refDay }) => {
  const { trucks, drivers, assignments, removeAssignment, setTruckDayAssignment } = useTruckAssignment();
  const { routes } = useRouteContext();

  const truck = useMemo(() => trucks.find(t => t.id === truckId), [trucks, truckId]);

  const existing = useMemo(() => {
    const d0 = dateOnly(refDay);
    return assignments.find(a => a.truckId === truckId && sameDay(a.date instanceof Date ? a.date : new Date(a.date), d0));
  }, [assignments, truckId, refDay]);

  const lastRouteId = useMemo(() => {
    // Buscar la última ruta usada por este camión, priorizando fechas anteriores a refDay
    const norm = (x: Date | string) => (x instanceof Date ? x : new Date(x));
    const d0 = dateOnly(refDay);
    const forTruck = assignments
      .filter(a => a.truckId === truckId)
      .map(a => ({ ...a, nd: norm(a.date) }))
      .sort((a, b) => b.nd.getTime() - a.nd.getTime());
    const prev = forTruck.find(a => a.nd.getTime() < d0.getTime());
    return prev?.routeId ?? forTruck[0]?.routeId ?? '';
  }, [assignments, truckId, refDay]);

  const [driverId, setDriverId] = useState('');
  const [routeIds, setRouteIds] = useState<string[]>([]);
  const [perRouteVolume, setPerRouteVolume] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (open) {
      setDriverId(existing?.driverId ?? '');
      // Precargar: si hay múltiples rutas en el día (tras cambio), tomar todas; si no, última usada
      const sameDayAsRef = assignments.filter(a => a.truckId === truckId && sameDay(a.date instanceof Date ? a.date : new Date(a.date), dateOnly(refDay)));
      if (sameDayAsRef.length > 0) {
        const uniqueRouteIds = [...new Set(sameDayAsRef.map(a => a.routeId))];
        setRouteIds(uniqueRouteIds);
        const nextVolumes: Record<string, string> = {};
        for (const a of sameDayAsRef) {
          nextVolumes[a.routeId] = a.volumeLiters != null ? String(a.volumeLiters) : '';
        }
        setPerRouteVolume(nextVolumes);
      } else {
        setRouteIds(lastRouteId ? [lastRouteId] : []);
        setPerRouteVolume({});
      }
      setError('');
    }
  }, [open, existing, lastRouteId, assignments, refDay, truckId]);

  if (!open) return null;

  const handleSave = () => {
    if (!driverId || routeIds.length === 0) {
      setError('Seleccione conductor y al menos una ruta.');
      return;
    }
    const payload = routeIds.map(rid => ({ routeId: rid, volumeLiters: perRouteVolume[rid] ? Number(perRouteVolume[rid]) : undefined }));
    const res = setTruckDayAssignment(truckId, refDay, driverId, payload);
    if (!res.ok) {
      setError(res.error || 'No se pudo guardar la asignación.');
      return;
    }
    onClose();
  };

  const handleRemove = () => {
    if (existing) {
      removeAssignment(existing.id);
      onClose();
    }
  };

  const toggleRoute = (routeId: string, checked: boolean) => {
    setRouteIds(prev => (checked ? [...prev, routeId] : prev.filter(id => id !== routeId)));
    setPerRouteVolume(prev => {
      if (checked) {
        return { ...prev, [routeId]: prev[routeId] ?? '' };
      }
      const rest = { ...prev };
      delete rest[routeId];
      return rest;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true"></div>
      <div className="relative z-10 w-full max-w-lg p-4 bg-white rounded-lg shadow-lg dark:bg-gray-900">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{existing ? 'Editar asignación' : 'Asignar camión'}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Camión: <span className="font-medium">{truck?.code}</span> • Fecha: <span className="font-mono">{refDay.toISOString().slice(0,10)}</span></p>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="driver-select" className="block mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Conductor</label>
            <select id="driver-select" value={driverId} onChange={e => setDriverId(e.target.value)} className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700">
              <option value="">Seleccione</option>
              {drivers.filter(d => d.active).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="route-select" className="block mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rutas</label>
            <div className="max-h-48 overflow-auto border rounded dark:border-gray-700">
              {routes.map(r => {
                const checked = routeIds.includes(r.id);
                return (
                  <label key={r.id} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                    <input type="checkbox" checked={checked} onChange={e => toggleRoute(r.id, e.target.checked)} />
                    <span className="whitespace-nowrap"><span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300 mr-2">{r.code}</span>{r.origin} → {r.destination}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Puede seleccionar múltiples rutas para el mismo día.</p>
          </div>
          {routeIds.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Volumen por ruta (L)</p>
              {routeIds.map(rid => {
                const r = routes.find(x => x.id === rid);
                return (
                  <div key={rid} className="grid grid-cols-2 gap-2 items-center">
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300 mr-2">{r?.code}</span>
                      {r?.origin} → {r?.destination}
                    </div>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={perRouteVolume[rid] ?? ''}
                      onChange={e => setPerRouteVolume(prev => ({ ...prev, [rid]: e.target.value }))}
                      placeholder="Ej: 15000"
                      className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
                    />
                  </div>
                );
              })}
            </div>
          )}
          {error && <div className="px-3 py-2 text-sm text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded">{error}</div>}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {existing && (
            <button onClick={handleRemove} className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-gray-800">Quitar asignación</button>
          )}
          <button onClick={onClose} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border rounded hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700">Cancelar</button>
          <button onClick={handleSave} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded">Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default AssignTruckModal;
