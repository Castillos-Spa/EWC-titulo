import type { TruckAssignment } from "../types/Route";
import apiFetch from "./api";

export type CreateAssignmentPayload = Omit<TruckAssignment, "id">;

/**
 * Obtiene todas las asignaciones.
 */
export async function getAssignments(): Promise<TruckAssignment[]> {
  // Llama al endpoint correcto en el módulo de rutas
  return apiFetch("/rutas/assignments");
}

/**
 * Crea una nueva asignación.
 */
export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<TruckAssignment> {
  return apiFetch("/rutas/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Elimina una asignación por su ID.
 */
export async function deleteAssignment(id: number): Promise<void> {
  await apiFetch(`/rutas/assignments/${id}`, { method: "DELETE" });
}
