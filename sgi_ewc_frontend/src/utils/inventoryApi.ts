import apiFetch from "./api";
import type {
  InventoryItem,
  StockMovement,
  InventoryFilters,
  CreateItemPayload,
  UpdateItemPayload,
  AdjustStockPayload,
} from "@features/inventory/types";

const basePath = "/inventory/items";

export async function listInventoryItems(
  filters: InventoryFilters = {}
): Promise<InventoryItem[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.estado && filters.estado !== "all") {
    params.set("estado", filters.estado);
  }

  const query = params.toString();
  return apiFetch(`${basePath}${query ? `?${query}` : ""}`);
}

export async function getInventoryItem(id: number): Promise<InventoryItem> {
  return apiFetch(`${basePath}/${id}`);
}

export async function createInventoryItem(
  payload: CreateItemPayload
): Promise<InventoryItem> {
  return apiFetch(basePath, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateInventoryItem(
  id: number,
  payload: UpdateItemPayload
): Promise<InventoryItem> {
  return apiFetch(`${basePath}/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function adjustInventoryStock(
  itemId: number,
  payload: AdjustStockPayload
): Promise<InventoryItem> {
  return apiFetch(`${basePath}/${itemId}/adjust-stock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listInventoryMovements(
  itemId: number
): Promise<StockMovement[]> {
  return apiFetch(`${basePath}/${itemId}/movements`);
}

export async function deactivateInventoryItem(
  itemId: number
): Promise<InventoryItem> {
  return apiFetch(`${basePath}/${itemId}/deactivate`, {
    method: "POST",
  });
}
