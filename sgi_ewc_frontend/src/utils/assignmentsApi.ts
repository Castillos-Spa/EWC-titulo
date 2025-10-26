import apiFetch from "./api";

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

const extractList = <T>(input: PaginatedResponse<T> | null | undefined): T[] => {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  if (typeof input === "object") {
    const candidates = [input.items, input.data, input.results];
    const found = candidates.find(Array.isArray);
    if (found && Array.isArray(found)) return found as T[];
  }
  return [];
};

/**
 * Obtiene todas las asignaciones.
 */
export async function getAssignments(): Promise<AssignmentDTO[]> {
  const res = (await apiFetch("/rutas/assignments")) as PaginatedResponse<AssignmentDTO>;
  return extractList(res);
}

/**
 * Crea una nueva asignación.
 */
export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<AssignmentDTO> {
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
