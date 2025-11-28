/**
 * Enum para la frecuencia de las rutas de transporte, basado en `schema.prisma`.
 */
export type RouteFrequency =
  | "Diaria"
  | "Semanal"
  | "Mensual"
  | "Ocasional"
  | "Adhoc";

/**
 * Representa una Ruta de Transporte, basado en el modelo `TransportRoute` de Prisma.
 */
export interface TransportRoute {
  id: number;
  code: string;
  origin: string;
  destination: string;
  distanceKm: number;
  frequency: RouteFrequency;
  active: boolean;
  createdAt: string; // Prisma DateTime se convierte en string (ISO 8601)
  updatedAt: string;
}

export type CreateTransportRoutePayload = Omit<
  TransportRoute,
  "id" | "createdAt" | "updatedAt" | "active"
>;
