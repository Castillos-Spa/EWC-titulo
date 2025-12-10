import apiFetch from "./api";
import { fetchWithCache, invalidateCacheByPrefix } from "./requestCache";
import { invalidateDashboardOverviewCache } from "./dashboardApi";
import type {
  Incident as FrontIncident,
  IncidentSeverity,
  IncidentStatus,
  IncidentType,
} from "../types/Incident";

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
  location?: unknown;
  photos: string[];
  reportedById?: number | null;
  reportedByName?: string | null;
  reportedBy?: string | null;
  reportedAt: string;
  reviewedAt?: string | null;
  reviewedById?: number | null;
  updatedAt: string;
}

export interface IncidentPhotosResponse {
  id: number;
  photos: string[];
}

function mapTypeToBack(
  value?: IncidentType | BackIncidentType | null
): BackIncidentType {
  switch (value) {
    case "VEHICLE_BREAKDOWN":
    case "vehicle_breakdown":
      return "VEHICLE_BREAKDOWN";
    case "ACCIDENT":
    case "accident":
      return "ACCIDENT";
    case "TRAFFIC_DELAY":
    case "traffic_delay":
      return "TRAFFIC_DELAY";
    case "WEATHER":
    case "weather":
      return "WEATHER";
    case "SECURITY":
    case "security":
      return "SECURITY";
    default:
      return "OTHER";
  }
}

function mapSeverityToBack(
  value?: IncidentSeverity | BackIncidentSeverity | null
): BackIncidentSeverity {
  switch (value) {
    case "CRITICAL":
    case "critical":
      return "CRITICAL";
    case "HIGH":
    case "high":
      return "HIGH";
    case "LOW":
    case "low":
      return "LOW";
    default:
      return "MEDIUM";
  }
}

function mapStatusToBack(
  value?: IncidentStatus | BackIncidentStatus | null
): BackIncidentStatus {
  switch (value) {
    case "REPORTED":
    case "reported":
      return "REPORTED";
    case "ACKNOWLEDGED":
    case "acknowledged":
      return "ACKNOWLEDGED";
    case "IN_PROGRESS":
    case "in_progress":
      return "IN_PROGRESS";
    default:
      return "RESOLVED";
  }
}

function mapBackToFront(b: BackIncident): FrontIncident {
  const toFrontType = (t: BackIncidentType): IncidentType => {
    switch (t) {
      case "VEHICLE_BREAKDOWN":
        return "vehicle_breakdown";
      case "ACCIDENT":
        return "accident";
      case "TRAFFIC_DELAY":
        return "traffic_delay";
      case "WEATHER":
        return "weather";
      case "SECURITY":
        return "security";
      default:
        return "other";
    }
  };

  const toFrontSeverity = (s: BackIncidentSeverity): IncidentSeverity => {
    switch (s) {
      case "CRITICAL":
        return "critical";
      case "HIGH":
        return "high";
      case "LOW":
        return "low";
      default:
        return "medium";
    }
  };

  const toFrontStatus = (s: BackIncidentStatus): IncidentStatus => {
    switch (s) {
      case "ACKNOWLEDGED":
        return "acknowledged";
      case "IN_PROGRESS":
        return "in_progress";
      case "RESOLVED":
        return "resolved";
      default:
        return "reported";
    }
  };

  const location = (() => {
    const loc = b.location;
    if (!loc) return {} as Record<string, unknown>;
    if (typeof loc === "object" && loc !== null) {
      return loc as Record<string, unknown>;
    }
    if (typeof loc === "string") {
      const trimmed = loc.trim();
      return trimmed.length
        ? ({ address: trimmed } as Record<string, unknown>)
        : ({} as Record<string, unknown>);
    }
    return {} as Record<string, unknown>;
  })();

  return {
    id: String(b.id),
    area: b.area,
    type: toFrontType(b.type),
    severity: toFrontSeverity(b.severity),
    title: b.title,
    description: b.description,
    location,
    photos: b.photos || [],
    reportedBy:
      typeof b.reportedByName === "string" && b.reportedByName.trim().length
        ? b.reportedByName.trim()
        : typeof b.reportedBy === "string" && b.reportedBy.trim().length
        ? b.reportedBy.trim()
        : b.reportedById != null
        ? String(b.reportedById)
        : "",
    reportedAt: b.reportedAt,
    status: toFrontStatus(b.status),
    syncStatus: "synced",
    updatedAt: b.updatedAt,
    reviewedAt: b.reviewedAt,
    reviewedById: b.reviewedById ?? undefined,
    reportedById: b.reportedById ?? undefined,
  } as FrontIncident;
}

const INCIDENTS_CACHE_KEY = "incidents:list";

const extractLocationFields = (
  location: unknown
): { address?: string; latitude?: number; longitude?: number } => {
  const result: {
    address?: string;
    latitude?: number;
    longitude?: number;
  } = {};

  if (!location) {
    return result;
  }

  if (typeof location === "string") {
    const trimmed = location.trim();
    if (trimmed.length) {
      result.address = trimmed;
    }
    return result;
  }

  if (typeof location === "object" && location !== null) {
    const raw = location as Record<string, unknown>;
    const address = raw.address ?? raw.Direccion ?? raw.direccion;
    if (typeof address === "string" && address.trim().length) {
      result.address = address.trim();
    }

    const lat = raw.latitude ?? raw.lat ?? raw.Latitude;
    const lng = raw.longitude ?? raw.lng ?? raw.Longitude;
    const toNumber = (value: unknown) => {
      if (typeof value === "number" && Number.isFinite(value)) return value;
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const latitude = toNumber(lat);
    const longitude = toNumber(lng);
    if (latitude !== null) {
      result.latitude = latitude;
    }
    if (longitude !== null) {
      result.longitude = longitude;
    }

    if (!result.address && result.latitude === 0 && result.longitude === 0) {
      delete result.latitude;
      delete result.longitude;
    }
  }

  return result;
};

const buildUpdatePayload = (
  data: Partial<FrontIncident>
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  if (typeof data.title === "string") payload.title = data.title;
  if (typeof data.description === "string")
    payload.description = data.description;
  if (typeof data.area === "string") payload.area = data.area;
  if (data.status)
    payload.status = mapStatusToBack(data.status as unknown as IncidentStatus);
  if (data.severity)
    payload.severity = mapSeverityToBack(
      data.severity as unknown as IncidentSeverity
    );
  if (data.type)
    payload.type = mapTypeToBack(data.type as unknown as IncidentType);

  const locationPatch = extractLocationFields(data.location as unknown);
  Object.assign(payload, locationPatch);

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

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
      if (Array.isArray(res)) {
        return (res as BackIncident[]).map(mapBackToFront);
      }
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
  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error("title is required");
  }
  if (typeof data.description !== "string") {
    throw new Error("description is required");
  }
  if (typeof data.area !== "string") {
    throw new Error("area is required");
  }

  const payload: Record<string, unknown> = {
    title: data.title.trim(),
    description: data.description.trim(),
    area: data.area.trim(),
    type: mapTypeToBack(data.type as unknown as IncidentType),
    severity: mapSeverityToBack(data.severity as unknown as IncidentSeverity),
    reportedAt: data.reportedAt ?? new Date().toISOString(),
  };

  const locationFields = extractLocationFields(data.location as unknown);
  Object.assign(payload, locationFields);

  const created = await apiFetch("/incident", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  invalidateCacheByPrefix(INCIDENTS_CACHE_KEY);
  invalidateDashboardOverviewCache();

  return mapBackToFront(created as BackIncident);
}

export async function uploadIncidentPhotos(
  id: string | number,
  files: File[]
): Promise<IncidentPhotosResponse> {
  if (!files.length) {
    return { id: Number(id), photos: [] };
  }

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await apiFetch(`/incident/${id}/photos`, {
    method: "POST",
    body: formData,
  });

  invalidateCacheByPrefix(INCIDENTS_CACHE_KEY);
  invalidateDashboardOverviewCache();

  return response as IncidentPhotosResponse;
}

export async function getIncidentPhotos(
  id: string | number
): Promise<string[]> {
  const response = await apiFetch(`/incident/${id}/photos`, { method: "GET" });
  if (
    response &&
    typeof response === "object" &&
    Array.isArray((response as Record<string, unknown>).photos)
  ) {
    return (response as { photos: string[] }).photos;
  }
  return [];
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
  invalidateDashboardOverviewCache();

  return mapBackToFront(updated as BackIncident);
}

export async function deleteIncident(id: string): Promise<void> {
  await apiFetch(`/incident/${id}`, { method: "DELETE" });
  invalidateCacheByPrefix(INCIDENTS_CACHE_KEY);
  invalidateDashboardOverviewCache();
}
