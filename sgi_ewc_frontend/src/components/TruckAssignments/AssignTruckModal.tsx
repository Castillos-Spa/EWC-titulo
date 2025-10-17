import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

const litersFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 2 });
const toRouteId = (value: string | number | undefined | null) => (value == null ? '' : String(value));

const AssignTruckModal: React.FC<Props> = ({ open, onClose, truckId, refDay }) => {
  const { trucks, drivers, assignments, removeAssignment, setTruckDayAssignment } = useTruckAssignment();
  const { routes } = useRouteContext();

  const truck = useMemo(() => trucks.find(t => t.id === truckId), [trucks, truckId]);
  const capacityLiters = useMemo(
    () => (typeof truck?.capacityTons === 'number' ? truck.capacityTons : null),
    [truck],
  );

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
  const [entries, setEntries] = useState<Array<{ id: string; routeId: string; volume: string }>>([]);
  const [error, setError] = useState<string>('');

  const overCapacityEntries = useMemo(() => {
    if (capacityLiters === null) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    for (const entry of entries) {
      const numeric = Number(entry.volume);
      if (Number.isFinite(numeric) && numeric > capacityLiters) {
        ids.add(entry.id);
      }
    }
    return ids;
  }, [entries, capacityLiters]);

  const newEntry = useCallback(
    (routeId?: string, volume?: string) => ({
      id: `entry-${Math.random().toString(36).slice(2)}`,
      routeId: routeId ?? toRouteId(routes[0]?.id),
      volume: volume ?? '',
    }),
    [routes],
  );

  useEffect(() => {
    if (open) {
      setDriverId(existing?.driverId ?? '');
      // Precargar: si hay múltiples rutas en el día (tras cambio), tomar todas; si no, última usada
      const sameDayAsRef = assignments.filter(a => a.truckId === truckId && sameDay(a.date instanceof Date ? a.date : new Date(a.date), dateOnly(refDay)));
      if (sameDayAsRef.length > 0) {
        setEntries(
          sameDayAsRef.map(a => ({
            id: `entry-${a.id}`,
            routeId: toRouteId(a.routeId),
            volume: typeof a.volumeLiters === 'number' ? String(a.volumeLiters) : '',
          })),
        );
      } else if (lastRouteId) {
        setEntries([newEntry(toRouteId(lastRouteId))]);
      } else if (routes.length > 0) {
        setEntries([newEntry(toRouteId(routes[0].id))]);
      } else {
        setEntries([]);
      }
      setError('');
    }
  }, [open, existing, lastRouteId, assignments, refDay, truckId, routes, newEntry]);

  if (!open) return null;

  const handleSave = () => {
    if (!driverId || entries.length === 0) {
      setError('Seleccione conductor y al menos una ruta.');
      return;
    }
    let payload;
    try {
      payload = entries.map(entry => {
        if (!entry.routeId) {
          throw new Error('Debe seleccionar una ruta para cada fila.');
        }
        const trimmed = entry.volume.trim();
        if (trimmed === '') {
          return { routeId: entry.routeId, volumeLiters: undefined };
        }
        const value = Number(trimmed);
        if (Number.isNaN(value) || value < 0) {
          throw new Error('Los volúmenes deben ser números positivos.');
        }
        return { routeId: entry.routeId, volumeLiters: value };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Datos de ruta inválidos.';
      setError(message);
      return;
    }
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

  const updateEntryRoute = (entryId: string, routeId: string) => {
    setEntries(prev => prev.map(entry => (entry.id === entryId ? { ...entry, routeId } : entry)));
    setError('');
  };

  const updateEntryVolume = (entryId: string, volume: string) => {
    setEntries(prev => prev.map(entry => (entry.id === entryId ? { ...entry, volume } : entry)));
    setError('');
  };

  const addEntry = () => {
    if (routes.length === 0) {
      setError('No hay rutas disponibles para asignar.');
      return;
    }
    setEntries(prev => [...prev, newEntry()]);
    setError('');
  };

  const removeEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
    setError('');
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Rutas y volúmenes</span>
              <button type="button" onClick={addEntry} className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded dark:bg-blue-800/40 dark:text-blue-200">Agregar ruta</button>
            </div>
            <div className="space-y-2">
              {entries.map((entry, idx) => {
                const route = routes.find(r => toRouteId(r.id) === entry.routeId);
                return (
                  <div key={entry.id} className="grid items-start gap-2 md:grid-cols-[1fr_auto]">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <label htmlFor={`route-select-${entry.id}`} className="block mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Ruta #{idx + 1}</label>
                        <select
                          id={`route-select-${entry.id}`}
                          value={entry.routeId}
                          onChange={e => updateEntryRoute(entry.id, e.target.value)}
                          className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
                        >
                          <option value="">Seleccione</option>
                          {routes.map(r => (
                            <option key={r.id} value={toRouteId(r.id)}>{r.code} • {r.origin} → {r.destination}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`volume-input-${entry.id}`} className="block mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Volumen (L)</label>
                        <input
                          id={`volume-input-${entry.id}`}
                          type="number"
                          min="0"
                          value={entry.volume}
                          onChange={e => updateEntryVolume(entry.id, e.target.value)}
                          placeholder="Ej: 15000"
                          className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700"
                        />
                      </div>
                    </div>
                    {entries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                      >
                        Quitar
                      </button>
                    )}
                    {route && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 md:col-span-2">{route.origin} → {route.destination}</span>
                    )}
                    {capacityLiters !== null && (
                      <span
                        className={`text-xs md:col-span-2 ${
                          overCapacityEntries.has(entry.id)
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {overCapacityEntries.has(entry.id)
                          ? `El volumen excede la capacidad del camión (${litersFormatter.format(capacityLiters)} L).`
                          : `Capacidad máxima: ${litersFormatter.format(capacityLiters)} L.`}
                      </span>
                    )}
                  </div>
                );
              })}
              {entries.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500 bg-gray-100 rounded dark:bg-gray-800 dark:text-gray-300">No hay rutas agregadas. Usa “Agregar ruta” para comenzar.</p>
              )}
              {entries.length > 0 && capacityLiters === null && (
                <div className="px-3 py-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-700">
                  Este camión no tiene capacidad registrada. Verifique los datos en el módulo de flota para habilitar la validación automática.
                </div>
              )}
            </div>
          </div>
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
