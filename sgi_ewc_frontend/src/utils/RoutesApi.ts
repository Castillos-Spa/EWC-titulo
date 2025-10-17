import type { Route } from "../types/Routes";
import apiFetch from "./api";

/**
 * Payload para crear una nueva ruta.
 * Basado en `CreateRutaDto` del backend.
 */
export type CreateRoutePayload = Omit<Route, "id" | "createdAt" | "updatedAt">;

/**
 * Payload para actualizar una ruta existente.
 * Basado en `UpdateRutaDto` del backend.
 */
export type UpdateRoutePayload = Partial<CreateRoutePayload>;

/**
 * Obtiene todas las rutas.
 */
export async function getRoutes(): Promise<Route[]> {
  return apiFetch("/rutas");
}

/**
 * Obtiene una ruta por su ID.
 */
export async function getRouteById(id: number): Promise<Route> {
  return apiFetch(`/rutas/${id}`);
}

/**
 * Crea una nueva ruta.
 */
export async function createRoute(payload: CreateRoutePayload): Promise<Route> {
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
): Promise<Route> {
  return apiFetch(`/rutas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
