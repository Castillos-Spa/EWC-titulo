import Constants from 'expo-constants';
import { SafeStorage } from './SafeStorage';
import { useAuthStore } from '../stores/authStore';

export type VehiculoEstado = 'disponible' | 'en_mantenimiento' | 'inactivo' | 'en_uso';

export interface VehiculoDto {
  id: number;
  patente: string;
  capacidad: number; // Prisma: Float
  odometro: number;
  estado: VehiculoEstado;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehiculoPayload {
  patente: string;
  capacidad: number;
  odometro: number;
  estado: VehiculoEstado;
}

export interface RegistrarDocumentoPayload {
  tipo: string;
  url: string;
  descripcion?: string;
}

class VehiculoApiClass {
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    let base = envUrl || extraUrl || 'http://localhost:3000';
    try {
      const url = new URL(base);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = '10.0.2.2';
      }
      base = url.origin;
    } catch {
      base = base.replace(/\/+$/, '');
    }
    return base;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await SafeStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async request<T>(path: string, init: RequestInit, retry = true): Promise<T> {
    const base = this.getBaseUrl();
    let headers = await this.authHeaders();
    const res = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
    if (res.status === 401 && retry) {
      // Intentar refrescar y reintentar una vez
      try {
        const auth = useAuthStore.getState();
        await auth.refreshAuth();
        headers = await this.authHeaders();
        const res2 = await fetch(`${base}${path}`, { ...init, headers: { ...headers, ...(init.headers || {}) } });
        const text2 = await res2.text();
        const data2 = text2 ? JSON.parse(text2) : null;
        if (!res2.ok) throw new Error(data2?.message || 'Error de servidor');
        return data2 as T;
      } catch (e: any) {
        // Si falla, cerrar sesión para forzar login limpio
        console.warn('Token refresh failed during vehiculo request:', e?.message || e);
        try { await useAuthStore.getState().logout(); } catch {}
        throw new Error('No autorizado. Inicia sesión nuevamente.');
      }
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || res.statusText || 'Error de servidor');
    return data as T;
  }

  async getVehiculos(): Promise<VehiculoDto[]> {
    return this.request<VehiculoDto[]>(`/vehiculo`, { method: 'GET' });
  }

  async createVehiculo(payload: CreateVehiculoPayload): Promise<VehiculoDto> {
    return this.request<VehiculoDto>(`/vehiculo`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateVehiculo(id: number, patch: Partial<CreateVehiculoPayload>): Promise<VehiculoDto> {
    return this.request<VehiculoDto>(`/vehiculo/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }

  async deleteVehiculo(id: number): Promise<void> {
    await this.request<void>(`/vehiculo/${id}`, { method: 'DELETE' });
  }

  async registrarDocumento(id: number, payload: RegistrarDocumentoPayload): Promise<void> {
    await this.request<void>(`/vehiculo/${id}/documentos`, { method: 'POST', body: JSON.stringify(payload) });
  }
}

export const VehiculoApi = new VehiculoApiClass();
