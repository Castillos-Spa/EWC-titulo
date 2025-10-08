import apiFetch from "./api";
import type { Aseo } from "../types/Aseo";

export async function fetchAseos(): Promise<Aseo[]> {
  const list = await apiFetch("/aseo");
  return (list || []).map((i: any) => ({
    ...i,
    id: String(i.id),
  }));
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
