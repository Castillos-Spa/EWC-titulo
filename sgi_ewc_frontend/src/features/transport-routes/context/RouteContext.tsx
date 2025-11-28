import React, { createContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import {
	getRoutes,
	createRoute,
	updateRoute as apiUpdateRoute,
	type CreateRoutePayload,
	type UpdateRoutePayload,
} from '../../../utils/RoutesApi';
import type {
	TransportRoute as ApiTransportRoute,
	CreateTransportRoutePayload as ApiCreateTransportRoutePayload,
} from '../../../types/TransportRoute';

export interface TransportRoute {
	id: number;
	code: string;
	origin: string;
	destination: string;
	distanceKm: number;
	frequency: string;
	active: boolean;
	createdAt: Date;
}

export type CreateTransportRoutePayload = Omit<TransportRoute, 'id' | 'createdAt' | 'active'>;

interface RouteContextValue {
	routes: TransportRoute[];
	loading: boolean;
	error: string | null;
	addRoute: (data: CreateTransportRoutePayload) => Promise<void>;
	updateRoute: (id: number, changes: UpdateTransportRoutePayload) => Promise<void>;
	toggleActive: (id: number) => Promise<void>;
	kpis: {
		total: number;
		totalDistance: number;
		avgDistance: number;
		activePct: number;
	};
}

const RouteContext = createContext<RouteContextValue | undefined>(undefined);
export type UpdateTransportRoutePayload = Partial<CreateTransportRoutePayload> & { active?: boolean };

const adaptApiToTransportRoute = (apiRoute: ApiTransportRoute): TransportRoute => {
	return {
		id: apiRoute.id,
		code: apiRoute.code,
		origin: apiRoute.origin,
		destination: apiRoute.destination,
		distanceKm: apiRoute.distanceKm,
		frequency: apiRoute.frequency,
		active: apiRoute.active,
		createdAt: new Date(apiRoute.createdAt),
	};
};

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [routes, setRoutes] = useState<TransportRoute[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchRoutes = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const apiRoutes = await getRoutes();
			const items = normalizeApiRoutes(apiRoutes);
			setRoutes(items.map(adaptApiToTransportRoute));
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error al cargar las rutas';
			setError(errorMessage);
			console.error(err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchRoutes();
	}, [fetchRoutes]);

		const addRoute = useCallback(async (data: CreateTransportRoutePayload) => {
			const payload: CreateRoutePayload = mapToApiPayload(data);
			await createRoute(payload);
			await fetchRoutes();
		}, [fetchRoutes]);

		const updateRoute = useCallback(async (id: number, changes: UpdateTransportRoutePayload) => {
			const payload: UpdateRoutePayload = mapToUpdatePayload(changes);
			await apiUpdateRoute(id, payload);
			await fetchRoutes();
		}, [fetchRoutes]);

		const toggleActive = useCallback(async (id: number) => {
			const route = routes.find(r => r.id === id);
			if (!route) return;

			const confirmationMessage = route.active ? '¿Desactivar esta ruta?' : '¿Activar esta ruta?';

			if (globalThis.confirm(confirmationMessage)) {
				try {
					await apiUpdateRoute(id, { active: !route.active });
					await fetchRoutes();
				} catch (err) {
					const errorMessage = err instanceof Error ? err.message : 'Error al desactivar la ruta';
					setError(errorMessage);
					console.error(err);
				}
			}
		}, [routes, fetchRoutes]);

	const kpis = useMemo(() => {
		const total = routes.length;
		const totalDistance = routes.reduce((acc, r) => acc + r.distanceKm, 0);
		const avgDistance = total ? totalDistance / total : 0;
		const activeCount = routes.filter(r => r.active).length;
		const activePct = total ? (activeCount / total) * 100 : 0;
		return { total, totalDistance, avgDistance, activePct };
	}, [routes]);

		const value = useMemo<RouteContextValue>(() => ({
			routes,
			loading,
			error,
			addRoute,
			updateRoute,
			toggleActive,
			kpis,
		}), [routes, loading, error, kpis, addRoute, updateRoute, toggleActive]);

	return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
};

export default RouteContext;

function normalizeApiRoutes(response: unknown): ApiTransportRoute[] {
	if (Array.isArray(response)) return response;
	if (response && typeof response === 'object') {
		const maybeItems = (response as { items?: unknown }).items;
		if (Array.isArray(maybeItems)) return maybeItems as ApiTransportRoute[];
	}
	return [];
}

function mapToApiPayload(data: CreateTransportRoutePayload): CreateRoutePayload {
	const apiPayload: ApiCreateTransportRoutePayload = {
		code: data.code,
		origin: data.origin,
		destination: data.destination,
		distanceKm: data.distanceKm,
		frequency: normalizeFrequency(data.frequency),
	};
	return apiPayload;
}

function mapToUpdatePayload(
	changes: UpdateTransportRoutePayload
): UpdateRoutePayload {
	const payload: UpdateRoutePayload = {};
	if (typeof changes.code === 'string') payload.code = changes.code;
	if (typeof changes.origin === 'string') payload.origin = changes.origin;
	if (typeof changes.destination === 'string') payload.destination = changes.destination;
	if (typeof changes.distanceKm === 'number') payload.distanceKm = changes.distanceKm;
	if (typeof changes.frequency === 'string') {
		payload.frequency = normalizeFrequency(changes.frequency);
	}
	if (typeof changes.active === 'boolean') {
		payload.active = changes.active;
	}
	return payload;
}

function normalizeFrequency(
	rawFrequency: string
): ApiCreateTransportRoutePayload['frequency'] {
	const allowed: ApiCreateTransportRoutePayload['frequency'][] = [
		'Diaria',
		'Semanal',
		'Mensual',
		'Ocasional',
		'Adhoc',
	];
	return (allowed.includes(rawFrequency as (typeof allowed)[number])
		? rawFrequency
		: 'Ocasional') as ApiCreateTransportRoutePayload['frequency'];
}
