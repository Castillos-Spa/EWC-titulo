export type InventoryStatus = 'ACTIVO' | 'INACTIVO';

export interface InventoryItem {
  id: number;
  sku: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  unidadMedida: string; // Ej: 'unidades', 'lts', 'kg'
  estado: InventoryStatus;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 'INGRESO' | 'EGRESO' | 'AJUSTE';

export interface StockMovement {
  id: number;
  itemId: number;
  tipo: StockMovementType;
  cantidad: number;
  motivo: string;
  usuario: string;
  fecha: string;
  saldoPosterior: number;
}

export interface InventoryFilters {
  search?: string;
  categoria?: string;
  estado?: InventoryStatus | 'all';
}

export interface CreateItemPayload {
  sku: string;
  nombre: string;
  categoria: string;
  ubicacion: string;
  stockInicial: number;
  stockMinimo: number;
  unidadMedida: string;
  descripcion?: string;
}

export type UpdateItemPayload = Partial<CreateItemPayload>;

export interface AdjustStockPayload {
  cantidad: number; // Positivo para ingreso, negativo para egreso
  motivo: string;
}
