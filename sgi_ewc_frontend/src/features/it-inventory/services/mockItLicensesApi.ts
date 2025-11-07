// Servicio mock para licencias: pools y asignaciones en memoria

export type LicensePoolType = 'PERPETUA' | 'SUSCRIPCION';

export type LicensePool = {
  id: string;
  producto: string;
  fabricante: string;
  tipo: LicensePoolType;
  seatsTotales: number;
  seatsUsados: number;
  venceEl?: string; // ISO
  vendorId?: string;
  notas?: string;
};

export type LicenseAssignmentState = 'ACTIVA' | 'LIBERADA' | 'EXPIRADA';

export type LicenseAssignment = {
  id: string;
  poolId: string;
  asignadoA: 'USUARIO' | 'ACTIVO';
  usuarioId?: string;
  assetId?: string;
  desde: string; // ISO
  hasta?: string; // ISO
  estado: LicenseAssignmentState;
};

type AssignLicensePayload = {
  poolId: string;
  target: { usuarioId?: string; assetId?: string };
  desde?: string;
};

function simulateLatency(min = 200, max = 500) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

let seq = 1000;
function nextId(prefix: string) { return `${prefix}_${seq++}`; }

// Seeds
const pools: LicensePool[] = [
  {
    id: 'lp_1', producto: 'Microsoft 365 E3', fabricante: 'Microsoft', tipo: 'SUSCRIPCION',
    seatsTotales: 50, seatsUsados: 34,
    venceEl: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lp_2', producto: 'Adobe Creative Cloud', fabricante: 'Adobe', tipo: 'SUSCRIPCION',
    seatsTotales: 10, seatsUsados: 8,
    venceEl: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'lp_3', producto: 'Visual Studio Professional', fabricante: 'Microsoft', tipo: 'PERPETUA',
    seatsTotales: 5, seatsUsados: 3,
  },
];

const assignments: LicenseAssignment[] = [
  { id: 'la_1', poolId: 'lp_1', asignadoA: 'USUARIO', usuarioId: 'usr_1', desde: new Date().toISOString(), estado: 'ACTIVA' },
  { id: 'la_2', poolId: 'lp_1', asignadoA: 'ACTIVO', assetId: 'it_1', desde: new Date().toISOString(), estado: 'ACTIVA' },
  { id: 'la_3', poolId: 'lp_2', asignadoA: 'USUARIO', usuarioId: 'usr_2', desde: new Date().toISOString(), estado: 'ACTIVA' },
];

export async function listLicensePools(): Promise<LicensePool[]> {
  await simulateLatency();
  return pools.slice();
}

export async function getLicensePool(id: string): Promise<LicensePool | undefined> {
  await simulateLatency();
  return pools.find(p => p.id === id);
}

export async function createLicensePool(payload: Omit<LicensePool, 'id' | 'seatsUsados'> & { seatsUsados?: number }): Promise<LicensePool> {
  await simulateLatency();
  const obj: LicensePool = { id: nextId('lp'), seatsUsados: payload.seatsUsados ?? 0, ...payload };
  if (obj.seatsUsados > obj.seatsTotales) obj.seatsUsados = obj.seatsTotales;
  pools.push(obj);
  return obj;
}

export async function updateLicensePool(id: string, payload: Partial<Omit<LicensePool, 'id'>>): Promise<LicensePool> {
  await simulateLatency();
  const pool = pools.find(p => p.id === id);
  if (!pool) throw new Error('Pool no encontrado');
  Object.assign(pool, payload);
  if (pool.seatsUsados > pool.seatsTotales) pool.seatsUsados = pool.seatsTotales;
  if (pool.seatsUsados < 0) pool.seatsUsados = 0;
  return pool;
}

export async function seatsAvailable(poolId: string): Promise<number> {
  await simulateLatency();
  const pool = pools.find(p => p.id === poolId);
  if (!pool) throw new Error('Pool no encontrado');
  return Math.max(0, pool.seatsTotales - pool.seatsUsados);
}

export async function listLicenseAssignments(poolId?: string): Promise<LicenseAssignment[]> {
  await simulateLatency();
  const data = poolId ? assignments.filter(a => a.poolId === poolId) : assignments;
  return data.slice();
}

export async function assignLicense(payload: AssignLicensePayload): Promise<LicenseAssignment> {
  await simulateLatency();
  const pool = pools.find(p => p.id === payload.poolId);
  if (!pool) throw new Error('Pool no encontrado');
  if (pool.seatsUsados >= pool.seatsTotales) throw new Error('No hay seats disponibles');

  const { usuarioId, assetId } = payload.target;
  if (!usuarioId && !assetId) throw new Error('Debe indicar usuarioId o assetId');

  // Regla simple: una asignación activa por target y pool
  const yaActiva = assignments.some(a => a.poolId === pool.id && a.estado === 'ACTIVA' && (a.usuarioId === usuarioId || a.assetId === assetId));
  if (yaActiva) throw new Error('Ya existe una asignación activa para este destino');

  const assignment: LicenseAssignment = {
    id: nextId('la'),
    poolId: pool.id,
    asignadoA: usuarioId ? 'USUARIO' : 'ACTIVO',
    usuarioId,
    assetId,
    desde: payload.desde ?? new Date().toISOString(),
    estado: 'ACTIVA',
  };
  assignments.push(assignment);
  pool.seatsUsados = Math.min(pool.seatsTotales, pool.seatsUsados + 1);
  return assignment;
}

export async function releaseLicense(assignmentId: string): Promise<LicenseAssignment> {
  await simulateLatency();
  const a = assignments.find(x => x.id === assignmentId);
  if (!a) throw new Error('Asignación no encontrada');
  if (a.estado !== 'ACTIVA') throw new Error('La asignación no está activa');
  a.estado = 'LIBERADA';
  a.hasta = new Date().toISOString();
  const pool = pools.find(p => p.id === a.poolId);
  if (pool) pool.seatsUsados = Math.max(0, pool.seatsUsados - 1);
  return a;
}
