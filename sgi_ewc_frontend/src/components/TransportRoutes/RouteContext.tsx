import React, { createContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import {
  getRoutes,
  createRoute,
  updateRoute as apiUpdateRoute,
  type CreateRoutePayload,
  type UpdateRoutePayload,
} from '../../utils/RoutesApi';
import type {
  TransportRoute as ApiTransportRoute,
  CreateTransportRoutePayload as ApiCreateTransportRoutePayload,
} from '../../types/TransportRoute';

/**
 * Tipo de Ruta de Transporte para la UI.
 * Se adapta desde el tipo `ApiRoute` para incluir campos específicos de la UI
 * que no están en el backend actual (ej. code, origin, destination).
 * En una implementación real, estos campos deberían existir en el modelo de la base de datos.
 */
export interface TransportRoute {
  id: number; // Usamos el ID numérico de la API
  code: string; // Mapeado desde `name` en la API
  origin: string;
  destination: string;
  distanceKm: number;
  frequency: string;
  active: boolean; // Mapeado desde `status` en la API
  createdAt: Date; // Convertido desde string
}

/**
 * Payload para crear una nueva ruta de transporte.
 * Se omiten los campos que se generan automáticamente.
 */
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
    activePct: number; // porcentaje de rutas activas
  };
}

const RouteContext = createContext<RouteContextValue | undefined>(undefined);
export type UpdateTransportRoutePayload = Partial<CreateTransportRoutePayload> & { active?: boolean };

/**
 * Adapta una ruta de la API (`ApiRoute`) al formato de la UI (`TransportRoute`).
 * Esta es una capa de compatibilidad porque el modelo de la API y el de la UI son diferentes.
 */
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
      setRoutes(apiRoutes.map(adaptApiToTransportRoute));
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

  const addRoute = async (data: CreateTransportRoutePayload) => {
    const payload: CreateRoutePayload = mapToApiPayload(data);
    await createRoute(payload);
    // Volvemos a obtener todas las rutas para reflejar el cambio
    await fetchRoutes();
  };

  const updateRoute = async (id: number, changes: UpdateTransportRoutePayload) => {
    // Llama a la API para actualizar y luego refresca los datos.
    const payload: UpdateRoutePayload = mapToUpdatePayload(changes);
    await apiUpdateRoute(id, payload);
    await fetchRoutes();
  };

  const toggleActive = async (id: number) => {
    const route = routes.find(r => r.id === id);
    if (!route) return;

    const confirmationMessage = route.active ? '¿Desactivar esta ruta?' : '¿Activar esta ruta?';

    if (globalThis.confirm(confirmationMessage)) {
      try {
        await apiUpdateRoute(id, { active: !route.active });
        await fetchRoutes(); // Recargar rutas
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al desactivar la ruta';
        setError(errorMessage);
        console.error(err);
      }
    }
  };

  const kpis = useMemo(() => {
    const total = routes.length;
    const totalDistance = routes.reduce((acc, r) => acc + r.distanceKm, 0);
    const avgDistance = total ? totalDistance / total : 0;
    const activeCount = routes.filter(r => r.active).length;
    const activePct = total ? (activeCount / total) * 100 : 0;
    return { total, totalDistance, avgDistance, activePct };
  }, [routes]);

  const value = useMemo<RouteContextValue>(
    () => ({
      routes,
      loading,
      error,
      addRoute,
      updateRoute,
      toggleActive,
      kpis,
    }), // eslint-disable-next-line react-hooks/exhaustive-deps
    [routes, loading, error, kpis, fetchRoutes]
  );

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
};

export default RouteContext;

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
  return (allowed.includes(rawFrequency as typeof allowed[number])
    ? rawFrequency
    : 'Ocasional') as ApiCreateTransportRoutePayload['frequency'];
}