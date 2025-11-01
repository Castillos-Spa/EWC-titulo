import type { OrdenTrabajo } from "../types/OrdenTrabajo";
import type { Vehiculo } from "../types/Vehiculo";
import apiFetch from "./api";
import {
  fetchWithCache,
  invalidateCache,
  invalidateCacheByPrefix,
} from "./requestCache";

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
    if (found && Array.isArray(found)) {
      return found as T[];
    }
  }
  return [];
};

const WORK_ORDERS_CACHE_KEY = "workshop:work-orders";
const VEHICLES_CACHE_PREFIX = "vehicles:list";
const DRIVERS_CACHE_KEY = "workshop:drivers";

/**
 * Payload para crear una nueva orden de trabajo desde el taller.
 * Debes ajustar los campos según la definición de `CreateWorkOrderDto` en tu backend.
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
 * Asume un endpoint POST /workshop/work-orders
 */
export async function createTallerWorkOrder(
  payload: CreateTallerWorkOrderPayload
): Promise<OrdenTrabajo> {
  const created = await apiFetch("/workshop/work-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCache(WORK_ORDERS_CACHE_KEY);
  return created;
}

/**
 * Obtiene todas las órdenes de trabajo del taller.
 * Asume un endpoint GET /workshop/work-orders
 */
export async function getTallerWorkOrders(
  forceRefresh = false
): Promise<OrdenTrabajo[]> {
  return fetchWithCache(
    WORK_ORDERS_CACHE_KEY,
    async () => {
      const response = (await apiFetch(
        "/workshop/work-orders"
      )) as PaginatedResponse<OrdenTrabajo>;
      return extractList(response);
    },
    { force: forceRefresh }
  );
}

/**
 * Obtiene la lista completa de vehículos desde el módulo de taller.
 * Asume un endpoint GET /vehicles
 */
export async function getVehiculos(
  filters?: {
    tipo?: string;
    estado?: string;
  },
  forceRefresh = false
): Promise<Vehiculo[]> {
  const params = new URLSearchParams();
  if (filters?.tipo) {
    params.append("tipo", filters.tipo);
  }
  if (filters?.estado) {
    params.append("estado", filters.estado);
  }
  const query = params.toString();
  const url = query ? `/vehicles?${query}` : "/vehicles";
  const cacheKey = `${VEHICLES_CACHE_PREFIX}:${JSON.stringify({
    tipo: filters?.tipo ?? null,
    estado: filters?.estado ?? null,
  })}`;
  return fetchWithCache(
    cacheKey,
    async () => {
      const response = (await apiFetch(url)) as PaginatedResponse<Vehiculo>;
      return extractList(response);
    },
    { force: forceRefresh }
  );
}

/**
 * Obtiene un vehículo específico por su patente desde el módulo de taller.
 * Asume un endpoint GET /vehicles/:id
 */
export async function getVehiculoById(id: number): Promise<Vehiculo> {
  return apiFetch(`/vehicles/${id}`);
}

/**
 * Crea un nuevo vehículo desde el módulo de taller.
 * Asume un endpoint POST /vehicles
 */
export async function createVehiculo(
  payload: CreateVehiculoPayload
): Promise<Vehiculo> {
  const created = await apiFetch("/vehicles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCacheByPrefix(VEHICLES_CACHE_PREFIX);
  return created;
}

/**
 * Cierra una orden de trabajo desde el taller y crea el registro de QA.
 * Asume un endpoint PATCH /workshop/work-orders/:id/close
 */
export async function closeTallerWorkOrder(
  otId: number,
  payload: { checklist: string; result: string }
): Promise<unknown> {
  // El tipo de retorno depende de lo que devuelva `qaService.create`
  const result = await apiFetch(`/workshop/work-orders/${otId}/close`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  invalidateCache(WORK_ORDERS_CACHE_KEY);
  return result;
}

/**
 * Actualiza un vehículo existente desde el módulo de taller.
 * Asume un endpoint PATCH /vehicles/:id
 */
export async function updateVehiculo(
  id: number,
  payload: Partial<CreateVehiculoPayload>
): Promise<Vehiculo> {
  const updated = await apiFetch(`/vehicles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  invalidateCacheByPrefix(VEHICLES_CACHE_PREFIX);
  return updated;
}

// Aliases de compatibilidad (deprecated)
export const getVehiculosFromTaller = getVehiculos; // deprecated
export const getVehiculoFromTaller = getVehiculoById; // deprecated
export const createVehiculoFromTaller = createVehiculo; // deprecated
export const updateVehiculoFromTaller = updateVehiculo; // deprecated

/**
 * Actualiza el estado de una orden de trabajo.
 * Asume un endpoint PATCH /workshop/work-orders/:id/status
 */
export async function updateWorkOrderStatus(
  id: number,
  status: string
): Promise<OrdenTrabajo> {
  const updated = await apiFetch(`/workshop/work-orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  invalidateCache(WORK_ORDERS_CACHE_KEY);
  return updated;
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

const isDriverAssignment = (assignment: {
  specialty?: string | null;
  isActive?: boolean | null;
}) => {
  if (!assignment) return false;
  if (assignment.isActive === false) return false;
  return (assignment.specialty ?? "").toUpperCase() === "DRIVER";
};

export async function getDrivers(
  forceRefresh = false
): Promise<TallerDriver[]> {
  return fetchWithCache(
    DRIVERS_CACHE_KEY,
    async () => {
      const response = await apiFetch("/users?pageSize=200");
      const candidates = normalizeUsersResponse(response);

      return candidates
        .filter((candidate) =>
          candidate.roleAssignments?.some(isDriverAssignment)
        )
        .map((candidate) => {
          const id = candidate.id ?? null;
          const firstName = candidate.firstName ?? undefined;
          const lastName = candidate.lastName ?? undefined;
          const username = candidate.username ?? undefined;
          const email = candidate.email ?? undefined;
          const nameParts = [
            candidate.fullName,
            firstName,
            lastName,
            username,
            email,
          ].filter(Boolean) as string[];
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
    },
    { force: forceRefresh }
  );
}
