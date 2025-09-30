import type { Vehiculo } from "./Vehiculo";

/**
 * Representa una Orden de Trabajo, basado en `schema.prisma`.
 */
export type OrdenTrabajo = {
  id: number;
  tipo: string;
  estado: string; // Ej: "abierta", "cerrada"
  vehiculoId: number;
  tareas: string[];
  responsableId: number | null;
  createdAt: string; // Prisma DateTime se convierte en string (ISO 8601)
  updatedAt: string;

  // Relaciones (pueden ser opcionales dependiendo de la respuesta de la API)
  vehiculo?: Vehiculo;
  qa?: any[]; // Deberías crear un tipo para QA si es necesario
};
