import { ApiClient } from './ApiClient';

export type VehiculoEstado = 'disponible' | 'en_mantenimiento' | 'inactivo' | 'en_uso';

export interface VehiculoDto {
  id: number;
  patente: string;
  capacidad: number; // Prisma: Float
  odometro: number;
  estado: VehiculoEstado;
  createdAt: string;
  updatedAt: string;
  // Campos extendidos para alineación con frontend Taller
  marca?: string;
  modelo?: string;
  areaAsignada?: string | null;
  conductorId?: number | null;
  lastMaintenanceDate?: string | null;
}

export interface CreateVehiculoPayload {
  patente: string;
  capacidad: number;
  odometro: number;
  estado: VehiculoEstado;
  // Campos adicionales (opcionales en móvil, requeridos por DTO del backend)
  marca?: string;
  modelo?: string;
  areaAsignada?: string;
  conductorId?: number;
  lastMaintenanceDate?: string; // ISO string
}

export interface RegistrarDocumentoPayload {
  tipo: string;
  url: string;
  descripcion?: string;
}

class VehiculoApiClass {
  async getVehiculos(): Promise<VehiculoDto[]> {
    return ApiClient.get<VehiculoDto[]>(`/taller/vehiculos`, true);
  }

  async createVehiculo(payload: CreateVehiculoPayload): Promise<VehiculoDto> {
    return ApiClient.post<VehiculoDto>(`/taller/vehiculos`, payload, true);
  }

  async updateVehiculo(id: number, patch: Partial<CreateVehiculoPayload>): Promise<VehiculoDto> {
    return ApiClient.patch<VehiculoDto>(`/taller/vehiculos/${id}`, patch, true);
  }

  async deleteVehiculo(id: number): Promise<void> {
    await ApiClient.delete<void>(`/vehiculo/${id}`, true);
  }

  async registrarDocumento(id: number, payload: RegistrarDocumentoPayload): Promise<void> {
    await ApiClient.post<void>(`/vehiculo/${id}/documentos`, payload, true);
  }
}

export const VehiculoApi = new VehiculoApiClass();
