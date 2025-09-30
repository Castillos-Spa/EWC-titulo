import Constants from 'expo-constants';
import { SafeStorage } from './SafeStorage';

export interface OrdenTrabajoDto {
  id: number;
  tipo: string; // Preventivo/Correctivo/etc (string libre en backend)
  estado: string; // 'abierta' | 'Cerrada' | otros
  vehiculoId: number;
  tareas: string[];
  responsableId?: number | null;
  createdAt: string;
  updatedAt: string;
  vehiculo?: any;
  qa?: any[];
}

export interface CreateOrdenTrabajoPayload {
  vehiculoId: number;
  tipo: string;
}

class OrdenTrabajoApiClass {
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    let base = envUrl || extraUrl || 'http://localhost:3000';
    try {
      const url = new URL(base);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') url.hostname = '10.0.2.2';
      base = url.origin;
    } catch {
      base = base.replace(/\/+$/, '');
    }
    return base;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await SafeStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}${path}`, { ...(init || {}), headers: { ...(await this.headers()), ...(init.headers || {}) } });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || res.statusText || 'Error de servidor');
    return data as T;
  }

  list(): Promise<OrdenTrabajoDto[]> {
    return this.request<OrdenTrabajoDto[]>(`/orden-trabajo`, { method: 'GET' });
  }

  get(id: number): Promise<OrdenTrabajoDto> {
    return this.request<OrdenTrabajoDto>(`/orden-trabajo/${id}`, { method: 'GET' });
  }

  create(payload: CreateOrdenTrabajoPayload): Promise<OrdenTrabajoDto> {
    return this.request<OrdenTrabajoDto>(`/orden-trabajo`, { method: 'POST', body: JSON.stringify(payload) });
  }

  update(id: number, patch: Partial<Pick<OrdenTrabajoDto, 'estado' | 'responsableId' | 'tareas'>>): Promise<OrdenTrabajoDto> {
    return this.request<OrdenTrabajoDto>(`/orden-trabajo/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }

  planificarTareas(id: number, tareas: string[]): Promise<OrdenTrabajoDto> {
    return this.request<OrdenTrabajoDto>(`/orden-trabajo/${id}/tareas`, { method: 'POST', body: JSON.stringify({ tareas }) });
  }

  asignarResponsable(id: number, responsableId: number): Promise<OrdenTrabajoDto> {
    return this.request<OrdenTrabajoDto>(`/orden-trabajo/${id}/responsable`, { method: 'POST', body: JSON.stringify({ responsableId }) });
  }

  cerrar(id: number, checklist: string, resultado: string): Promise<any> {
    return this.request<any>(`/orden-trabajo/${id}/cerrar`, { method: 'POST', body: JSON.stringify({ checklist, resultado }) });
  }

  remove(id: number): Promise<void> {
    return this.request<void>(`/orden-trabajo/${id}`, { method: 'DELETE' });
  }
}

export const OrdenTrabajoApi = new OrdenTrabajoApiClass();
