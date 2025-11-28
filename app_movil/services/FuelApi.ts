import { ApiClient } from './ApiClient';
import type { VehiculoDto } from './VehiculoApi';

export interface FuelDriverDto {
  id: number;
  username: string;
}

export interface FuelLogDto {
  id: number;
  date: string;
  liters: number;
  odometer: number;
  cost?: number | null;
  invoiceUrl?: string | null;
  driver?: FuelDriverDto | null;
  createdAt: string;
}

export type VehicleFuelSummary = VehiculoDto & {
  fuelLogs?: FuelLogDto[] | null;
};

export interface CreateFuelLogPayload {
  vehiculoId: number;
  date: string;
  liters: number;
  odometer: number;
  cost?: number;
  invoiceUrl?: string;
}

interface SummaryEnvelope {
  items?: VehicleFuelSummary[] | null;
  data?: VehicleFuelSummary[] | null;
  results?: VehicleFuelSummary[] | null;
}

function normalizeSummary(response: VehicleFuelSummary[] | SummaryEnvelope): VehicleFuelSummary[] {
  if (Array.isArray(response)) return response;
  if (response && typeof response === 'object') {
    const candidates = [response.items, response.data, response.results];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }
  }
  return [];
}

class FuelApiClass {
  async getFleetSummary(): Promise<VehicleFuelSummary[]> {
    const response = await ApiClient.get<VehicleFuelSummary[] | SummaryEnvelope>(`/fuel/summary`, true);
    return normalizeSummary(response ?? []);
  }

  async getVehicleHistory(vehiculoId: number): Promise<VehicleFuelSummary> {
    return ApiClient.get<VehicleFuelSummary>(`/fuel/history/${vehiculoId}`, true);
  }

  async createFuelLog(payload: CreateFuelLogPayload): Promise<FuelLogDto> {
    return ApiClient.post<FuelLogDto>(`/fuel/log`, payload, true);
  }
}

export const FuelApi = new FuelApiClass();
