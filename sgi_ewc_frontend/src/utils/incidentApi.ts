import apiFetch from "./api";
import { fetchWithCache, invalidateCacheByPrefix } from "./requestCache";
import type {
  Incident as FrontIncident,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from "../types/Incident";

// Tipos para la comunicación con el backend (ajustados al schema Prisma)
export type BackIncidentType =
  | "VEHICLE_BREAKDOWN"
  | "ACCIDENT"
  | "TRAFFIC_DELAY"
  | "WEATHER"
  | "SECURITY"
  | "OTHER";

export type BackIncidentSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type BackIncidentStatus =
  | "REPORTED"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED";

export interface BackIncident {
  id: number;
  title: string;
  description: string;
  area: string;
  type: BackIncidentType;
  severity: BackIncidentSeverity;
  status: BackIncidentStatus;
  // location can be arbitrary JSON coming from backend; prefer unknown over any
  location: unknown;
  photos: string[];
  reportedById: number;
  reportedAt: string;
  reviewedAt?: string | null;
  reviewedById?: number | null;
  updatedAt: string;
}

function mapTypeToBack(t: IncidentType): BackIncidentType {
  switch (t) {
    case "vehicle_breakdown":
      return "VEHICLE_BREAKDOWN";
    case "accident":
      return "ACCIDENT";
    case "traffic_delay":
      return "TRAFFIC_DELAY";
    case "weather":
      return "WEATHER";
    case "security":
      return "SECURITY";
    default:
      return "OTHER";
  }
}

function mapSeverityToBack(s: IncidentSeverity): BackIncidentSeverity {
  switch (s) {
    case "critical":
      return "CRITICAL";
    case "high":
      return "HIGH";
    case "low":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

function mapStatusToBack(s: IncidentStatus): BackIncidentStatus {
  switch (s) {
    case "reported":
      return "REPORTED";
    case "acknowledged":
      return "ACKNOWLEDGED";
    case "in_progress":
      return "IN_PROGRESS";
    default:
      return "RESOLVED";
  }
}

function mapBackToFront(b: BackIncident): FrontIncident {
  return {
    id: String(b.id),
    area: b.area,
    type: b.type.toString().toLowerCase() as unknown as IncidentType,
    severity: b.severity
      .toString()
      .toLowerCase() as unknown as IncidentSeverity,
    title: b.title,
    description: b.description,
    // try to map geo-like location, otherwise keep empty fallback
    location: (() => {
      const loc = b.location;
      function isGeoLocation(
        x: unknown
      ): x is { latitude: number; longitude: number; address?: string } {
        return (
          typeof x === "object" &&
          x !== null &&
          "latitude" in x &&
          "longitude" in x
        );
      }
      if (!loc) return { latitude: 0, longitude: 0 };
      if (isGeoLocation(loc)) return loc;
      return loc as Record<string, unknown>;
    })(),
    photos: b.photos || [],
    reportedBy: String(b.reportedById),
    reportedAt: b.reportedAt,
    status: b.status.toLowerCase() as unknown as IncidentStatus,
    syncStatus: "synced",
  } as FrontIncident;
}

const INCIDENTS_CACHE_KEY = "incidents:list";

const mapLocationForUpdate = (location: unknown): Record<string, unknown> => {
  const patch: Record<string, unknown> = {};
  if (!location) {
    return patch;
  }

  if (typeof location === "string") {
    patch.Direccion = location;
    return patch;
  }

  if (typeof location === "object" && location !== null) {
    const raw = location as Record<string, unknown>;
    if (typeof raw.address === "string") {
      patch.Direccion = raw.address;
    } else if (
      typeof raw.latitude === "number" &&
      typeof raw.longitude === "number"
    ) {
      patch.Direccion = `${raw.latitude},${raw.longitude}`;
    } else {
      patch.Direccion = JSON.stringify(raw);
    }

    if (typeof raw.latitude === "number") {
      patch.Latitude = raw.latitude;
    }

    if (typeof raw.longitude === "number") {
      patch.Longitude = raw.longitude;
    }
  }

  return patch;
};

const buildUpdatePayload = (
  data: Partial<FrontIncident>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  if (data.title) payload.Title = data.title;
  if (data.description) payload.Descripcion = data.description;
  if (data.status)
    payload.Status = mapStatusToBack(data.status as unknown as IncidentStatus);
  if (data.severity)
    payload.Severidad = mapSeverityToBack(
      data.severity as unknown as IncidentSeverity
    );
  if (data.type)
    payload.Tipo = mapTypeToBack(data.type as unknown as IncidentType);

  const locationPatch = mapLocationForUpdate(data.location as unknown);
  Object.assign(payload, locationPatch);

  return payload;
};

export async function fetchIncidents(
  forceRefresh = false
): Promise<FrontIncident[]> {
  return fetchWithCache(
    INCIDENTS_CACHE_KEY,
    async () => {
      const res: unknown = await apiFetch("/incident");
      if (!res) return [];
      if (Array.isArray(res))
        return (res as BackIncident[]).map(mapBackToFront);
      const obj = res as Record<string, unknown>;
      if (obj.items && Array.isArray(obj.items)) {
        return (obj.items as BackIncident[]).map(mapBackToFront);
      }
      return [];
    },
    { force: forceRefresh }
  );
}

export async function createIncident(
  data: Partial<FrontIncident>
): Promise<FrontIncident> {
  const payload: Record<string, unknown> = {
    Area: data.area,
    Descripcion: data.description,
    Fecha: data.reportedAt ?? new Date().toISOString(),
    Tipo: mapTypeToBack(data.type as unknown as IncidentType),
    Severidad: mapSeverityToBack(data.severity as unknown as IncidentSeverity),
    // Backend expects Direccion to be a string. Prefer a human address when available,
    // otherwise fall back to "lat,lon" or empty string.
    Direccion: (() => {
      const loc = data.location as unknown;
      if (!loc) return "";
      if (typeof loc === "string") return loc;
      if (typeof loc === "object" && loc !== null) {
        const l = loc as Record<string, unknown>;
        if (typeof l.address === "string" && l.address.length) return l.address;
        if (typeof l.latitude === "number" && typeof l.longitude === "number")
          return `${l.latitude},${l.longitude}`;
        return JSON.stringify(l);
      }
      return "";
    })(),
    // also include numeric latitude/longitude if available
    Latitude: ((): number | undefined => {
      const loc = data.location as unknown;
      if (
        typeof loc === "object" &&
        loc !== null &&
        typeof (loc as Record<string, unknown>).latitude === "number"
      )
        return (loc as Record<string, unknown>).latitude as number;
      return undefined;
    })(),
    Longitude: ((): number | undefined => {
      const loc = data.location as unknown;
      if (
        typeof loc === "object" &&
        loc !== null &&
        typeof (loc as Record<string, unknown>).longitude === "number"
      )
        return (loc as Record<string, unknown>).longitude as number;
      return undefined;
    })(),
  };
  const created = await apiFetch("/incident", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCacheByPrefix(INCIDENTS_CACHE_KEY);
  return mapBackToFront(created as BackIncident);
}

export async function updateIncident(
  id: string,
  data: Partial<FrontIncident>
): Promise<FrontIncident> {
  const payload = buildUpdatePayload(data);
  const updated = await apiFetch(`/incident/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  invalidateCacheByPrefix(INCIDENTS_CACHE_KEY);
  return mapBackToFront(updated as BackIncident);
}

export async function deleteIncident(id: string): Promise<void> {
  await apiFetch(`/incident/${id}`, { method: "DELETE" });
  invalidateCacheByPrefix(INCIDENTS_CACHE_KEY);
}
