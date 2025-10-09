import apiFetch from "./api";
import type { Aseo } from "../types/Aseo";

export async function fetchAseos(): Promise<Aseo[]> {
  const res = await apiFetch("/aseo");
  // backend may return either an array or a paginated object { items, total, page, pageSize }
  let list: unknown[] = [];
  if (Array.isArray(res)) {
    list = res as unknown[];
  } else if (
    res &&
    typeof res === "object" &&
    Array.isArray((res as Record<string, unknown>)["items"])
  ) {
    list = (res as Record<string, unknown>)["items"] as unknown[];
  } else if (
    res &&
    typeof res === "object" &&
    Array.isArray((res as Record<string, unknown>)["data"])
  ) {
    list = (res as Record<string, unknown>)["data"] as unknown[];
  }

  return list.map((i) => {
    const it = i as Record<string, unknown>;
    const idVal = it["id"];
    const dateVal = it["date"];
    const areaVal = it["area"];
    const respVal = it["responsibleStaff"];
    const statusVal = it["status"];
    const observationsVal = it["observations"];
    const createdAtVal = it["createdAt"];
    const updatedAtVal = it["updatedAt"];

    const aseo: Aseo = {
      id:
        typeof idVal === "string"
          ? idVal
          : typeof idVal === "number"
          ? String(idVal)
          : "",
      date:
        typeof dateVal === "string" ? dateVal : dateVal ? String(dateVal) : "",
      area:
        typeof areaVal === "string" ? areaVal : areaVal ? String(areaVal) : "",
      tasks: Array.isArray(it["tasks"])
        ? (it["tasks"] as unknown[]).map((x) =>
            typeof x === "string" ? x : String(x)
          )
        : [],
      responsibleStaff:
        typeof respVal === "string" ? respVal : respVal ? String(respVal) : "",
      timeSpent:
        typeof it["timeSpent"] === "number"
          ? (it["timeSpent"] as number)
          : Number(it["timeSpent"] ?? 0),
      issues: Array.isArray(it["issues"])
        ? (it["issues"] as unknown[]).map((x) =>
            typeof x === "string" ? x : String(x)
          )
        : [],
      status:
        typeof statusVal === "string"
          ? (statusVal as Aseo["status"])
          : "PENDING",
      observations:
        typeof observationsVal === "string" ? observationsVal : undefined,
      createdAt: typeof createdAtVal === "string" ? createdAtVal : undefined,
      updatedAt: typeof updatedAtVal === "string" ? updatedAtVal : undefined,
    };
    return aseo;
  });
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
  const created = await apiFetch("/aseo", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { ...created, id: String(created.id) } as Aseo;
}

export async function updateAseo(
  id: string,
  data: Partial<Aseo>
): Promise<Aseo> {
  const payload = { ...data };
  const updated = await apiFetch(`/aseo/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return { ...updated, id: String(updated.id) } as Aseo;
}

export async function deleteAseo(id: string): Promise<void> {
  await apiFetch(`/aseo/${id}`, { method: "DELETE" });
}
