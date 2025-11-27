import { ApiClient } from './ApiClient';

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
  list(): Promise<OrdenTrabajoDto[]> {
    return ApiClient.get<OrdenTrabajoDto[]>(`/orden-trabajo`, true);
  }

  get(id: number): Promise<OrdenTrabajoDto> {
    return ApiClient.get<OrdenTrabajoDto>(`/orden-trabajo/${id}`, true);
  }

  create(payload: CreateOrdenTrabajoPayload): Promise<OrdenTrabajoDto> {
    return ApiClient.post<OrdenTrabajoDto>(`/orden-trabajo`, payload, true);
  }

  update(id: number, patch: Partial<Pick<OrdenTrabajoDto, 'estado' | 'responsableId' | 'tareas'>>): Promise<OrdenTrabajoDto> {
    return ApiClient.patch<OrdenTrabajoDto>(`/orden-trabajo/${id}`, patch, true);
  }

  planificarTareas(id: number, tareas: string[]): Promise<OrdenTrabajoDto> {
    return ApiClient.post<OrdenTrabajoDto>(`/orden-trabajo/${id}/tareas`, { tareas }, true);
  }

  asignarResponsable(id: number, responsableId: number): Promise<OrdenTrabajoDto> {
    return ApiClient.post<OrdenTrabajoDto>(`/orden-trabajo/${id}/responsable`, { responsableId }, true);
  }

  cerrar(id: number, checklist: string, resultado: string): Promise<any> {
    return ApiClient.post<any>(`/orden-trabajo/${id}/cerrar`, { checklist, resultado }, true);
  }

  remove(id: number): Promise<void> {
    return ApiClient.delete<void>(`/orden-trabajo/${id}`, true);
  }
}

export const OrdenTrabajoApi = new OrdenTrabajoApiClass();
