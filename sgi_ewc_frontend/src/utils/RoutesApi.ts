import type {
  TransportRoute,
  CreateTransportRoutePayload,
} from "../types/TransportRoute";
import apiFetch from "./api";
import { fetchWithCache, invalidateCache } from "./requestCache";

/**
 * Payload para crear una nueva ruta.
 * Basado en `CreateRutaDto` del backend.
 */
export type CreateRoutePayload = CreateTransportRoutePayload;

/**
 * Payload para actualizar una ruta existente.
 * Basado en `UpdateRutaDto` del backend.
 */
export type UpdateRoutePayload = Partial<CreateRoutePayload> & {
  active?: boolean;
};

const ROUTES_CACHE_KEY = "routes:list";

/**
 * Obtiene todas las rutas.
 */
export async function getRoutes(
  forceRefresh = false
): Promise<TransportRoute[]> {
  return fetchWithCache(ROUTES_CACHE_KEY, () => apiFetch("/routes"), {
    force: forceRefresh,
  });
}

/**
 * Obtiene una ruta por su ID.
 */
export async function getRouteById(id: number): Promise<TransportRoute> {
  return apiFetch(`/routes/${id}`);
}

/**
 * Crea una nueva ruta.
 */
export async function createRoute(
  payload: CreateRoutePayload
): Promise<TransportRoute> {
  const created = await apiFetch("/routes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCache(ROUTES_CACHE_KEY);
  return created;
}

/**
 * Elimina una ruta por su ID.
 */
export async function deleteRoute(id: number): Promise<void> {
  await apiFetch(`/routes/${id}`, { method: "DELETE" });
  invalidateCache(ROUTES_CACHE_KEY);
}

/**
 * Actualiza una ruta existente.
 */
export async function updateRoute(
  id: number,
  payload: UpdateRoutePayload
): Promise<TransportRoute> {
  const updated = await apiFetch(`/routes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  invalidateCache(ROUTES_CACHE_KEY);
  return updated;
}
