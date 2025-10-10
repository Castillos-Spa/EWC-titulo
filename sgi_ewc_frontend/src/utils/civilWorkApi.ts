import type { CivilWork } from "../types/CivilWork";
import apiFetch from "./api";

export type CreateCivilWorkPayload = Omit<
  CivilWork,
  "id" | "responsibleStaff" | "materialsUsed" | "issues"
> & {
  responsibleStaffIds: number[];
  materialsUsed?: { name: string; quantity: number; unit: string }[];
};

export type UpdateCivilWorkPayload = Partial<CreateCivilWorkPayload>;

/**
 * Obtiene todos los reportes de obras civiles con paginación.
 * @param page - Número de página
 * @param pageSize - Tamaño de la página
 */
export async function fetchCivilWorks(
  page = 1,
  pageSize = 20
): Promise<{ items: Partial<CivilWork>[]; total: number }> {
  return apiFetch(`/civil-works?page=${page}&pageSize=${pageSize}`);
}

/**
 * Obtiene un reporte de obra civil por su ID.
 * @param id - ID del reporte
 */
export async function fetchCivilWorkById(id: number): Promise<CivilWork> {
  return apiFetch(`/civil-works/${id}`);
}

/**
 * Crea un nuevo reporte de obra civil.
 * @param payload - Datos para crear el reporte
 */
export async function createCivilWork(
  payload: CreateCivilWorkPayload
): Promise<CivilWork> {
  return apiFetch("/civil-works", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza un reporte de obra civil existente.
 * @param id - ID del reporte a actualizar
 * @param payload - Datos para actualizar
 */
export async function updateCivilWork(
  id: number,
  payload: UpdateCivilWorkPayload
): Promise<CivilWork> {
  return apiFetch(`/civil-works/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Elimina un reporte de obra civil.
 * @param id - ID del reporte a eliminar
 */
export async function deleteCivilWork(id: number): Promise<CivilWork> {
  return apiFetch(`/civil-works/${id}`, { method: "DELETE" });
}
