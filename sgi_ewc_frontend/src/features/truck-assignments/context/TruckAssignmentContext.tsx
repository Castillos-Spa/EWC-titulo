import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { getVehiculos, getDrivers, type TallerDriver } from '../../../utils/tallerApi';
import { getAssignments, createAssignment, deleteAssignment } from '../../../utils/assignmentsApi';
import type { Vehiculo } from '../../../types/Vehiculo';

export interface Truck {
	id: string;
	code: string; // Código del camión
	name?: string;
	plate: string;
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

// Helper: reconciliar asignaciones reemplazando temporales por las reales por routeId en un día dado
function reconcileAssignmentsByRoute(
	prev: TruckAssignment[],
	replacements: Map<string, TruckAssignment>,
	day: Date,
): TruckAssignment[] {
	return prev.map(a => {
		const replacement = replacements.get(a.routeId);
		if (replacement && a.truckId === replacement.truckId && sameDay(a.date, day)) {
			return replacement;
		}
		return a;
	});
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
	const rawCode = (vehiculo.codigo ?? vehiculo.patente ?? '').trim();
	const code = (rawCode.length > 0 ? rawCode : `VEH-${vehiculo.id}`).toUpperCase();
	const nameRaw = [vehiculo.marca, vehiculo.modelo].filter(Boolean).join(' ').trim();
	const name = nameRaw.length > 0 ? nameRaw : undefined;
	return {
		id: String(vehiculo.id),
		code,
		name,
		plate: String(vehiculo.patente ?? '').toUpperCase(),
		capacityTons: Number.isFinite(vehiculo.capacidad) ? vehiculo.capacidad : undefined,
		active: (vehiculo.estado ?? 'disponible') !== 'inactivo',
	};
};

const isTruck = (vehiculo: Vehiculo): boolean => {
	const raw = vehiculo.tipo ?? '';
	if (!raw) return false;
	const t = raw
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, ''); // quita acentos

	// Denegar tipos claramente no-camión (contienen "camioneta", "pickup", etc.)
	const deny = ['camioneta', 'pick-up', 'pickup', 'ute', 'van', 'minivan', 'auto', 'automovil', 'car', 'carro', 'furgon', 'furgoneta', 'suv'];
	if (deny.some(word => t.includes(word))) return false;

	// Aceptar tipos de camión comunes
	const allow = ['camion', 'truck', 'tractocamion', 'tracto', 'volquete', 'tolva', 'cabezal', 'remolcador'];
	return allow.some(word => t.includes(word));
};

const toDriver = (wire: TallerDriver): Driver => {
	const id = String(wire.id ?? wire.userId ?? Math.random());
	const fullName = wire.fullName
		?? [wire.firstName, wire.lastName].filter(Boolean).join(' ').trim()
		?? wire.username
		?? wire.email
		?? '—';
	return {
		id,
		name: String(fullName),
		active: (wire.active ?? true) === true,
	};
};

const toAssignment = (wire: BackendAssignment): TruckAssignment => ({
	id: String(wire.id),
	truckId: String(wire.truckId ?? wire.truck?.id ?? '0'),
	routeId: String(wire.routeId ?? wire.route?.id ?? '0'),
	driverId: String(wire.driverId ?? wire.driver?.id ?? '0'),
	date: new Date(wire.date),
	status: (wire.status as TruckAssignment['status']) ?? 'Planificada',
	startTime: wire.startTime ?? undefined,
	endTime: wire.endTime ?? undefined,
	volumeLiters: wire.volumeLiters ?? undefined,
});

export const TruckAssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [trucks, setTrucks] = useState<Truck[]>([]);
	const [drivers, setDrivers] = useState<Driver[]>([]);
	const [assignments, setAssignments] = useState<TruckAssignment[]>([]);

	useEffect(() => {
		const load = async () => {
			const [vehiculosRes, choferesRes, assignmentsRes] = await Promise.allSettled([
				getVehiculos(),
				getDrivers(),
				getAssignments(),
			]);

			if (vehiculosRes.status === 'fulfilled') {
				setTrucks((vehiculosRes.value ?? []).filter(isTruck).map(toTruck));
			} else {
				console.warn('No se pudieron cargar vehículos', vehiculosRes.reason);
				setTrucks([]);
			}

			if (choferesRes.status === 'fulfilled') {
				setDrivers((choferesRes.value ?? []).map(toDriver));
			} else {
				console.warn('No se pudieron cargar conductores', choferesRes.reason);
				setDrivers([]);
			}

			if (assignmentsRes.status === 'fulfilled') {
				setAssignments((assignmentsRes.value ?? []).map(toAssignment));
			} else {
				console.warn('No se pudieron cargar asignaciones', assignmentsRes.reason);
				setAssignments([]);
			}
		};
		void load();
	}, []);

		const addAssignment: ContextValue['addAssignment'] = useCallback((data) => {
			const id = String(Date.now());
			const normalized: TruckAssignment = { ...data, id };
			setAssignments(prev => [...prev, normalized]);
			// Aplicar persistencia real vía API si es necesario
			return { ok: true };
		}, []);

		const removeAssignment: ContextValue['removeAssignment'] = useCallback((id) => {
			try {
				setAssignments(prev => prev.filter(a => a.id !== id));
				const numericId = Number(id);
				if (Number.isFinite(numericId)) {
					void deleteAssignment(numericId);
				}
			} catch (err) {
				console.error('No se pudo eliminar la asignación', err);
			}
		}, []);

	const updateAssignment: ContextValue['updateAssignment'] = useCallback((id, patch) => {
		setAssignments(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
	}, []);

			const setTruckDayAssignment: ContextValue['setTruckDayAssignment'] = useCallback((truckId, date, driverId, routes) => {
			try {
				const day = dateOnly(date);
				// eliminar existentes del mismo truck ese día
						setAssignments(prev => prev.filter(a => !(a.truckId === truckId && sameDay(a.date, day))));
						const created: TruckAssignment[] = routes.map((r, idx) => ({
							id: `temp-${idx}-${Date.now()}`,
					truckId,
					driverId,
					routeId: r.routeId,
					date: day,
					status: 'Programada',
					volumeLiters: r.volumeLiters,
				}));
				setAssignments(prev => [...prev, ...created]);
						// Persistir cada asignación individual según el contrato del backend y reconciliar IDs
						(async () => {
							try {
								const createdResults = await Promise.all(
									routes.map(r => createAssignment({
										truckId,
										driverId,
										routeId: r.routeId,
										date: day.toISOString(),
										volumeLiters: r.volumeLiters,
									}))
								);
											// Reconciliar: construir un diccionario por routeId para reemplazo
											const replacements = new Map<string, TruckAssignment>();
											for (const dto of createdResults) {
												replacements.set(String(dto.routeId), {
													id: String(dto.id),
													truckId: String(dto.truckId),
													routeId: String(dto.routeId),
													driverId: String(dto.driverId),
													date: new Date(dto.date),
													status: (dto.status as TruckAssignment['status']) ?? 'Programada',
													startTime: dto.startTime ?? undefined,
													endTime: dto.endTime ?? undefined,
													volumeLiters: dto.volumeLiters ?? undefined,
												});
											}
											setAssignments(prev => reconcileAssignmentsByRoute(prev, replacements, day));
							} catch (e) {
								console.error('Error al persistir asignaciones', e);
							}
						})();
				return { ok: true };
			} catch (err) {
				console.error('No se pudo asignar el camión', err);
				return { ok: false, error: 'No se pudo asignar el camión' };
			}
		}, []);

	const kpis = useMemo(() => ({
		totalTrucks: trucks.length,
		activeTrucks: trucks.filter(t => t.active).length,
	}), [trucks]);

	const value: ContextValue = useMemo(() => ({
		trucks,
		drivers,
		assignments,
		addAssignment,
		removeAssignment,
		setTruckDayAssignment,
		updateAssignment,
		kpis,
	}), [trucks, drivers, assignments, addAssignment, removeAssignment, setTruckDayAssignment, updateAssignment, kpis]);

	return (
		<TruckAssignmentContext.Provider value={value}>{children}</TruckAssignmentContext.Provider>
	);
};

export default TruckAssignmentContext;