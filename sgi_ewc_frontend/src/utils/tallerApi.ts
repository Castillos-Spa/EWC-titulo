import type { OrdenTrabajo } from "../types/OrdenTrabajo";
import type { Vehiculo } from "../types/Vehiculo";
import apiFetch from "./api";

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
    if (found && Array.isArray(found)) {
      return found as T[];
    }
  }
  return [];
};

/**
 * Payload para crear una nueva orden de trabajo desde el taller.
 * Debes ajustar los campos según la definición de `CreateOrdenTrabajoTallerDto` en tu backend.
 */
export type CreateTallerWorkOrderPayload = {
  vehiculoId: number;
  tipo: "Preventivo" | "Correctivo" | "Emergencia";
  description: string;
  repuestos?: string[];
  scheduledDate?: string; // Formato ISO 8601: "YYYY-MM-DDTHH:mm:ss.sssZ"
  responsableId?: number;
  estimatedCost?: number;
  observations?: string;
  nextServiceDate?: string;
};

/**
 * Payload para crear un nuevo vehículo desde el taller.
 * Basado en `CreateVehiculoDto`.
 */
export type CreateVehiculoPayload = {
  patente: string;
  marca: string;
  modelo: string;
  tipo?: string;
  capacidad: number;
  odometro: number;
  estado: "disponible" | "en_mantenimiento" | "en_ruta" | "fuera_de_servicio";
  areaAsignada?: string;
  codigo?: string;
  conductorId?: number;
  lastMaintenanceDate?: string;
};

/**
 * Crea una nueva orden de trabajo desde el taller.
 * Asume un endpoint POST /taller/orden-trabajo
 */
export async function createTallerWorkOrder(
  payload: CreateTallerWorkOrderPayload
): Promise<OrdenTrabajo> {
  return apiFetch("/taller/orden-trabajo", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene todas las órdenes de trabajo del taller.
 * Asume un endpoint GET /taller/orden-trabajo
 */
export async function getTallerWorkOrders(): Promise<OrdenTrabajo[]> {
  const response = (await apiFetch("/taller/orden-trabajo")) as PaginatedResponse<OrdenTrabajo>;
  return extractList(response);
}

/**
 * Obtiene la lista completa de vehículos desde el módulo de taller.
 * Asume un endpoint GET /taller/vehiculos
 */
export async function getVehiculosFromTaller(filters?: {
  tipo?: string;
  estado?: string;
}): Promise<Vehiculo[]> {
  const params = new URLSearchParams();
  if (filters?.tipo) {
    params.append("tipo", filters.tipo);
  }
  if (filters?.estado) {
    params.append("estado", filters.estado);
  }
  const query = params.toString();
  const url = query ? `/vehiculos?${query}` : "/vehiculos";
  const response = (await apiFetch(url)) as PaginatedResponse<Vehiculo>;
  return extractList(response);
}

/**
 * Obtiene un vehículo específico por su patente desde el módulo de taller.
 * Asume un endpoint GET /taller/vehiculos/:patente
 */
export async function getVehiculoFromTaller(
  id: number
): Promise<Vehiculo> {
  return apiFetch(`/vehiculos/${id}`);
}

/**
 * Crea un nuevo vehículo desde el módulo de taller.
 * Asume un endpoint POST /taller/vehiculos
 */
export async function createVehiculoFromTaller(
  payload: CreateVehiculoPayload
): Promise<Vehiculo> {
  return apiFetch("/vehiculos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Cierra una orden de trabajo desde el taller y crea el registro de QA.
 * Asume un endpoint PATCH /taller/orden-trabajo/:id/cerrar
 */
export async function closeTallerWorkOrder(
  otId: number,
  payload: { checklist: string; resultado: string }
): Promise<unknown> {
  // El tipo de retorno depende de lo que devuelva `qaService.create`
  return apiFetch(`/taller/orden-trabajo/${otId}/cerrar`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza un vehículo existente desde el módulo de taller.
 * Asume un endpoint PATCH /taller/vehiculos/:id
 */
export async function updateVehiculoFromTaller(
  id: number,
  payload: Partial<CreateVehiculoPayload>
): Promise<Vehiculo> {
  return apiFetch(`/vehiculos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Actualiza el estado de una orden de trabajo.
 * Asume un endpoint PATCH /taller/orden-trabajo/:id/status
 */
export async function updateWorkOrderStatus(
  id: number,
  estado: string
): Promise<OrdenTrabajo> {
  return apiFetch(`/taller/orden-trabajo/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
  });
}

/**
 * Obtiene la lista de personal filtrado por rol (ej. 'Conductor').
 * Asume un endpoint GET /personal?role=Conductor
 */
export type TallerDriver = {
  id?: number;
  userId?: number;
  username?: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  active?: boolean;
};

type UsersApiDriverCandidate = {
  id?: number;
  username?: string;
  email?: string;
  active?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  roleAssignments?: Array<{
    specialty?: string | null;
    isActive?: boolean | null;
  }> | null;
};

const normalizeUsersResponse = (input: unknown): UsersApiDriverCandidate[] => {
  return extractList(input as PaginatedResponse<UsersApiDriverCandidate>);
};

const isDriverAssignment = (assignment: { specialty?: string | null; isActive?: boolean | null }) => {
  if (!assignment) return false;
  if (assignment.isActive === false) return false;
  return (assignment.specialty ?? "").toUpperCase() === "DRIVER";
};

export async function getDrivers(): Promise<TallerDriver[]> {
  const response = await apiFetch("/users?pageSize=200");
  const candidates = normalizeUsersResponse(response);

  return candidates
    .filter(candidate => candidate.roleAssignments?.some(isDriverAssignment))
    .map(candidate => {
      const id = candidate.id ?? null;
      const firstName = candidate.firstName ?? undefined;
      const lastName = candidate.lastName ?? undefined;
      const username = candidate.username ?? undefined;
      const email = candidate.email ?? undefined;
      const nameParts = [candidate.fullName, firstName, lastName, username, email].filter(Boolean) as string[];
      return {
        id: id ?? undefined,
        userId: id ?? undefined,
        username,
        email,
        fullName: nameParts[0],
        firstName,
        lastName,
        active: candidate.active ?? true,
      } satisfies TallerDriver;
    });
}
