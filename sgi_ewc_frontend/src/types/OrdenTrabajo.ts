import type { Vehiculo } from "./Vehiculo";

/**
 * Representa una Orden de Trabajo, basado en `schema.prisma`.
 */
export type OrdenTrabajo = {
  id: number;
  tipo: string;
  estado: "abierta" | "en_progreso" | "pendiente_revision" | "completado";
  vehiculoId: number;
  description?: string;
  scheduledDate?: string; // ISO Date String
  estimatedCost?: number;
  observations?: string;
  responsableId: number | null;
  repuestos: string[];
  tareas: string[];
  createdAt: string; // Prisma DateTime se convierte en string (ISO 8601)
  updatedAt: string;

  // Relaciones (pueden ser opcionales dependiendo de la respuesta de la API)
  vehiculo?: Vehiculo;
  qa?: any[]; // Deberías crear un tipo para QA si es necesario
};
