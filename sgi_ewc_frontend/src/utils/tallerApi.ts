import type { OrdenTrabajo } from "../types/OrdenTrabajo";
import type { Vehiculo } from "../types/Vehiculo";
import apiFetch from "./api";

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
  return apiFetch("/taller/orden-trabajo");
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
  const url = `/taller/vehiculos?${params.toString()}`;
  const response = await apiFetch(url);
  // El backend devuelve un objeto paginado { items: [], total: 0 }.
  // Nos aseguramos de devolver solo el array de vehículos.
  if (response && Array.isArray(response.items)) {
    return response.items as Vehiculo[];
  }
  return []; // Devolvemos un array vacío si la respuesta no es la esperada.
}

/**
 * Obtiene un vehículo específico por su patente desde el módulo de taller.
 * Asume un endpoint GET /taller/vehiculos/:patente
 */
export async function getVehiculoFromTaller(
  patente: string
): Promise<Vehiculo> {
  return apiFetch(`/taller/vehiculos/${patente}`);
}

/**
 * Crea un nuevo vehículo desde el módulo de taller.
 * Asume un endpoint POST /taller/vehiculos
 */
export async function createVehiculoFromTaller(
  payload: CreateVehiculoPayload
): Promise<Vehiculo> {
  return apiFetch("/taller/vehiculos", {
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
  return apiFetch(`/taller/vehiculos/${id}`, {
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

export async function getDrivers(): Promise<TallerDriver[]> {
  // Usamos el endpoint de usuarios con el filtro de especialidad
  const response = await apiFetch("/users?specialty=DRIVER");
  // El backend devuelve un objeto paginado { items: [], ... }
  if (response && Array.isArray(response.items)) {
    return response.items;
  }
  return [];
}
