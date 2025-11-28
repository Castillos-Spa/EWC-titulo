import apiFetch from "./api";
import type {
  ITAsset,
  ITFilters,
  ITMovement,
  CreateITAssetPayload,
  UpdateITAssetPayload,
  ITAssetStatus,
} from "@features/it-inventory/types";

const basePath = "/it-inventory/assets";

export async function listItAssets(
  filters: ITFilters = {}
): Promise<ITAsset[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoria && filters.categoria !== "all")
    params.set("categoria", filters.categoria);
  if (filters.estado && filters.estado !== "all")
    params.set("estado", filters.estado);
  const query = params.toString();
  return apiFetch(`${basePath}${query ? `?${query}` : ""}`);
}

export async function getItAsset(id: number): Promise<ITAsset> {
  return apiFetch(`${basePath}/${id}`);
}

export async function createItAsset(
  payload: CreateITAssetPayload
): Promise<ITAsset> {
  return apiFetch(basePath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateItAsset(
  id: number,
  payload: UpdateITAssetPayload
): Promise<ITAsset> {
  return apiFetch(`${basePath}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function changeItAssetStatus(
  id: number,
  estado: ITAssetStatus,
  detalle?: string
): Promise<ITAsset> {
  return apiFetch(`${basePath}/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ estado, detalle }),
  });
}

export async function assignItAsset(
  id: number,
  usuario: string,
  detalle?: string
): Promise<ITAsset> {
  return apiFetch(`${basePath}/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ usuario, detalle }),
  });
}

export async function unassignItAsset(
  id: number,
  detalle?: string
): Promise<ITAsset> {
  return apiFetch(`${basePath}/${id}/unassign`, {
    method: "POST",
    body: JSON.stringify({ detalle }),
  });
}

export async function listItMovements(assetId: number): Promise<ITMovement[]> {
  return apiFetch(`${basePath}/${assetId}/movements`);
}
