import type { Vehiculo } from "../types/Vehiculo";

export type StandardVehiculo = Vehiculo & {
  empresaId: string;
  nombre?: string | null;
  segmento?: string | null;
  centroCosto?: string | null;
  region?: string | null;
  manager?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  // Enterprise fields
  vin?: string | null;
  anio?: number | null;
  combustible?: string | null;
  normaEmisiones?: string | null;
  propietario?: string | null;
  arrendador?: string | null;
  contrato?: string | null;
  valorCompra?: number | null;
  valorResidual?: number | null;
  vidaUtilMeses?: number | null;
  baseUbicacion?: string | null;
  aseguradora?: string | null;
  polizaNumero?: string | null;
  polizaVence?: string | null; // ISO date
  dispositivosIoT?: Record<string, unknown> | null;
};

const LS_KEY = "std:vehiculos";

function load(): StandardVehiculo[] {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return seed();
  try {
    const data = JSON.parse(raw) as StandardVehiculo[];
    return Array.isArray(data) ? data : seed();
  } catch {
    return seed();
  }
}

function save(list: StandardVehiculo[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function seed(): StandardVehiculo[] {
  const now = new Date().toISOString();
  const base: StandardVehiculo[] = [
    {
      id: 1001,
      empresaId: "EWC",
      codigo: "TK-001",
      nombre: "Cisterna Norte 1",
      patente: "ABCD11",
      marca: "Volvo",
      modelo: "FMX",
      tipo: "Camion",
      capacidad: 30000,
      odometro: 125_430,
      estado: "disponible",
      areaAsignada: "Transporte",
      conductorId: null,
      lastMaintenanceDate: null,
      createdAt: now,
      updatedAt: now,
      segmento: "Cisterna",
      centroCosto: "CC-TR-01",
      region: "Norte",
      manager: "Juan Pérez",
      tags: ["prioridad","24x7"],
      metadata: { norma: "Euro V" },
      vin: "YV2XTY0A1AB123456",
      anio: 2021,
      combustible: "Diésel",
      normaEmisiones: "Euro V",
      propietario: "Empresa X",
      arrendador: null,
      contrato: null,
      valorCompra: 180000,
      valorResidual: 50000,
      vidaUtilMeses: 96,
      baseUbicacion: "Base Norte",
      aseguradora: "Seguros ABC",
      polizaNumero: "POL-12345",
      polizaVence: new Date(Date.now() + 200*24*60*60*1000).toISOString(),
      dispositivosIoT: { gps: true, canBus: true },
    },
    {
      id: 1002,
      empresaId: "EWC",
      codigo: "AP-010",
      nombre: "Pick-up Apoyo 1",
      patente: "BCDE22",
      marca: "Toyota",
      modelo: "Hilux",
      tipo: "Camioneta",
      capacidad: 0,
      odometro: 82_010,
      estado: "en_uso",
      areaAsignada: "Transporte",
      conductorId: null,
      lastMaintenanceDate: null,
      createdAt: now,
      updatedAt: now,
      segmento: "Apoyo",
      centroCosto: "CC-TR-02",
      region: "Norte",
      manager: "María Soto",
      tags: ["pool"],
      metadata: null,
      vin: null,
      anio: 2019,
      combustible: "Diésel",
      normaEmisiones: "Euro IV",
      propietario: "Empresa X",
      arrendador: null,
      contrato: null,
      valorCompra: 28000,
      valorResidual: 5000,
      vidaUtilMeses: 84,
      baseUbicacion: "Base Norte",
      aseguradora: "Seguros ABC",
      polizaNumero: "POL-98765",
      polizaVence: new Date(Date.now() + 120*24*60*60*1000).toISOString(),
      dispositivosIoT: { gps: true },
    },
  ];
  save(base);
  return base;
}

export async function getStandardVehiculos(): Promise<StandardVehiculo[]> {
  await delay(150);
  return load();
}

export type CreateStandardVehiculo = {
  empresaId: string;
  codigo: string;
  patente: string;
  marca: string;
  modelo: string;
  tipo?: string | null;
  capacidad?: number;
  odometro?: number;
  estado?: Vehiculo["estado"];
  areaAsignada?: string | null;
  nombre?: string | null;
  segmento?: string | null;
  centroCosto?: string | null;
  region?: string | null;
  manager?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  vin?: string | null;
  anio?: number | null;
  combustible?: string | null;
  normaEmisiones?: string | null;
  propietario?: string | null;
  arrendador?: string | null;
  contrato?: string | null;
  valorCompra?: number | null;
  valorResidual?: number | null;
  vidaUtilMeses?: number | null;
  baseUbicacion?: string | null;
  aseguradora?: string | null;
  polizaNumero?: string | null;
  polizaVence?: string | null;
  dispositivosIoT?: Record<string, unknown> | null;
};

export async function createStandardVehiculo(payload: CreateStandardVehiculo): Promise<StandardVehiculo> {
  await delay(200);
  const list = load();
  // Unicidad empresaId+codigo y empresaId+patente
  if (list.some(v => v.empresaId === payload.empresaId && v.codigo?.trim().toUpperCase() === payload.codigo.trim().toUpperCase())) {
    throw new Error("Ya existe un vehículo con ese código en esta empresa.");
  }
  if (list.some(v => v.empresaId === payload.empresaId && v.patente.trim().toUpperCase() === payload.patente.trim().toUpperCase())) {
    throw new Error("Ya existe un vehículo con esa patente en esta empresa.");
  }
  // Validación condicional: capacidad obligatoria si es Camion
  const tipoNorm = (payload.tipo ?? '').toLowerCase();
  if (tipoNorm.includes('camion') && (!payload.capacidad || payload.capacidad <= 0)) {
    throw new Error("Capacidad es obligatoria para vehículos tipo Camion.");
  }
  const now = new Date().toISOString();
  const id = list.length ? Math.max(...list.map(v => v.id)) + 1 : 1000;
  const nuevo: StandardVehiculo = {
    id,
    empresaId: payload.empresaId,
    codigo: payload.codigo,
    nombre: payload.nombre ?? null,
    patente: payload.patente.toUpperCase(),
    marca: payload.marca,
    modelo: payload.modelo,
    tipo: payload.tipo ?? null,
    capacidad: payload.capacidad ?? 0,
    odometro: payload.odometro ?? 0,
    estado: payload.estado ?? "disponible",
    areaAsignada: payload.areaAsignada ?? null,
    conductorId: null,
    lastMaintenanceDate: null,
    createdAt: now,
    updatedAt: now,
    segmento: payload.segmento ?? null,
    centroCosto: payload.centroCosto ?? null,
    region: payload.region ?? null,
    manager: payload.manager ?? null,
    tags: payload.tags ?? [],
    metadata: payload.metadata ?? null,
    vin: payload.vin ?? null,
    anio: payload.anio ?? null,
    combustible: payload.combustible ?? null,
    normaEmisiones: payload.normaEmisiones ?? null,
    propietario: payload.propietario ?? null,
    arrendador: payload.arrendador ?? null,
    contrato: payload.contrato ?? null,
    valorCompra: payload.valorCompra ?? null,
    valorResidual: payload.valorResidual ?? null,
    vidaUtilMeses: payload.vidaUtilMeses ?? null,
    baseUbicacion: payload.baseUbicacion ?? null,
    aseguradora: payload.aseguradora ?? null,
    polizaNumero: payload.polizaNumero ?? null,
    polizaVence: payload.polizaVence ?? null,
    dispositivosIoT: payload.dispositivosIoT ?? null,
  };
  const next = [nuevo, ...list];
  save(next);
  return nuevo;
}

export async function updateStandardVehiculo(id: number, patch: Partial<CreateStandardVehiculo>): Promise<StandardVehiculo> {
  await delay(200);
  const list = load();
  const idx = list.findIndex(v => v.id === id);
  if (idx === -1) throw new Error("Vehículo no encontrado");
  const current = list[idx];
  const empresaId = patch.empresaId ?? current.empresaId;
  const codigo = (patch.codigo ?? current.codigo ?? "").trim();
  const patente = (patch.patente ?? current.patente).trim().toUpperCase();
  if (codigo) {
    const dup = list.find(v => v.id !== id && v.empresaId === empresaId && (v.codigo ?? "").trim().toUpperCase() === codigo.toUpperCase());
    if (dup) throw new Error("Código duplicado en la empresa");
  }
  if (patente) {
    const dup2 = list.find(v => v.id !== id && v.empresaId === empresaId && v.patente.toUpperCase() === patente);
    if (dup2) throw new Error("Patente duplicada en la empresa");
  }
  const now = new Date().toISOString();
  const merged: StandardVehiculo = {
    ...current,
    empresaId,
    codigo: codigo || current.codigo,
    patente,
    marca: patch.marca ?? current.marca,
    modelo: patch.modelo ?? current.modelo,
    tipo: patch.tipo ?? current.tipo,
    capacidad: patch.capacidad ?? current.capacidad,
    odometro: patch.odometro ?? current.odometro,
    estado: patch.estado ?? current.estado,
    areaAsignada: patch.areaAsignada ?? current.areaAsignada,
    nombre: patch.nombre ?? current.nombre,
    segmento: patch.segmento ?? current.segmento,
    centroCosto: patch.centroCosto ?? current.centroCosto,
    region: patch.region ?? current.region,
    manager: patch.manager ?? current.manager,
    tags: patch.tags ?? current.tags ?? [],
    metadata: patch.metadata ?? current.metadata,
    updatedAt: now,
    vin: patch.vin ?? current.vin,
    anio: patch.anio ?? current.anio,
    combustible: patch.combustible ?? current.combustible,
    normaEmisiones: patch.normaEmisiones ?? current.normaEmisiones,
    propietario: patch.propietario ?? current.propietario,
    arrendador: patch.arrendador ?? current.arrendador,
    contrato: patch.contrato ?? current.contrato,
    valorCompra: patch.valorCompra ?? current.valorCompra,
    valorResidual: patch.valorResidual ?? current.valorResidual,
    vidaUtilMeses: patch.vidaUtilMeses ?? current.vidaUtilMeses,
    baseUbicacion: patch.baseUbicacion ?? current.baseUbicacion,
    aseguradora: patch.aseguradora ?? current.aseguradora,
    polizaNumero: patch.polizaNumero ?? current.polizaNumero,
    polizaVence: patch.polizaVence ?? current.polizaVence,
    dispositivosIoT: patch.dispositivosIoT ?? current.dispositivosIoT,
  };
  const next = list.slice();
  next[idx] = merged;
  save(next);
  return merged;
}

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
