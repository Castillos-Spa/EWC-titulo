import React, { createContext, useState, useMemo, ReactNode, useEffect, useCallback } from 'react';
import { getRoutes, createRoute, deleteRoute, updateRoute as apiUpdateRoute } from '../../utils/RoutesApi';
import type { TransportRoute as ApiTransportRoute } from '../../types/TransportRoute';

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
  updateRoute: (id: number, changes: Partial<CreateTransportRoutePayload>) => Promise<void>;
  toggleActive: (id: number) => Promise<void>;
  kpis: {
    total: number;
    totalDistance: number;
    avgDistance: number;
    activePct: number; // porcentaje de rutas activas
  };
}

const RouteContext = createContext<RouteContextValue | undefined>(undefined);

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
    await createRoute(data as any); // Enviamos el payload del formulario directamente
    // Volvemos a obtener todas las rutas para reflejar el cambio
    await fetchRoutes();
  };

  const updateRoute = async (id: number, changes: Partial<CreateTransportRoutePayload>) => {
    // Llama a la API para actualizar y luego refresca los datos.
    await apiUpdateRoute(id, changes as any);
    await fetchRoutes();
  };

  const toggleActive = async (id: number) => {
    const route = routes.find(r => r.id === id);
    if (!route) return;

    const confirmationMessage = route.active ? '¿Desactivar esta ruta?' : '¿Activar esta ruta?';

    if (window.confirm(confirmationMessage)) {
      try {
        await apiUpdateRoute(id, { active: !route.active } as any);
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