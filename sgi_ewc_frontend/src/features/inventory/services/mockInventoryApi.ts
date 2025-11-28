import type { InventoryItem, StockMovement, InventoryFilters, CreateItemPayload, UpdateItemPayload, AdjustStockPayload } from '../types';

// In-memory state (simulado)
const items: InventoryItem[] = [];
const movements: StockMovement[] = [];
let itemSeq = 1;
let movementSeq = 1;

// Semilla inicial
for (const seed of [
  { sku: 'ACE-10W40', nombre: 'Aceite Motor 10W40', categoria: 'Lubricantes', ubicacion: 'Bodega A1', stockInicial: 38, stockMinimo: 10, unidadMedida: 'lts', descripcion: 'Lubricante semi-sintético.' },
  { sku: 'FILT-AIR-TRK', nombre: 'Filtro de Aire Camión', categoria: 'Filtros', ubicacion: 'Estantería F2', stockInicial: 12, stockMinimo: 5, unidadMedida: 'unidades' },
  { sku: 'MAN-CHASIS-01', nombre: 'Manilla Chasis Genérica', categoria: 'Repuestos', ubicacion: 'Estantería R1', stockInicial: 55, stockMinimo: 15, unidadMedida: 'unidades' },
  { sku: 'GRASA-LITIO', nombre: 'Grasa de Litio Alta Temp', categoria: 'Lubricantes', ubicacion: 'Bodega A2', stockInicial: 18, stockMinimo: 6, unidadMedida: 'kg' },
]) {
  createItemInternal(seed);
}

function nowISO() { return new Date().toISOString(); }

function simulateLatency<T>(value: T, ms = 300): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

function createItemInternal(payload: CreateItemPayload): InventoryItem {
  const newItem: InventoryItem = {
    id: itemSeq++,
    sku: payload.sku,
    nombre: payload.nombre,
    categoria: payload.categoria,
    ubicacion: payload.ubicacion,
    stockActual: payload.stockInicial,
    stockMinimo: payload.stockMinimo,
    unidadMedida: payload.unidadMedida,
    descripcion: payload.descripcion,
    estado: 'ACTIVO',
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };
  items.push(newItem);
  movements.push({
    id: movementSeq++,
    itemId: newItem.id,
    tipo: 'INGRESO',
    cantidad: newItem.stockActual,
    motivo: 'Stock inicial',
    usuario: 'system',
    fecha: nowISO(),
    saldoPosterior: newItem.stockActual,
  });
  return newItem;
}

export async function listItems(filters: InventoryFilters = {}): Promise<InventoryItem[]> {
  const { search, categoria, estado } = filters;
  const query = (search ?? '').toLowerCase();
  let data = items.slice();
  if (query) {
    data = data.filter(i => [i.nombre, i.sku, i.categoria, i.ubicacion].some(f => f.toLowerCase().includes(query)));
  }
  if (categoria) data = data.filter(i => i.categoria === categoria);
  if (estado && estado !== 'all') data = data.filter(i => i.estado === estado);
  return simulateLatency(data);
}

export async function getItem(id: number): Promise<InventoryItem | null> {
  return simulateLatency(items.find(i => i.id === id) || null);
}

export async function createItem(payload: CreateItemPayload): Promise<InventoryItem> {
  const created = createItemInternal(payload);
  return simulateLatency(created);
}

export async function updateItem(id: number, payload: UpdateItemPayload): Promise<InventoryItem | null> {
  const item = items.find(i => i.id === id);
  if (!item) return simulateLatency(null);
  Object.assign(item, {
    sku: payload.sku ?? item.sku,
    nombre: payload.nombre ?? item.nombre,
    categoria: payload.categoria ?? item.categoria,
    ubicacion: payload.ubicacion ?? item.ubicacion,
    stockMinimo: payload.stockMinimo ?? item.stockMinimo,
    unidadMedida: payload.unidadMedida ?? item.unidadMedida,
    descripcion: payload.descripcion ?? item.descripcion,
    updatedAt: nowISO(),
  });
  return simulateLatency(item);
}

export async function adjustStock(id: number, payload: AdjustStockPayload): Promise<InventoryItem | null> {
  const item = items.find(i => i.id === id);
  if (!item) return simulateLatency(null);
  const nuevaCantidad = item.stockActual + payload.cantidad;
  item.stockActual = Math.max(nuevaCantidad, 0);
  item.updatedAt = nowISO();
  movements.push({
    id: movementSeq++,
    itemId: item.id,
    tipo: payload.cantidad >= 0 ? 'INGRESO' : 'EGRESO',
    cantidad: Math.abs(payload.cantidad),
    motivo: payload.motivo,
    usuario: 'mockUser',
    fecha: nowISO(),
    saldoPosterior: item.stockActual,
  });
  return simulateLatency(item);
}

export async function listMovements(itemId: number): Promise<StockMovement[]> {
  return simulateLatency(movements.filter(m => m.itemId === itemId).sort((a,b) => b.id - a.id));
}

export async function deactivateItem(id: number): Promise<InventoryItem | null> {
  const item = items.find(i => i.id === id);
  if (!item) return simulateLatency(null);
  item.estado = 'INACTIVO';
  item.updatedAt = nowISO();
  return simulateLatency(item);
}
