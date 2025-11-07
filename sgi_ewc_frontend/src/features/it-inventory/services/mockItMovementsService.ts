import { listAssets, listMovements } from './mockItInventoryApi';
import type { ITMovement, ITMovementType } from '../types';

export type GlobalMovementFilters = {
  desde?: string; // ISO (00:00)
  hasta?: string; // ISO (23:59)
  tipo?: ITMovementType | 'all';
  q?: string; // busca en detalle/usuario
  assetId?: number;
};

function simulateLatency(min = 200, max = 500) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function listGlobalMovements(filters: GlobalMovementFilters = {}): Promise<ITMovement[]> {
  await simulateLatency();
  const assets = await listAssets({});
  const allByAsset = await Promise.all(assets.map(a => listMovements(a.id)));
  let data = allByAsset.flat().sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  if (filters.assetId) data = data.filter(m => m.assetId === filters.assetId);
  if (filters.tipo && filters.tipo !== 'all') data = data.filter(m => m.tipo === filters.tipo);
  if (filters.desde) {
    const d = new Date(filters.desde).getTime();
    data = data.filter(m => new Date(m.fecha).getTime() >= d);
  }
  if (filters.hasta) {
    const h = new Date(filters.hasta).getTime();
    data = data.filter(m => new Date(m.fecha).getTime() <= h);
  }
  if (filters.q) {
    const q = filters.q.toLowerCase();
    data = data.filter(m => [m.detalle, m.usuario].some(x => x?.toLowerCase().includes(q)));
  }
  return data;
}

export function movementsToCSV(rows: ITMovement[]): string {
  const header = ['id','assetId','tipo','fecha','detalle','usuario'];
  const escape = (v: unknown) => {
    if (v == null) return '';
    if (typeof v === 'object') {
      try { v = JSON.stringify(v); } catch { v = '[object]'; }
    }
    // Escapar comillas usando split/join para evitar regla de replaceAll
    const s = String(v).split('"').join('""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const lines = rows.map(r => [r.id, r.assetId, r.tipo, r.fecha, r.detalle, r.usuario].map(escape).join(','));
  return [header.join(','), ...lines].join('\n');
}
