import type {
  CivilWork,
  CreateCivilWorkPayload,
  CivilWorkTask,
} from "../types/CivilWork";
import apiFetch from "./api";
import {
  fetchWithCache,
  invalidateCache,
  invalidateCacheByPrefix,
} from "./requestCache";

export type UpdateCivilWorkPayload = Partial<Omit<CivilWork, "id">>;

const CIVIL_WORK_CACHE_PREFIX = "civil-work:list";
const CIVIL_WORK_ITEM_PREFIX = "civil-work:item";

/**
 * Obtiene todos los reportes de obras civiles con paginación.
 * @param page - Número de página
 * @param pageSize - Tamaño de la página
 */
export async function fetchCivilWorks(
  page = 1,
  pageSize = 20,
  forceRefresh = false
): Promise<{ items: Partial<CivilWork>[]; total: number }> {
  const cacheKey = `${CIVIL_WORK_CACHE_PREFIX}:${page}:${pageSize}`;
  return fetchWithCache(
    cacheKey,
    () => apiFetch(`/civil-work?page=${page}&pageSize=${pageSize}`),
    { force: forceRefresh }
  );
}

/**
 * Obtiene un reporte de obra civil por su ID.
 * @param id - ID del reporte
 */
export async function fetchCivilWorkById(id: number): Promise<CivilWork> {
  const cacheKey = `${CIVIL_WORK_ITEM_PREFIX}:${id}`;
  return fetchWithCache(cacheKey, () => apiFetch(`/civil-work/${id}`));
}

/**
 * Crea un nuevo reporte de obra civil.
 * @param payload - Datos para crear el reporte
 */
export async function createCivilWork(
  payload: CreateCivilWorkPayload
): Promise<CivilWork> {
  const created = await apiFetch("/civil-work", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCacheByPrefix(CIVIL_WORK_CACHE_PREFIX);
  if (created && typeof created === "object" && "id" in created) {
    const createdId = (created as Record<string, unknown>).id;
    if (typeof createdId === "string" || typeof createdId === "number") {
      invalidateCache(`${CIVIL_WORK_ITEM_PREFIX}:${String(createdId)}`);
    }
  }
  return created;
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
  const updated = await apiFetch(`/civil-work/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  invalidateCacheByPrefix(CIVIL_WORK_CACHE_PREFIX);
  invalidateCache(`${CIVIL_WORK_ITEM_PREFIX}:${id}`);
  return updated;
}

/**
 * Elimina un reporte de obra civil.
 * @param id - ID del reporte a eliminar
 */
export async function deleteCivilWork(id: number): Promise<CivilWork> {
  const deleted = await apiFetch(`/civil-work/${id}`, { method: "DELETE" });
  invalidateCacheByPrefix(CIVIL_WORK_CACHE_PREFIX);
  invalidateCache(`${CIVIL_WORK_ITEM_PREFIX}:${id}`);
  return deleted;
}

export const updateCivilWorkTasks = async (
  id: number,
  tasks: CivilWorkTask[]
): Promise<CivilWork> => {
  const updated = await apiFetch(`/civil-work/${id}/tasks`, {
    method: "PATCH",
    body: JSON.stringify({ tasks }),
  });
  invalidateCacheByPrefix(CIVIL_WORK_CACHE_PREFIX);
  invalidateCache(`${CIVIL_WORK_ITEM_PREFIX}:${id}`);
  return updated;
};
