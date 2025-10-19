import React, { useMemo, useState } from 'react';
import {
	BadgeCheck,
	CalendarClock,
	Filter,
	MapPinned,
	Search,
	Truck,
	UserRound,
	Waypoints,
	Wrench,
	XCircle,
} from 'lucide-react';
import { useTruckAssignment } from '../hooks/useTruckAssignment';
import { useRouteContext } from '@features/transport-routes/context/useRouteContext';
import AssignTruckModal from './AssignTruckModal';

interface Props {
	refDay: Date;
}

const TruckAssignmentCards: React.FC<Props> = ({ refDay }) => {
	const { assignments, trucks, drivers, removeAssignment } = useTruckAssignment();
	const { routes } = useRouteContext();
	const [modalTruckId, setModalTruckId] = useState<string | null>(null);
	const [truckQuery, setTruckQuery] = useState('');
	const [driverFilter, setDriverFilter] = useState<string>('');
	const [routeQuery, setRouteQuery] = useState('');

	const dayAssignments = useMemo(() => {
		const normalized = new Date(refDay);
		normalized.setHours(0, 0, 0, 0);
		return assignments.filter(assignment => {
			const date = assignment.date instanceof Date ? assignment.date : new Date(assignment.date);
			return (
				date.getFullYear() === normalized.getFullYear() &&
				date.getMonth() === normalized.getMonth() &&
				date.getDate() === normalized.getDate()
			);
		});
	}, [assignments, refDay]);

	const dailyGroups = useMemo(() => {
		const mappedRoutes = new Map(routes.map(route => [String(route.id), route] as const));
		const byTruck = new Map<string, typeof dayAssignments>();
		for (const assignment of dayAssignments) {
			const current = byTruck.get(assignment.truckId) ?? ([] as typeof dayAssignments);
			current.push(assignment);
			byTruck.set(assignment.truckId, current);
		}
		return trucks
			.filter(truck => truck.active)
			.map(truck => {
				const assignmentsForTruck = byTruck.get(truck.id) ?? [];
				const primaryDriverId = assignmentsForTruck[0]?.driverId ?? '';
				const consistentDriver = assignmentsForTruck.every(assignment => assignment.driverId === primaryDriverId);
				const driver = consistentDriver && primaryDriverId ? drivers.find(candidate => candidate.id === primaryDriverId) : undefined;
				const routeItems = assignmentsForTruck.map(assignment => ({
					assignment,
					route: mappedRoutes.get(String(assignment.routeId)),
				}));
				return {
					truck,
					driver,
					driverName: driver?.name ?? (routeItems.length ? 'Varios' : 'Sin asignación'),
					routeItems,
					assignmentsForTruck,
				};
			});
	}, [dayAssignments, trucks, drivers, routes]);

	const filteredGroups = useMemo(() => {
		const normalizedTruck = truckQuery.trim().toLowerCase();
		const normalizedRoute = routeQuery.trim().toLowerCase();
		return dailyGroups.filter(group => {
			const matchesTruck =
				normalizedTruck === '' || group.truck.code.toLowerCase().includes(normalizedTruck);

			let matchesDriver = true;
			if (driverFilter === 'none') {
				matchesDriver = group.routeItems.length === 0;
			} else if (driverFilter !== '') {
				matchesDriver = group.routeItems.some(item => item.assignment.driverId === driverFilter);
			}

			const matchesRoute =
				normalizedRoute === '' ||
				group.routeItems.some(item => (item.route?.code ?? '').toLowerCase().includes(normalizedRoute));

			return matchesTruck && matchesDriver && matchesRoute;
		});
	}, [dailyGroups, driverFilter, truckQuery, routeQuery]);

	const handleDeleteAssignment = (id: string) => {
		removeAssignment(id);
	};

	const resetFilters = () => {
		setTruckQuery('');
		setDriverFilter('');
		setRouteQuery('');
	};

	const noMatches = filteredGroups.length === 0;
	const routeCount = dayAssignments.length;

	return (
		<div className="space-y-5">
			<section className="relative overflow-hidden rounded-4xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_45px_-25px_rgba(30,64,175,0.35)] backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/70">
				<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-indigo-500/10" />
				<div className="relative flex flex-col gap-5">
					<header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div className="space-y-1">
							<p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
								<Filter className="h-4 w-4" />
								Panel de filtros
							</p>
							<h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">Encuentra el camión ideal</h2>
							<p className="text-sm text-slate-500 dark:text-blue-200/80">
								Refina la búsqueda por flota, conductor o ruta para ajustar la planificación en segundos.
							</p>
						</div>
						<div className="inline-flex items-center gap-2 rounded-3xl border border-sky-400/40 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200">
							<MapPinned className="h-4 w-4" />
							{routeCount} rutas hoy
						</div>
					</header>
					<div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))] xl:grid-cols-4">
						<label className="group relative flex items-center rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:shadow-md focus-within:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
							<Search className="mr-3 h-4 w-4 text-slate-400 transition group-focus-within:text-sky-500" />
							<input
								value={truckQuery}
								onChange={event => setTruckQuery(event.target.value)}
								placeholder="Buscar por código de camión"
								className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
							/>
						</label>
						<label className="rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:shadow-md focus-within:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
								<UserRound className="h-4 w-4" />
								Conductor
							</div>
							<select
								value={driverFilter}
								onChange={event => setDriverFilter(event.target.value)}
								className="mt-2 w-full rounded-2xl border border-transparent bg-white/60 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:bg-white/10 dark:text-slate-100"
							>
								<option value="">Todos</option>
								<option value="none">Sin conductor</option>
								{drivers.filter(driver => driver.active).map(driver => (
									<option key={driver.id} value={driver.id}>
										{driver.name}
									</option>
								))}
							</select>
						</label>
						<label className="rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm shadow-slate-200/40 transition focus-within:border-sky-400 focus-within:shadow-md focus-within:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40">
							<div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
								<Waypoints className="h-4 w-4" />
								Ruta
							</div>
							<input
								value={routeQuery}
								onChange={event => setRouteQuery(event.target.value)}
								placeholder="Código o destino"
								className="mt-2 w-full rounded-2xl border border-transparent bg-white/60 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:bg-white/10 dark:text-slate-100"
							/>
						</label>
						<button
							onClick={resetFilters}
							type="button"
							className="flex items-center justify-center gap-2 rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 hover:shadow-md hover:shadow-sky-200/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-200"
						>
							<XCircle className="h-4 w-4" />
							Restablecer
						</button>
					</div>
				</div>
			</section>

			{noMatches ? (
				<section className="relative overflow-hidden rounded-4xl border border-slate-200/60 bg-white/70 px-6 py-12 text-center shadow-[0_18px_40px_-30px_rgba(14,165,233,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/70">
					<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),transparent_60%)]" />
					<div className="relative mx-auto flex max-w-xl flex-col items-center gap-4 text-slate-600 dark:text-slate-300">
						<div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-sky-400/40 bg-sky-50/80 text-sky-500 shadow-sm shadow-sky-200/50 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200">
							<CalendarClock className="h-8 w-8" />
						</div>
						<h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">No encontramos camiones para los filtros seleccionados</h3>
						<p className="text-sm">Ajusta los filtros o limpia la búsqueda para visualizar nuevamente la planificación completa.</p>
						<button
							onClick={resetFilters}
							type="button"
							className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40"
						>
							Restablecer filtros
						</button>
					</div>
				</section>
			) : (
				<div className="grid gap-4 xl:grid-cols-2">
					{filteredGroups.map(group => {
						const { truck, driver, driverName, routeItems } = group;
						const hasAssignments = routeItems.length > 0;
						return (
							<article
								key={truck.id}
								className="relative overflow-hidden rounded-4xl border border-slate-200/60 bg-white/75 px-6 py-6 text-slate-900 shadow-[0_20px_50px_-28px_rgba(59,130,246,0.35)] backdrop-blur-lg transition hover:-translate-y-1 hover:shadow-xl hover:shadow-sky-500/30 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100"
							>
								<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/15" />
								<div className="relative flex flex-col gap-5">
									<header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
										<div className="space-y-2">
											<div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-blue-200/70">
												<Truck className="h-4 w-4" />
												{truck.code}
											</div>
											<h3 className="text-xl font-semibold tracking-tight">Agenda del {refDay.toISOString().slice(0, 10)}</h3>
											<div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-blue-200/70">
												<span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-1 font-medium dark:bg-white/10">
													<Wrench className="h-3.5 w-3.5" />
													Capacidad {truck.capacityTons ?? '—'} t
												</span>
												<span className="inline-flex items-center gap-1 rounded-full bg-slate-200/80 px-2 py-1 font-medium dark:bg-white/10">
													<Waypoints className="h-3.5 w-3.5" />
													{routeItems.length} rutas
												</span>
											</div>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => setModalTruckId(truck.id)}
												className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:shadow-xl hover:shadow-sky-500/40"
											>
												{hasAssignments ? 'Editar rutas' : 'Asignar rutas'}
											</button>
										</div>
									</header>

									<div className="flex flex-col gap-4 rounded-3xl border border-slate-200/60 bg-white/70 px-5 py-4 shadow-inner shadow-slate-200/60 dark:border-white/10 dark:bg-slate-900/60">
										<div className="flex flex-wrap items-center justify-between gap-3">
											<div className="flex items-center gap-2 text-sm">
												<UserRound className="h-5 w-5 text-slate-400" />
												<div className="flex flex-col">
													<span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">Conductor</span>
													<span className="text-sm font-medium text-slate-800 dark:text-slate-100">{driverName}</span>
												</div>
											</div>
											{driver ? (
												<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200">
													<BadgeCheck className="h-3.5 w-3.5" />
													Asignado
												</span>
											) : (
												<span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200">
													<UserRound className="h-3.5 w-3.5" />
													Pendiente
												</span>
											)}
										</div>

										<div className="space-y-2">
											{routeItems.length === 0 ? (
												<div className="flex items-center justify-between rounded-2xl border border-dashed border-slate-300/70 bg-slate-100/60 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
													<span className="flex items-center gap-2">
														<Waypoints className="h-4 w-4" />
														Sin rutas asignadas
													</span>
												</div>
											) : (
												routeItems.map(({ assignment, route }) => (
													<div
														key={assignment.id}
														className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm shadow-slate-200/40 transition hover:-translate-y-0.5 hover:border-sky-400 hover:shadow-md hover:shadow-sky-200/50 dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40"
													>
														<div className="flex items-center justify-between">
															<div className="flex flex-col gap-1 text-sm">
																<span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">
																	<MapPinned className="h-4 w-4" />
																	{route?.code ?? 'Ruta pendiente'}
																</span>
																<span className="font-medium text-slate-900 dark:text-slate-100">
																	{route ? `${route.origin} → ${route.destination}` : assignment.routeId}
																</span>
															</div>
															<button
																type="button"
																onClick={() => handleDeleteAssignment(assignment.id)}
																className="inline-flex items-center gap-2 rounded-full border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-500/20 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200"
															>
																<XCircle className="h-3.5 w-3.5" />
																Quitar
															</button>
														</div>
														<div className="flex items-center gap-3 text-xs text-slate-500 dark:text-blue-200/70">
															<span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-1 font-medium dark:bg-white/10">
																<CalendarClock className="h-3.5 w-3.5" />
																{assignment.startTime ?? 'Inicio pendiente'}
															</span>
															<span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-1 font-medium dark:bg-white/10">
																<Waypoints className="h-3.5 w-3.5" />
																{assignment.status ?? 'Planificada'}
															</span>
															<span className="inline-flex items-center gap-1 rounded-full bg-slate-200/70 px-2 py-1 font-medium dark:bg-white/10">
																<Wrench className="h-3.5 w-3.5" />
																{assignment.volumeLiters == null ? 'Sin volumen' : `${assignment.volumeLiters} L`}
															</span>
														</div>
													</div>
											))
											)}
										</div>
									</div>
								</div>
								</article>
							);
						})}
				</div>
			)}
			<AssignTruckModal open={!!modalTruckId} onClose={() => setModalTruckId(null)} truckId={modalTruckId ?? ''} refDay={refDay} />
		</div>
	);
};

export default TruckAssignmentCards;