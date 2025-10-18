import React, { useMemo, useState } from 'react';
import { useTruckAssignment } from '../hooks/useTruckAssignment';
import { useRouteContext } from '@features/transport-routes/context/useRouteContext';
import AssignTruckModal from './AssignTruckModal';

interface Props {
	refDay: Date;
}

type AssignedInfo = { assignmentId: string; driverId: string; driverName: string; routeCode: string };
const buildAssignmentMap = (
	asgs: { id: string; truckId: string; routeId: string; driverId: string; date: Date }[],
	drivers: { id: string; name: string }[],
	routes: Array<{ id: string | number; code: string }>,
	refDay: Date
): Map<string, AssignedInfo> => {
	const map = new Map<string, AssignedInfo>();
	for (const a of asgs) {
		const d = a.date instanceof Date ? a.date : new Date(a.date);
		if (!d || Number.isNaN(d.getTime())) continue;
		if (
			d.getFullYear() !== refDay.getFullYear() ||
			d.getMonth() !== refDay.getMonth() ||
			d.getDate() !== refDay.getDate()
		) {
			continue;
		}
		const drv = drivers.find(dv => dv.id === a.driverId);
		const rt = routes.find(r => String(r.id) === String(a.routeId));
		map.set(a.truckId, { assignmentId: a.id, driverId: a.driverId, driverName: drv?.name || '-', routeCode: rt?.code || '-' });
	}
	return map;
};

const TruckAssignmentList: React.FC<Props> = ({ refDay }) => {
	const { trucks, drivers, assignments, removeAssignment } = useTruckAssignment();
	const { routes } = useRouteContext();
	const [search, setSearch] = useState('');
	const [onlyUnassigned, setOnlyUnassigned] = useState(false);
	const [filterDriver, setFilterDriver] = useState('');
	const [modalTruckId, setModalTruckId] = useState<string | null>(null);

	const trucksFiltered = useMemo(() => {
		const q = search.trim().toLowerCase();
		return trucks.filter(t => t.active && (!q || t.code.toLowerCase().includes(q)));
	}, [trucks, search]);

	const assignmentByTruckDay = useMemo(() => buildAssignmentMap(assignments, drivers, routes as Array<{ id: string | number; code: string }>, refDay), [assignments, drivers, routes, refDay]);

	const trucksVisible = useMemo(() => {
		const base = trucksFiltered.map(t => ({ truck: t, assigned: assignmentByTruckDay.get(t.id) }));
		let rows = base;
		if (onlyUnassigned) rows = rows.filter(r => !r.assigned);
		if (filterDriver) rows = rows.filter(r => r.assigned && r.assigned.driverId === filterDriver);
		return rows;
	}, [trucksFiltered, assignmentByTruckDay, onlyUnassigned, filterDriver]);

	const handleOpenModal = (truckId: string) => setModalTruckId(truckId);
	const handleCloseModal = () => setModalTruckId(null);

	const exportCsv = () => {
		const rows = trucksVisible.map(({ truck, assigned }) => ({
			fecha: refDay.toISOString().slice(0,10),
			camion: truck.code,
			ruta: assigned?.routeCode ?? '',
			conductor: assigned?.driverName ?? '',
		}));
		const header = ['fecha','camion','ruta','conductor'];
		const csv = [header.join(','), ...rows.map(r => [r.fecha, r.camion, r.ruta, r.conductor].map(v => `"${String(v).split('"').join('""')}"`).join(','))].join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `asignaciones_${refDay.toISOString().slice(0,10)}.csv`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
			<div className="mb-4 grid gap-3 md:grid-cols-5 items-end">
				<div className="md:col-span-2">
					<label htmlFor="search" className="block mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Buscar Camión</label>
					<input id="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Ej: CAM-001" className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
				</div>
				<div>
					<span className="block mb-1 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">Filtros</span>
					<div className="flex items-center gap-3">
						<div className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
							<input id="filter-only-unassigned" type="checkbox" checked={onlyUnassigned} onChange={e => setOnlyUnassigned(e.target.checked)} />
							<label htmlFor="filter-only-unassigned">Solo no asignados</label>
						</div>
						<select aria-label="Filtrar por conductor" value={filterDriver} onChange={e => setFilterDriver(e.target.value)} className="px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700">
							<option value="">Todos los conductores</option>
							{drivers.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
						</select>
					</div>
				</div>
				<div className="flex items-end justify-end">
					<button onClick={exportCsv} className="px-3 py-2 text-sm font-medium text-white bg-emerald-600 rounded">Exportar CSV</button>
				</div>
			</div>
			<div className="overflow-auto">
				<table className="w-full text-sm border-collapse">
					<thead>
						<tr className="bg-gray-100 dark:bg-gray-800">
							<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Camión</th>
							<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Capacidad (t)</th>
							<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Asignación ({refDay.toISOString().slice(0,10)})</th>
							<th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">Acciones</th>
						</tr>
					</thead>
					<tbody>
						{trucksVisible.map(({ truck: t, assigned }) => {
							return (
								<tr key={t.id} className="border-b last:border-0 border-gray-200 dark:border-gray-700">
									<td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">{t.code}</td>
									<td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">{t.capacityTons ?? '-'}</td>
									<td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
										{assigned ? (
											<span className="inline-flex items-center gap-2">
												<span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-800/40 dark:text-blue-300">{assigned.routeCode}</span>
												<span className="text-gray-500">/</span>
												<span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300">{assigned.driverName}</span>
											</span>
										) : (
											<span className="text-gray-500">Sin asignación</span>
										)}
									</td>
									<td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200 whitespace-nowrap">
										<div className="flex items-center gap-2">
											<button onClick={() => handleOpenModal(t.id)} className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded">{assigned ? 'Editar' : 'Asignar'}</button>
											{assigned && (
												<button onClick={() => removeAssignment(assigned.assignmentId)} className="px-3 py-1 text-xs font-medium text-red-600 bg-white border border-red-600 rounded hover:bg-red-50 dark:bg-gray-900 dark:hover:bg-gray-800">Quitar</button>
											)}
										</div>
									</td>
								</tr>
							);
						})}
						{trucksVisible.length === 0 && (
							<tr>
								<td colSpan={4} className="px-3 py-4 text-sm text-center text-gray-500 dark:text-gray-400">No hay camiones activos que coincidan</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
			<AssignTruckModal open={!!modalTruckId} onClose={handleCloseModal} truckId={modalTruckId || ''} refDay={refDay} />
		</div>
	);
};

export default TruckAssignmentList;