import type { OrdenTrabajo } from "../types/OrdenTrabajo";
import type { Vehiculo } from "../types/Vehiculo";
import type { User as AppUser } from "../types/User";
import apiFetch from "./api";
import {
  fetchWithCache,
  invalidateCache,
  invalidateCacheByPrefix,
} from "./requestCache";
import type { FetchWithCacheOptions } from "./requestCache";
import { invalidateDashboardOverviewCache } from "./dashboardApi";

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
const WORKSHOP_OVERVIEW_CACHE_PREFIX = "workshop:overview";

type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

export type WorkshopOverviewResponse = {
  workOrders?: Paginated<OrdenTrabajo>;
  vehicles?: Paginated<Vehiculo>;
  users?: Paginated<AppUser>;
  mechanics?: Paginated<AppUser>;
};

type WorkshopOverviewParams = {
  include?: Array<"workOrders" | "vehicles" | "users" | "mechanics">;
  workOrdersPage?: number;
  workOrdersPageSize?: number;
  vehiclesPage?: number;
  vehiclesPageSize?: number;
  usersPage?: number;
  usersPageSize?: number;
  mechanicsPageSize?: number;
};

export async function getWorkshopOverview(
  params: WorkshopOverviewParams = {},
  options: FetchWithCacheOptions = {}
): Promise<WorkshopOverviewResponse> {
  const normalizedInclude = params.include
    ? Array.from(new Set(params.include)).sort((a, b) => a.localeCompare(b))
    : undefined;

  const normalizedParams: WorkshopOverviewParams = {
    ...params,
    include: normalizedInclude,
  };

  const cacheKey = `${WORKSHOP_OVERVIEW_CACHE_PREFIX}:${JSON.stringify(
    normalizedParams
  )}`;

  return fetchWithCache(
    cacheKey,
    async () => {
      const search = new URLSearchParams();
      if (normalizedInclude && normalizedInclude.length > 0) {
        search.set("include", normalizedInclude.join(","));
      }

      const numericKeys: Array<keyof WorkshopOverviewParams> = [
        "workOrdersPage",
        "workOrdersPageSize",
        "vehiclesPage",
        "vehiclesPageSize",
        "usersPage",
        "usersPageSize",
        "mechanicsPageSize",
      ];

      for (const key of numericKeys) {
        const value = params[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          search.set(String(key), String(value));
        }
      }

      const query = search.toString();
      const url = query ? `/workshop/overview?${query}` : "/workshop/overview";
      return apiFetch(url) as Promise<WorkshopOverviewResponse>;
    },
    options
  );
}

export function invalidateWorkshopOverviewCache(): void {
  invalidateCacheByPrefix(WORKSHOP_OVERVIEW_CACHE_PREFIX);
}

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
  invalidateWorkshopOverviewCache();
  invalidateDashboardOverviewCache();
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
  invalidateWorkshopOverviewCache();
  invalidateDashboardOverviewCache();
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
  invalidateWorkshopOverviewCache();
  invalidateDashboardOverviewCache();
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
  invalidateWorkshopOverviewCache();
  invalidateDashboardOverviewCache();
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
  invalidateWorkshopOverviewCache();
  invalidateDashboardOverviewCache();
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
    area?: string | null;
    role?: string | null;
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

const isTransportAreaAssignment = (assignment: {
  isActive?: boolean | null;
  area?: string | null;
}) => {
  if (!assignment) return false;
  if (assignment.isActive === false) return false;
  return (assignment.area ?? "") === "Transporte";
};

type UsersListResponse = {
  items?: UsersApiDriverCandidate[] | null;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
} | UsersApiDriverCandidate[];

const fetchUsersPage = async (
  params: Record<string, string | number | undefined>
): Promise<UsersListResponse> => {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  const url = qs ? `/users?${qs}` : "/users";
  return apiFetch(url) as Promise<UsersListResponse>;
};

const extractUsersFromResponse = (res: UsersListResponse): UsersApiDriverCandidate[] => {
  if (Array.isArray(res)) return res as UsersApiDriverCandidate[];
  if (res && Array.isArray(res.items)) return res.items;
  return [];
};

export async function getDrivers(
  forceRefresh = false
): Promise<TallerDriver[]> {
  return fetchWithCache(
    DRIVERS_CACHE_KEY,
    async () => {
      try {
        // 1) Traer todos los usuarios con specialty=DRIVER paginando al máximo (pageSize=100)
        const driverCandidates: UsersApiDriverCandidate[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const res = await fetchUsersPage({ page, pageSize: 100, specialty: "DRIVER" });
          const pageItems = extractUsersFromResponse(res);
          driverCandidates.push(...pageItems);
          totalPages = Array.isArray(res) ? 1 : res.totalPages ?? 1;
          page += 1;
        } while (page <= totalPages);

        // 2) Fallback: incluir usuarios del área Transporte (activos) aunque no tengan specialty
        const transportCandidates: UsersApiDriverCandidate[] = [];
        let page2 = 1;
        let totalPages2 = 1;
        do {
          const res = await fetchUsersPage({ page: page2, pageSize: 100 });
          const pageItems = extractUsersFromResponse(res);
          transportCandidates.push(
            ...pageItems.filter((c) =>
              (c.roleAssignments || []).some((a) => isTransportAreaAssignment(a))
            )
          );
          totalPages2 = Array.isArray(res) ? 1 : res.totalPages ?? 1;
          page2 += 1;
        } while (page2 <= totalPages2);

        // 3) Unificar y mapear
        const all = new Map<number, UsersApiDriverCandidate>();
        for (const c of [...driverCandidates, ...transportCandidates]) {
          if (typeof c.id === "number") {
            all.set(c.id, c);
          }
        }
        const candidates = Array.from(all.values());

        return candidates
          .map((candidate) => {
            const id = candidate.id ?? null;
            const firstName = candidate.firstName ?? undefined;
            const lastName = candidate.lastName ?? undefined;
            const username = candidate.username ?? undefined;
            const email = candidate.email ?? undefined;
            const nameParts = [
              candidate.fullName,
              firstName && lastName ? `${firstName} ${lastName}` : undefined,
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
          })
          .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
      } catch (err) {
        console.warn('Fallo al paginar conductores, usando fallback simple', err);
        // Fallback simple: consulta única y filtro por specialty DRIVER
        const response = await apiFetch("/users?pageSize=100");
        const candidates = normalizeUsersResponse(response);
        return candidates
          .filter((c) => (c.roleAssignments || []).some(isDriverAssignment) || (c.roleAssignments || []).some(isTransportAreaAssignment))
          .map((candidate) => {
            const id = candidate.id ?? null;
            const firstName = candidate.firstName ?? undefined;
            const lastName = candidate.lastName ?? undefined;
            const username = candidate.username ?? undefined;
            const email = candidate.email ?? undefined;
            const nameParts = [
              candidate.fullName,
              firstName && lastName ? `${firstName} ${lastName}` : undefined,
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
      }
    },
    { force: forceRefresh }
  );
}
