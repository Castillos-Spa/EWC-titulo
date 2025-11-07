export type ITAssetStatus = 'EN_STOCK' | 'ASIGNADO' | 'EN_REPARACION' | 'RETIRADO';
export type ITAssetCategory = 'Laptop' | 'Monitor' | 'Licencia' | 'Periférico' | 'Desktop' | 'Impresora' | 'Servidor';

export interface ITAsset {
  id: number;
  assetTag: string; // Etiqueta interna
  serialNumber?: string;
  nombre: string; // Modelo / nombre comercial
  categoria: ITAssetCategory;
  ubicacion: string; // Bodega, Escritorio, Usuario X
  estado: ITAssetStatus;
  asignadoA?: string; // usuario correo o nombre si aplica
  proveedor?: string;
  fechaCompra?: string; // ISO
  garantiaHasta?: string; // ISO
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

export type ITMovementType = 'ALTA' | 'ASIGNACION' | 'DEVOLUCION' | 'REPARACION' | 'BAJA';

export interface ITMovement {
  id: number;
  assetId: number;
  tipo: ITMovementType;
  fecha: string;
  detalle: string;
  usuario: string;
}

export interface ITFilters {
  search?: string;
  categoria?: ITAssetCategory | 'all';
  estado?: ITAssetStatus | 'all';
}

export interface CreateITAssetPayload {
  assetTag: string;
  serialNumber?: string;
  nombre: string;
  categoria: ITAssetCategory;
  ubicacion: string;
  estado?: ITAssetStatus;
  asignadoA?: string;
  proveedor?: string;
  fechaCompra?: string;
  garantiaHasta?: string;
  notas?: string;
}

export type UpdateITAssetPayload = Partial<CreateITAssetPayload>;
