import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	AlertCircle,
	CalendarClock,
	GaugeCircle,
	Plus,
	Route as RouteIcon,
	Save,
	Trash2,
	UserRound,
	X,
} from 'lucide-react';
import { useTruckAssignment } from '../hooks/useTruckAssignment';
import { useRouteContext } from '@features/transport-routes/context/useRouteContext';

interface Props {
	open: boolean;
	onClose: () => void;
	truckId: string;
	refDay: Date;
}

const dateOnly = (input: Date) => {
	const normalized = new Date(input);
	normalized.setHours(0, 0, 0, 0);
	return normalized;
};

const sameDay = (a?: Date, b?: Date) => {
	if (!a || !b) return false;
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const toRouteId = (value: string | number | undefined | null) => (value == null ? '' : String(value));

const AssignTruckModal: React.FC<Props> = ({ open, onClose, truckId, refDay }) => {
	const { trucks, drivers, assignments, removeAssignment, setTruckDayAssignment } = useTruckAssignment();
	const { routes } = useRouteContext();

	const truck = useMemo(() => trucks.find(candidate => candidate.id === truckId), [trucks, truckId]);
	const capacityLiters = useMemo(
		() => (typeof truck?.capacityTons === 'number' ? truck.capacityTons : null),
		[truck],
	);

	const existing = useMemo(() => {
		const reference = dateOnly(refDay);
		return assignments.find(assignment => {
			const assignmentDate = assignment.date instanceof Date ? assignment.date : new Date(assignment.date);
			return assignment.truckId === truckId && sameDay(assignmentDate, reference);
		});
	}, [assignments, truckId, refDay]);

	const lastRouteId = useMemo(() => {
		const normalize = (value: Date | string) => (value instanceof Date ? value : new Date(value));
		const reference = dateOnly(refDay);
		const history = assignments
			.filter(assignment => assignment.truckId === truckId)
			.map(assignment => ({ ...assignment, normalized: normalize(assignment.date) }))
			.sort((a, b) => b.normalized.getTime() - a.normalized.getTime());
		const previous = history.find(entry => entry.normalized.getTime() < reference.getTime());
		return previous?.routeId ?? history[0]?.routeId ?? '';
	}, [assignments, truckId, refDay]);

	const [driverId, setDriverId] = useState('');
	const [entries, setEntries] = useState<Array<{ id: string; routeId: string; volume: string }>>([]);
	const [error, setError] = useState('');

	const overCapacityEntries = useMemo(() => {
		if (capacityLiters === null) {
			return new Set<string>();
		}
		const flagged = new Set<string>();
		for (const entry of entries) {
			const volume = Number(entry.volume);
			if (Number.isFinite(volume) && volume > capacityLiters) {
				flagged.add(entry.id);
			}
		}
		return flagged;
	}, [capacityLiters, entries]);

	const newEntry = useCallback(
		(routeId?: string, volume?: string) => ({
			id: `entry-${Math.random().toString(36).slice(2)}`,
			routeId: routeId ?? toRouteId(routes[0]?.id),
			volume: volume ?? '',
		}),
		[routes],
	);

	useEffect(() => {
		if (!open) return;

		setDriverId(existing?.driverId ?? '');
		const sameDayAssignments = assignments.filter(assignment => {
			const assignmentDate = assignment.date instanceof Date ? assignment.date : new Date(assignment.date);
			return assignment.truckId === truckId && sameDay(assignmentDate, dateOnly(refDay));
		});

		if (sameDayAssignments.length > 0) {
			setEntries(
				sameDayAssignments.map(assignment => ({
					id: `entry-${assignment.id}`,
					routeId: toRouteId(assignment.routeId),
					volume: typeof assignment.volumeLiters === 'number' ? String(assignment.volumeLiters) : '',
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
	}, [open, existing, assignments, refDay, truckId, routes, lastRouteId, newEntry]);

	const handleSave = () => {
		if (!driverId || entries.length === 0) {
			setError('Seleccione conductor y al menos una ruta.');
			return;
		}

		let payload: Array<{ routeId: string; volumeLiters?: number }>;
		try {
			payload = entries.map(entry => {
				if (!entry.routeId) {
					throw new Error('Cada fila debe incluir una ruta.');
				}
				const trimmed = entry.volume.trim();
				if (trimmed === '') {
					return { routeId: entry.routeId, volumeLiters: undefined };
				}
				const numericVolume = Number(trimmed);
				if (Number.isNaN(numericVolume) || numericVolume < 0) {
					throw new Error('Los volúmenes deben ser números positivos.');
				}
				return { routeId: entry.routeId, volumeLiters: numericVolume };
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Datos de ruta inválidos.';
			setError(message);
			return;
		}

		const result = setTruckDayAssignment(truckId, refDay, driverId, payload);
		if (!result.ok) {
			setError(result.error ?? 'No se pudo guardar la asignación.');
			return;
		}

		onClose();
	};

	const handleRemove = () => {
		if (!existing) return;
		removeAssignment(existing.id);
		onClose();
	};

	const addEntry = () => {
		if (routes.length === 0) {
			setError('No hay rutas activas para asignar.');
			return;
		}
		setEntries(previous => [...previous, newEntry()]);
		setError('');
	};

	const removeEntry = (entryId: string) => {
		setEntries(previous => previous.filter(entry => entry.id !== entryId));
		setError('');
	};

	const updateEntryRoute = (entryId: string, routeId: string) => {
		setEntries(previous => previous.map(entry => (entry.id === entryId ? { ...entry, routeId } : entry)));
		setError('');
	};

		const updateEntryVolume = (entryId: string, volume: string) => {
			setEntries(previous => previous.map(entry => (entry.id === entryId ? { ...entry, volume } : entry)));
			setError('');
		};

		const formattedDay = useMemo(() => refDay.toISOString().slice(0, 10), [refDay]);

		if (!open) return null;

	return (
		<div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8">
			<div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} aria-hidden="true" />
			<div className="relative z-10 w-full max-w-3xl">
				<div className="relative overflow-hidden rounded-4xl border border-slate-200/60 bg-white/90 px-6 py-6 text-slate-900 shadow-[0_35px_80px_-40px_rgba(59,130,246,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-100">
					<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-indigo-500/20" />
					<div className="pointer-events-none absolute -top-16 right-8 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
					<div className="relative flex flex-col gap-6">
						<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div className="space-y-2">
								<p className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200">
									<RouteIcon className="h-4 w-4" />
									Planificación de ruta
								</p>
								<h3 className="text-2xl font-semibold tracking-tight">
									{existing ? 'Editar asignación' : 'Programar nuevo recorrido'}
								</h3>
								<p className="text-sm text-slate-600 dark:text-slate-300">
									Coordina la agenda del camión
									{' '}
									<span className="font-semibold text-slate-900 dark:text-white">{truck?.code ?? '—'}</span>
									{' '}para el
									{' '}
									<span className="font-mono tracking-widest">{formattedDay}</span>.
									{' '}Selecciona conductor, rutas y volúmenes desde un mismo panel.
								</p>
							</div>
							<button
								aria-label="Cerrar"
								onClick={onClose}
								className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/60 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/10 dark:text-blue-200/70"
							>
								<X className="h-5 w-5" />
							</button>
						</header>

						<section className="grid gap-4 rounded-3xl border border-slate-200/60 bg-white/75 px-5 py-4 shadow-inner shadow-slate-200/50 dark:border-white/10 dark:bg-slate-900/70">
							<div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
								<label className="flex flex-col gap-2 rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:shadow-md focus-within:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100">
									<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
										<UserRound className="h-4 w-4" />
										Conductor asignado
									</span>
									<select
										value={driverId}
										onChange={event => setDriverId(event.target.value)}
										className="mt-2 w-full rounded-2xl border border-transparent bg-white/70 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:bg-white/10 dark:text-slate-100"
									>
										<option value="">Seleccione conductor</option>
										{drivers.filter(driver => driver.active).map(driver => (
											<option key={driver.id} value={driver.id}>
												{driver.name}
											</option>
										))}
									</select>
								</label>
								<div className="flex flex-col justify-between gap-3 rounded-2xl border border-dashed border-slate-300/70 bg-slate-100/60 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
									<div className="flex items-center gap-3">
										<GaugeCircle className="h-5 w-5 text-slate-400" />
										<div className="flex flex-col">
											<span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
												Capacidad del camión
											</span>
											<span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
												{capacityLiters === null ? 'No disponible' : `${capacityLiters} L`}
											</span>
										</div>
									</div>
									<p className="text-xs text-slate-500 dark:text-blue-200/70">
										Recibirás una alerta si alguna ruta supera la capacidad máxima disponible para la jornada.
									</p>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
									Rutas del día
								</span>
								<button
									type="button"
									onClick={addEntry}
									className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-white/80 px-3 py-1.5 text-xs font-semibold text-sky-600 shadow-sm shadow-sky-200/40 transition hover:-translate-y-0.5 hover:bg-sky-50 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200"
								>
									<Plus className="h-4 w-4" />
									Agregar ruta
								</button>
							</div>

							<div className="space-y-3">
								{entries.length === 0 ? (
									<div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300/70 bg-slate-100/70 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
										<span className="flex items-center gap-2">
											<CalendarClock className="h-4 w-4" />
											Sin rutas asignadas todavía
										</span>
										<button
											type="button"
											onClick={addEntry}
											className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40"
										>
											<Plus className="h-4 w-4" />
											Crear primera ruta
										</button>
									</div>
								) : (
									entries.map((entry, index) => {
										const overCapacity = overCapacityEntries.has(entry.id);
										return (
											<div
												key={entry.id}
												className="flex flex-col gap-3 rounded-3xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md hover:shadow-sky-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40"
											>
												<div className="flex flex-wrap items-center justify-between gap-3">
													<div className="flex items-center gap-3 text-sm">
														<span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/70 text-xs font-semibold text-slate-500 shadow-sm shadow-slate-200/30 dark:border-white/10 dark:bg-white/10">
															#{index + 1}
														</span>
														<label className="flex flex-col gap-1">
															<span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
																Ruta
															</span>
															<select
																value={entry.routeId}
																onChange={event => updateEntryRoute(entry.id, event.target.value)}
																className="mt-1 w-64 min-w-[12rem] rounded-2xl border border-transparent bg-white/70 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:bg-white/10 dark:text-slate-100"
															>
																<option value="">Seleccione ruta</option>
																{routes.filter(route => route.active).map(route => (
																	<option key={route.id} value={toRouteId(route.id)}>
																		{route.code} — {route.origin} → {route.destination}
																	</option>
																))}
															</select>
														</label>
													</div>
													<div className="flex items-center gap-3">
														<label className="flex flex-col gap-1">
															<span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
																Volumen (L)
															</span>
															<input
																type="number"
																min={0}
																step={1}
																value={entry.volume}
																onChange={event => updateEntryVolume(entry.id, event.target.value)}
																placeholder="Ej: 1200"
																className={`mt-1 w-32 rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
																	overCapacity
																		? 'border-rose-400/60 bg-rose-50/80 text-rose-600 focus:ring-rose-200 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200'
																		: 'border-transparent bg-white/70 text-slate-700 focus:ring-sky-300 dark:bg-white/10 dark:text-slate-100'
																}`}
															/>
														</label>
														<button
															type="button"
															onClick={() => removeEntry(entry.id)}
															className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
														>
															<Trash2 className="h-4 w-4" />
															Quitar
														</button>
													</div>
												</div>
												{overCapacity && (
													<div className="flex items-center gap-2 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
														<AlertCircle className="h-4 w-4" />
														El volumen supera la capacidad estimada del camión.
													</div>
												)}
											</div>
										);
									})
								)}
							</div>
						</section>

						{error && (
							<div className="flex items-center gap-2 rounded-3xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-600 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
								<AlertCircle className="h-5 w-5" />
								{error}
							</div>
						)}

						<footer className="flex flex-col gap-3 border-t border-slate-200/60 pt-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
							<div className="flex items-center gap-2 text-xs text-slate-500 dark:text-blue-200/70">
								<CalendarClock className="h-4 w-4" />
								La disponibilidad se recalcula en cuanto guardes los cambios.
							</div>
							<div className="flex flex-wrap gap-2">
								{existing && (
									<button
										type="button"
										onClick={handleRemove}
										className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
									>
										<Trash2 className="h-4 w-4" />
										Eliminar asignación
									</button>
								)}
								<button
									type="button"
									onClick={handleSave}
									className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40"
								>
									<Save className="h-4 w-4" />
									Guardar cambios
								</button>
							</div>
						</footer>
					</div>
				</div>
			</div>
		</div>
	);
};

export default AssignTruckModal;