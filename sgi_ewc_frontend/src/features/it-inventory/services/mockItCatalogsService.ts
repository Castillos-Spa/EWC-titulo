import type { ITVendor, ITLocation, ITLocationType, ITBrand, ITModel, ITAssetCategory } from '../types';

function simulateLatency(min = 200, max = 500) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

let seq = 1;
const nextId = (prefix: string) => `${prefix}_${seq++}`;

const vendors: ITVendor[] = [
  { id: nextId('ven'), nombre: 'TechSupplier', contacto: 'Laura Pérez', telefono: '+56 2 555 1234', email: 'ventas@techsupplier.com', activo: true },
  { id: nextId('ven'), nombre: 'GlobalSoft', contacto: 'Carlos Díaz', telefono: '+56 2 555 5678', email: 'cdiaz@globalsoft.com', activo: true },
];

const locations: ITLocation[] = [
  { id: nextId('loc'), nombre: 'Oficina Central', tipo: 'OFICINA', direccion: 'Av. Providencia 1234, Santiago', activo: true },
  { id: nextId('loc'), nombre: 'Bodega 1', tipo: 'BODEGA', direccion: 'Camino Industrial 456, Quilicura', activo: true },
  { id: nextId('loc'), nombre: 'Remoto', tipo: 'REMOTO', activo: true },
];

const brands: ITBrand[] = [
  { id: nextId('brand'), nombre: 'Dell', activo: true },
  { id: nextId('brand'), nombre: 'Lenovo', activo: true },
  { id: nextId('brand'), nombre: 'Apple', activo: true },
];

const models: ITModel[] = [
  { id: nextId('model'), nombre: 'Latitude 5440', marcaId: brands[0].id, categoria: 'Laptop', activo: true },
  { id: nextId('model'), nombre: 'ThinkPad T14', marcaId: brands[1].id, categoria: 'Laptop', activo: true },
  { id: nextId('model'), nombre: 'MacBook Air M2', marcaId: brands[2].id, categoria: 'Laptop', activo: true },
];

type CreateVendorPayload = Omit<ITVendor, 'id' | 'activo'> & { activo?: boolean };
type CreateLocationPayload = Omit<ITLocation, 'id' | 'activo'> & { activo?: boolean };
type CreateBrandPayload = Omit<ITBrand, 'id' | 'activo'> & { activo?: boolean };
type CreateModelPayload = Omit<ITModel, 'id' | 'activo'> & { activo?: boolean };

export async function listVendors() {
  await simulateLatency();
  return vendors.slice();
}

export async function createVendor(payload: CreateVendorPayload) {
  await simulateLatency();
  const vendor: ITVendor = { id: nextId('ven'), activo: payload.activo ?? true, ...payload };
  vendors.push(vendor);
  return vendor;
}

export async function toggleVendorActive(id: string) {
  await simulateLatency();
  const vendor = vendors.find(v => v.id === id);
  if (!vendor) throw new Error('Proveedor no encontrado');
  vendor.activo = !vendor.activo;
  return vendor;
}

export async function listLocations() {
  await simulateLatency();
  return locations.slice();
}

export async function createLocation(payload: CreateLocationPayload) {
  await simulateLatency();
  const location: ITLocation = { id: nextId('loc'), activo: payload.activo ?? true, ...payload };
  locations.push(location);
  return location;
}

export async function toggleLocationActive(id: string) {
  await simulateLatency();
  const loc = locations.find(l => l.id === id);
  if (!loc) throw new Error('Ubicación no encontrada');
  loc.activo = !loc.activo;
  return loc;
}

export async function listBrands() {
  await simulateLatency();
  return brands.slice();
}

export async function createBrand(payload: CreateBrandPayload) {
  await simulateLatency();
  const brand: ITBrand = { id: nextId('brand'), activo: payload.activo ?? true, ...payload };
  brands.push(brand);
  return brand;
}

export async function toggleBrandActive(id: string) {
  await simulateLatency();
  const brand = brands.find(b => b.id === id);
  if (!brand) throw new Error('Marca no encontrada');
  brand.activo = !brand.activo;
  return brand;
}

export async function listModels() {
  await simulateLatency();
  return models.slice();
}

export async function createModel(payload: CreateModelPayload) {
  await simulateLatency();
  const model: ITModel = { id: nextId('model'), activo: payload.activo ?? true, ...payload };
  models.push(model);
  return model;
}

export async function toggleModelActive(id: string) {
  await simulateLatency();
  const model = models.find(m => m.id === id);
  if (!model) throw new Error('Modelo no encontrado');
  model.activo = !model.activo;
  return model;
}

export async function listModelsByBrand(marcaId: string) {
  await simulateLatency();
  return models.filter(m => m.marcaId === marcaId);
}

export async function listModelsByCategory(categoria: ITAssetCategory) {
  await simulateLatency();
  return models.filter(m => m.categoria === categoria);
}

export async function listLocationsByType(tipo: ITLocationType) {
  await simulateLatency();
  return locations.filter(l => l.tipo === tipo);
}
