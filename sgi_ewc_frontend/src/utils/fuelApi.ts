import type { Vehiculo } from "../types/Vehiculo";
import apiFetch from "./api";
import { fetchWithCache, invalidateCache } from "./requestCache";

type FleetFuelSummaryApiResponse =
  | VehicleWithFuelHistory[]
  | {
      items?: VehicleWithFuelHistory[] | null;
      data?: VehicleWithFuelHistory[] | null;
      results?: VehicleWithFuelHistory[] | null;
    };

function normalizeFleetFuelSummary(
  response: FleetFuelSummaryApiResponse | null | undefined
): VehicleWithFuelHistory[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === "object") {
    const candidates = [response.items, response.data, response.results];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }
  }
  return [];
}

export interface DateRange {
  from?: string;
  to?: string;
}

/**
 * Representa un registro de carga de combustible, basado en el modelo `FuelLog` de Prisma.
 */
export type FuelLog = {
  id: number;
  date: string;
  liters: number;
  cost?: number | null;
  odometer: number;
  driver: {
    id: number;
    username: string;
  };
  invoiceUrl?: string | null;
  createdAt: string;
};

/**
 * Representa un vehículo con su historial de combustible incluido.
 */
export type VehicleWithFuelHistory = Vehiculo & {
  fuelLogs: FuelLog[];
};

/**
 * Payload para crear un nuevo registro de combustible.
 */
export type CreateFuelLogPayload = {
  vehiculoId: number;
  date: string;
  liters: number;
  cost?: number;
  odometer: number;
  invoiceUrl?: string;
};

const FUEL_SUMMARY_CACHE_KEY = "fuel:summary";
const FUEL_HISTORY_PREFIX = "fuel:history";

/**
 * Crea un nuevo registro de carga de combustible.
 * @param payload - Los datos para el nuevo registro.
 */
export async function createFuelLog(
  payload: CreateFuelLogPayload
): Promise<FuelLog> {
  const created = await apiFetch("/fuel/log", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCache([
    FUEL_SUMMARY_CACHE_KEY,
    `${FUEL_HISTORY_PREFIX}:${payload.vehiculoId}`,
  ]);
  return created;
}

/**
 * Obtiene el resumen de combustible de la flota (o del vehículo del conductor).
 * La API se encarga de filtrar según el rol del usuario.
 * @param from - Fecha de inicio (actualmente no implementado en el backend)
 * @param to - Fecha de fin (actualmente no implementado en el backend)
 */
export async function getFleetFuelSummary(
  forceRefresh = false
): Promise<VehicleWithFuelHistory[]> {
  return fetchWithCache(
    FUEL_SUMMARY_CACHE_KEY,
    async () => {
      const response = (await apiFetch(
        "/fuel/summary"
      )) as FleetFuelSummaryApiResponse;
      return normalizeFleetFuelSummary(response);
    },
    { force: forceRefresh, ttlMs: 60_000 }
  );
}

/**
 * Obtiene el historial de combustible de un vehículo específico.
 */
export async function getVehicleFuelHistory(
  vehiculoId: number,
  forceRefresh = false
): Promise<VehicleWithFuelHistory> {
  const cacheKey = `${FUEL_HISTORY_PREFIX}:${vehiculoId}`;
  return fetchWithCache(
    cacheKey,
    () =>
      apiFetch(
        `/fuel/history/${vehiculoId}`
      ) as Promise<VehicleWithFuelHistory>,
    { force: forceRefresh, ttlMs: 60_000 }
  );
}
