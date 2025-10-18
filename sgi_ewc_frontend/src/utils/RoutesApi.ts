import type {
  TransportRoute,
  CreateTransportRoutePayload,
} from "../types/TransportRoute";
import apiFetch from "./api";

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

/**
 * Obtiene todas las rutas.
 */
export async function getRoutes(): Promise<TransportRoute[]> {
  return apiFetch("/rutas");
}

/**
 * Obtiene una ruta por su ID.
 */
export async function getRouteById(id: number): Promise<TransportRoute> {
  return apiFetch(`/rutas/${id}`);
}

/**
 * Crea una nueva ruta.
 */
export async function createRoute(
  payload: CreateRoutePayload
): Promise<TransportRoute> {
  return apiFetch("/rutas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Elimina una ruta por su ID.
 */
export async function deleteRoute(id: number): Promise<void> {
  await apiFetch(`/rutas/${id}`, { method: "DELETE" });
}

/**
 * Actualiza una ruta existente.
 */
export async function updateRoute(
  id: number,
  payload: UpdateRoutePayload
): Promise<TransportRoute> {
  return apiFetch(`/rutas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
