import type { ITAsset, ITFilters, ITMovement, CreateITAssetPayload, UpdateITAssetPayload, ITAssetStatus } from '../types';

const assets: ITAsset[] = [];
const movements: ITMovement[] = [];
let assetSeq = 1;
let movementSeq = 1;

function nowISO() { return new Date().toISOString(); }
function delay<T>(v: T, ms = 300) { return new Promise<T>(r => setTimeout(() => r(v), ms)); }

function seed(payload: CreateITAssetPayload) {
  const created: ITAsset = {
    id: assetSeq++,
    assetTag: payload.assetTag,
    serialNumber: payload.serialNumber,
    nombre: payload.nombre,
    categoria: payload.categoria,
    ubicacion: payload.ubicacion,
    estado: payload.estado ?? 'EN_STOCK',
    asignadoA: payload.asignadoA,
    proveedor: payload.proveedor,
    fechaCompra: payload.fechaCompra,
    garantiaHasta: payload.garantiaHasta,
    notas: payload.notas,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  assets.push(created);
  movements.push({ id: movementSeq++, assetId: created.id, tipo: 'ALTA', fecha: nowISO(), detalle: 'Alta inicial', usuario: 'system' });
}

// Semilla
seed({ assetTag: 'IT-NTB-0001', serialNumber: 'SN123NTB', nombre: 'Dell Latitude 7420', categoria: 'Laptop', ubicacion: 'Bodega IT', proveedor: 'DELL', fechaCompra: '2024-01-10T00:00:00Z', garantiaHasta: '2027-01-10T00:00:00Z' });
seed({ assetTag: 'IT-MON-0001', serialNumber: 'SNM123', nombre: 'Samsung 24"', categoria: 'Monitor', ubicacion: 'Bodega IT', proveedor: 'Samsung' });
seed({ assetTag: 'IT-LIC-0001', nombre: 'Licencia Microsoft 365 Business', categoria: 'Licencia', ubicacion: 'N/A', proveedor: 'Microsoft' });
seed({ assetTag: 'IT-PRF-0001', nombre: 'Mouse Logitech M185', categoria: 'Periférico', ubicacion: 'Bodega IT' });

export async function listAssets(filters: ITFilters = {}): Promise<ITAsset[]> {
  const q = (filters.search ?? '').toLowerCase();
  let data = assets.slice();
  if (q) data = data.filter(a => [a.assetTag, a.serialNumber ?? '', a.nombre, a.ubicacion, a.asignadoA ?? ''].some(f => f.toLowerCase().includes(q)));
  if (filters.categoria && filters.categoria !== 'all') data = data.filter(a => a.categoria === filters.categoria);
  if (filters.estado && filters.estado !== 'all') data = data.filter(a => a.estado === filters.estado);
  return delay(data);
}

export async function getAsset(id: number) { return delay(assets.find(a => a.id === id) ?? null); }

export async function createAsset(payload: CreateITAssetPayload): Promise<ITAsset> {
  const created: ITAsset = {
    id: assetSeq++,
    assetTag: payload.assetTag,
    serialNumber: payload.serialNumber,
    nombre: payload.nombre,
    categoria: payload.categoria,
    ubicacion: payload.ubicacion,
    estado: payload.estado ?? 'EN_STOCK',
    asignadoA: payload.asignadoA,
    proveedor: payload.proveedor,
    fechaCompra: payload.fechaCompra,
    garantiaHasta: payload.garantiaHasta,
    notas: payload.notas,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  assets.push(created);
  movements.push({ id: movementSeq++, assetId: created.id, tipo: 'ALTA', fecha: nowISO(), detalle: 'Alta de activo', usuario: 'mockUser' });
  return delay(created);
}

export async function updateAsset(id: number, payload: UpdateITAssetPayload) {
  const found = assets.find(a => a.id === id);
  if (!found) return delay(null);
  Object.assign(found, payload, { updatedAt: nowISO() });
  return delay(found);
}

export async function changeStatus(id: number, estado: ITAssetStatus, detalle = '') {
  const found = assets.find(a => a.id === id);
  if (!found) return delay(null);
  found.estado = estado;
  found.updatedAt = nowISO();
  let tipo: ITMovement['tipo'];
  if (estado === 'ASIGNADO') tipo = 'ASIGNACION';
  else if (estado === 'EN_REPARACION') tipo = 'REPARACION';
  else if (estado === 'RETIRADO') tipo = 'BAJA';
  else tipo = 'DEVOLUCION';
  movements.push({ id: movementSeq++, assetId: found.id, tipo, fecha: nowISO(), detalle, usuario: 'mockUser' });
  return delay(found);
}

export async function listMovements(assetId: number) { return delay(movements.filter(m => m.assetId === assetId).sort((a,b) => b.id - a.id)); }
