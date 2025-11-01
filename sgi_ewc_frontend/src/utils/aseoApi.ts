import apiFetch from "./api";
import type { Aseo } from "../types/Aseo";
import { fetchWithCache, invalidateCache } from "./requestCache";

function normalizeListResponse(res: unknown): unknown[] {
  if (Array.isArray(res)) return res as unknown[];
  if (res && typeof res === "object") {
    const obj = res as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as unknown[];
    if (Array.isArray(obj.data)) return obj.data as unknown[];
  }
  return [];
}

function toIdString(v: unknown): string {
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function toSafeString(v: unknown): string {
  if (typeof v === "string") return v;
  // Explicitly handle booleans/null/undefined differently to avoid duplication with toIdString
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v === null || v === undefined) return "";
  // Avoid stringifying objects/arrays to "[object Object]"
  if (typeof v === "object") return "";
  return "";
}

function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return (v as unknown[]).map((x) => (typeof x === "string" ? x : String(x)));
}

const ASEO_CACHE_KEY = "aseo:list";

export async function fetchAseos(forceRefresh = false): Promise<Aseo[]> {
  return fetchWithCache(
    ASEO_CACHE_KEY,
    async () => {
      const res = await apiFetch("/cleaning");
      const list = normalizeListResponse(res);
      return list.map((raw) => {
        const it = raw as Record<string, unknown>;
        const id = toIdString(it.id);
        const date = toSafeString(it.date);
        const area = toSafeString(it.area);
        const responsibleStaff = toSafeString(it.responsibleStaff);
        const timeSpent = Number(it.timeSpent ?? 0);
        const tasks = toStringArray(it.tasks);
        const issues = toStringArray(it.issues);
        const status =
          typeof it.status === "string"
            ? (it.status as Aseo["status"])
            : "PENDING";
        const observations =
          typeof it.observations === "string" ? it.observations : undefined;
        const createdAt =
          typeof it.createdAt === "string" ? it.createdAt : undefined;
        const updatedAt =
          typeof it.updatedAt === "string" ? it.updatedAt : undefined;

        return {
          id,
          date,
          area,
          tasks,
          responsibleStaff,
          timeSpent,
          issues,
          status,
          observations,
          createdAt,
          updatedAt,
        } as Aseo;
      });
    },
    { force: forceRefresh }
  );
}

export async function createAseo(a: Partial<Aseo>): Promise<Aseo> {
  const payload = {
    date: a.date ?? new Date().toISOString(),
    area: a.area,
    tasks: a.tasks ?? [],
    responsibleStaff: a.responsibleStaff,
    timeSpent: a.timeSpent,
    issues: a.issues ?? [],
    status: a.status,
    observations: a.observations ?? null,
  };
  const created = await apiFetch("/cleaning", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  invalidateCache(ASEO_CACHE_KEY);
  return { ...created, id: String(created.id) } as Aseo;
}

export async function updateAseo(
  id: string,
  data: Partial<Aseo>
): Promise<Aseo> {
  const payload = { ...data };
  const updated = await apiFetch(`/cleaning/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  invalidateCache(ASEO_CACHE_KEY);
  return { ...updated, id: String(updated.id) } as Aseo;
}

export async function deleteAseo(id: string): Promise<void> {
  await apiFetch(`/cleaning/${id}`, { method: "DELETE" });
  invalidateCache(ASEO_CACHE_KEY);
}
