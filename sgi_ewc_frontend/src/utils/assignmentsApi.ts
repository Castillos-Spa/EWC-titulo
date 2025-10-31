import apiFetch from "./api";
import { fetchWithCache, invalidateCache } from "./requestCache";

export type AssignmentDTO = {
  id: number;
  truckId: number;
  routeId: number;
  driverId: number;
  date: string; // ISO 8601
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  volumeLiters?: number | null;
};

export type CreateAssignmentPayload = {
  truckId: string | number;
  driverId: string | number;
  routeId: string | number;
  date: string; // ISO 8601
  volumeLiters?: number;
};

type PaginatedResponse<T> =
  | T[]
  | {
      items?: T[] | null;
      data?: T[] | null;
      results?: T[] | null;
    };

const extractList = <T>(
  input: PaginatedResponse<T> | null | undefined
): T[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    const candidates = [input.items, input.data, input.results];
    const found = candidates.find(Array.isArray);
    if (found && Array.isArray(found)) return found as T[];
  }
  return [];
};

const ASSIGNMENTS_CACHE_KEY = "routes:assignments";

/**
 * Obtiene todas las asignaciones.
 */
export async function getAssignments(
  forceRefresh = false
): Promise<AssignmentDTO[]> {
  return fetchWithCache(
    ASSIGNMENTS_CACHE_KEY,
    async () => {
      const res = (await apiFetch(
        "/rutas/assignments"
      )) as PaginatedResponse<AssignmentDTO>;
      return extractList(res);
    },
    { force: forceRefresh }
  );
}

/**
 * Crea una nueva asignación.
 */
export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<AssignmentDTO> {
  const created = await apiFetch("/rutas/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCache(ASSIGNMENTS_CACHE_KEY);
  return created;
}

/**
 * Elimina una asignación por su ID.
 */
export async function deleteAssignment(id: number): Promise<void> {
  await apiFetch(`/rutas/assignments/${id}`, { method: "DELETE" });
  invalidateCache(ASSIGNMENTS_CACHE_KEY);
}
