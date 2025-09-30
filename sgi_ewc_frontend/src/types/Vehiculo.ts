/**
 * Enum para los estados de un vehículo, basado en `schema.prisma`.
 */
export type VehiculoStatus =
  | "disponible"
  | "en_mantenimiento"
  | "inactivo"
  | "en_uso";

export type Vehiculo = {
  id: number;
  patente: string;
  capacidad: number; // Prisma Float se convierte en number
  odometro: number;
  marca: string;
  modelo: string;
  estado: VehiculoStatus;
  createdAt: string; // Prisma DateTime se convierte en string (ISO 8601)
  updatedAt: string;
  areaAsignada: string | null;
  conductorId: number | null;
  lastMaintenanceDate: Date | null;

  // Las relaciones como 'documentos' y 'ordenes' se omiten por defecto,
  // a menos que la API las incluya explícitamente.
};
