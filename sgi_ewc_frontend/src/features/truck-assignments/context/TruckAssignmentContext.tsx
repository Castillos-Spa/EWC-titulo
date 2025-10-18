import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { getVehiculosFromTaller, getDrivers, type TallerDriver } from '../../../utils/tallerApi';
import { getAssignments, createAssignment, deleteAssignment } from '../../../utils/assignmentsApi';
import type { Vehiculo } from '../../../types/Vehiculo';

export interface Truck {
	id: string;
	code: string; // Código del camión
	capacityTons?: number;
	active: boolean;
}

export interface Driver {
	id: string;
	name: string;
	active: boolean;
}

export interface TruckAssignment {
	id: string;
	truckId: string;
	routeId: string;
	driverId: string;
	date: Date; // día planificado
	status?: 'Planificada' | 'Programada' | 'Iniciada' | 'Cancelada';
	startTime?: string; // HH:mm
	endTime?: string; // HH:mm
	volumeLiters?: number;
}

interface ContextValue {
	trucks: Truck[];
	drivers: Driver[];
	assignments: TruckAssignment[];
	addAssignment: (data: Omit<TruckAssignment, 'id'>) => { ok: boolean; error?: string };
	removeAssignment: (id: string) => void;
	setTruckDayAssignment: (
		truckId: string,
		date: Date,
		driverId: string,
		routes: Array<{ routeId: string; volumeLiters?: number }>
	) => { ok: boolean; error?: string };
	updateAssignment: (id: string, patch: Partial<TruckAssignment>) => void;
	kpis: {
		totalTrucks: number;
		activeTrucks: number;
	};
}

type BackendAssignment = {
	id: number | string;
	truckId?: number | string;
	routeId?: number | string;
	driverId?: number | string;
	date: string | Date;
	status?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	volumeLiters?: number | null;
	truck?: { id?: number | string } | null;
	route?: { id?: number | string } | null;
	driver?: { id?: number | string } | null;
};

const TruckAssignmentContext = createContext<ContextValue | undefined>(undefined);

const dateOnly = (input?: Date) => {
	const d = input ? new Date(input) : new Date();
	d.setHours(0, 0, 0, 0);
	return d;
};

const sameDay = (a: Date, b: Date) => {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

const toTruck = (vehiculo: Vehiculo): Truck => {
	const withOptionalCode = vehiculo as Vehiculo & { codigo?: string | null };
	const rawCode = (withOptionalCode.codigo ?? vehiculo.patente ?? '').trim();
	const code = (rawCode.length > 0 ? rawCode : `VEH-${vehiculo.id}`).toUpperCase();
	const capacity = typeof vehiculo.capacidad === 'number' ? Number(vehiculo.capacidad) : undefined;
	const id = vehiculo.id !== undefined && vehiculo.id !== null ? String(vehiculo.id) : code;
	return {
		id,
		code,
		capacityTons: capacity,
		active: vehiculo.estado === 'disponible',
	};
};

const toDriver = (driver: TallerDriver): Driver => {
	const rawId = driver.id ?? driver.userId ?? driver.username ?? driver.email ?? '';
	const nameParts = [driver.firstName, driver.lastName].filter(Boolean) as string[];
	const composedName = nameParts.join(' ').trim();
	const name = (driver.fullName?.trim() || composedName || driver.username || driver.email || `Conductor ${rawId || 'sin_id'}`).trim();
	return {
		id: rawId ? String(rawId) : name,
		name,
		active: driver.active ?? true,
	};
};

const ASSIGNMENT_STATUSES: readonly NonNullable<TruckAssignment['status']>[] = ['Planificada', 'Programada', 'Iniciada', 'Cancelada'] as const;

const toAssignment = (assignment: BackendAssignment): TruckAssignment => {
	const truckId = assignment.truckId ?? assignment.truck?.id ?? '';
	const routeId = assignment.routeId ?? assignment.route?.id ?? '';
	const driverId = assignment.driverId ?? assignment.driver?.id ?? '';
	const date = assignment.date instanceof Date ? assignment.date : new Date(assignment.date);
	const statusRaw = assignment.status ?? 'Planificada';
	const normalizedStatus = ASSIGNMENT_STATUSES.includes(statusRaw as (typeof ASSIGNMENT_STATUSES)[number])
		? (statusRaw as TruckAssignment['status'])
		: 'Planificada';
	const volume = typeof assignment.volumeLiters === 'number' ? assignment.volumeLiters : undefined;
	return {
		id: String(assignment.id),
		truckId: truckId ? String(truckId) : '',
		routeId: routeId ? String(routeId) : '',
		driverId: driverId ? String(driverId) : '',
		date,
		status: normalizedStatus,
		startTime: assignment.startTime ?? undefined,
		endTime: assignment.endTime ?? undefined,
		volumeLiters: volume,
	};
};

export const TruckAssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [trucks, setTrucks] = useState<Truck[]>([]);
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [assignments, setAssignments] = useState<TruckAssignment[]>([]);

	const fetchData = useCallback(async () => {
		try {
			const [truckData, driverData, assignmentData] = await Promise.all([
				getVehiculosFromTaller(),
				getDrivers(),
				getAssignments(),
			]);
			const filteredVehicles = truckData.filter(vehiculo => {
				const rawType = (vehiculo.tipo ?? '').toLowerCase();
				const isTruck = rawType === 'camion' || rawType === 'camión' || rawType === 'truck';
				const isAvailable = (vehiculo.estado ?? '').toLowerCase() === 'disponible';
				return isTruck && isAvailable;
			});
			setTrucks(filteredVehicles.map(toTruck));
			setDrivers(driverData.map(toDriver));
			setAssignments((assignmentData as unknown as BackendAssignment[]).map(toAssignment));
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Error al cargar datos de asignación';
			console.error(message, err);
		}
	}, []);

	useEffect(() => {
		void fetchData();
	}, [fetchData]);

	const addAssignment: ContextValue['addAssignment'] = useCallback((_data) => {
		console.warn('addAssignment está deprecado, usar setTruckDayAssignment', _data);
		return { ok: true };
	}, []);

	const removeAssignment: ContextValue['removeAssignment'] = useCallback((id) => {
		void deleteAssignment(Number(id)).then(fetchData);
	}, [fetchData]);

	const setTruckDayAssignmentImpl = useCallback(
		(
			truckId: string,
			date: Date,
			driverId: string,
			routesWithVolumes: Array<{ routeId: string; volumeLiters?: number }>,
		): { ok: boolean; error?: string } => {
			const truck = trucks.find(t => t.id === truckId);
			const maxCapacity = typeof truck?.capacityTons === 'number' ? truck.capacityTons : null;
			if (maxCapacity != null) {
				const exceedingEntry = routesWithVolumes.find(entry => (entry.volumeLiters ?? 0) > maxCapacity);
				if (exceedingEntry) {
					return {
						ok: false,
						error: `La ruta ${exceedingEntry.routeId} excede la capacidad del camión (${maxCapacity} L).`,
					};
				}
			}

			const d0 = dateOnly(date);
			const driverConflict = assignments.some(
				a => sameDay(a.date, d0) && a.driverId === driverId && a.truckId !== truckId,
			);
			if (driverConflict) {
				return { ok: false, error: 'El conductor ya está asignado a otro camión en esa fecha.' };
			}

			const toDelete = assignments.filter(a => a.truckId === truckId && sameDay(a.date, d0));
			const toCreate = routesWithVolumes.map(entry => ({
				truckId,
				routeId: entry.routeId,
				driverId,
				date,
				status: 'Planificada' as const,
				volumeLiters: entry.volumeLiters,
			}));

			Promise.all([
				...toDelete.map(a => deleteAssignment(Number(a.id))),
				...toCreate.map(c => createAssignment(c)),
			])
				.then(fetchData)
				.catch(err => {
					console.error('Error al guardar asignaciones:', err);
				});

			return { ok: true };
		},
		[assignments, fetchData, trucks],
	);

	const setTruckDayAssignmentWithDetails: ContextValue['setTruckDayAssignment'] = useCallback(
		(truckId, date, driverId, routes) => setTruckDayAssignmentImpl(truckId, date, driverId, routes),
		[setTruckDayAssignmentImpl],
	);

	const updateAssignment: ContextValue['updateAssignment'] = useCallback((id, patch) => {
		console.warn('updateAssignment no está completamente implementado con la API');
		setAssignments(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
	}, []);

	const kpis = useMemo(() => {
		const totalTrucks = trucks.length;
		const activeTrucks = trucks.filter(t => t.active).length;
		return { totalTrucks, activeTrucks };
	}, [trucks]);

	const value = useMemo(
		() => ({
			trucks,
			drivers,
			assignments,
			addAssignment,
			removeAssignment,
			setTruckDayAssignment: setTruckDayAssignmentWithDetails,
			updateAssignment,
			kpis,
		}),
		[
			trucks,
			drivers,
			assignments,
			addAssignment,
			removeAssignment,
			setTruckDayAssignmentWithDetails,
			updateAssignment,
			kpis,
		],
	);

	return <TruckAssignmentContext.Provider value={value}>{children}</TruckAssignmentContext.Provider>;
};

export default TruckAssignmentContext;