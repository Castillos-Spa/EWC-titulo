import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTruckAssignment } from '../hooks/useTruckAssignment';
import { useRouteContext } from '@features/transport-routes/context/useRouteContext';

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
												return (
									<div key={entry.id} className="flex items-center gap-2">
										<span className="text-xs text-gray-500">#{idx + 1}</span>
										<select aria-label="Ruta" value={entry.routeId} onChange={e => updateEntryRoute(entry.id, e.target.value)} className="px-2 py-1 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700">
											<option value="">Seleccione Ruta</option>
											{routes.filter(r => r.active).map(r => (
												<option key={r.id} value={toRouteId(r.id)}>{`${r.code} — ${r.origin} → ${r.destination}`}</option>
											))}
										</select>
										<input type="number" min={0} step={1} placeholder="Volumen (L)" value={entry.volume} onChange={e => updateEntryVolume(entry.id, e.target.value)} className="w-40 px-2 py-1 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
										<button onClick={() => removeEntry(entry.id)} className="px-2 py-1 text-xs text-red-600 bg-white border border-red-600 rounded hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-gray-800">Quitar</button>
										{overCapacityEntries.has(entry.id) && (
											<span className="text-xs text-red-600">Excede capacidad</span>
										)}
									</div>
								);
							})}
						</div>
						{error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}
					</div>

					<div className="flex items-center justify-between">
						<div className="text-xs text-gray-500 dark:text-gray-400">
							<span>Capacidad: </span>
							<span className="font-medium">{capacityLiters === null ? '—' : `${capacityLiters} L`}</span>
						</div>
						<div className="flex gap-2">
							{existing && <button onClick={handleRemove} className="px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-600 rounded hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-gray-800">Eliminar</button>}
							<button onClick={handleSave} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded">Guardar</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AssignTruckModal;