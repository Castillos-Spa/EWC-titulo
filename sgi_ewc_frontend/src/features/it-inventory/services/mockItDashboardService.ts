import { listAssets, listMovements } from './mockItInventoryApi';
import type { ITAssetStatus } from '../types';
import { listLicensePools } from './mockItLicensesApi';

export type DashboardKPIs = {
  activosPorEstado: Record<ITAssetStatus, number>;
  proximasExpLicencias: Array<{ poolId: string; producto: string; dias: number }>;
  utilizacionLicencias: Array<{ poolId: string; producto: string; ratio: number }>;
  rotacionActivos30d: number;
};


function simulateLatency(min = 200, max = 500) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  await simulateLatency();

  // Activos por estado
  const allAssets = await listAssets({ estado: 'all', categoria: 'all' });
  const estados: ITAssetStatus[] = ['EN_STOCK', 'ASIGNADO', 'EN_REPARACION', 'RETIRADO'];
  const activosPorEstado = estados.reduce((acc, st) => {
    acc[st] = allAssets.filter(a => a.estado === st).length;
    return acc;
  }, {} as Record<ITAssetStatus, number>);

  // Rotación (movimientos relevantes últimos 30d)
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const movimientos = await Promise.all(
    allAssets.map(a => listMovements(a.id))
  );
  const tiposRelevantes = new Set(['ASIGNACION','TRASLADO','MANTENCION','CAMBIO_ESTADO']);
  const rotacionActivos30d = movimientos.flat().filter(m => {
    const t = new Date(m.fecha).getTime();
    return t >= cutoff && tiposRelevantes.has(m.tipo);
  }).length;

  // Pools de licencias (mock centralizado)
  const pools = await listLicensePools();

  // Próximas renovaciones (<= 60 días, > 0)
  const ahora = Date.now();
  const proximasExpLicencias = pools
    .filter(p => p.venceEl)
    .map(p => ({
      poolId: p.id,
      producto: p.producto,
      dias: p.venceEl ? Math.ceil((new Date(p.venceEl).getTime() - ahora) / (24*60*60*1000)) : Infinity,
    }))
    .filter(x => x.dias > 0 && x.dias <= 60)
    .sort((a,b) => a.dias - b.dias);

  // Utilización de licencias
  const utilizacionLicencias = pools.map(p => ({
    poolId: p.id,
    producto: p.producto,
    ratio: p.seatsTotales > 0 ? p.seatsUsados / p.seatsTotales : 0,
  }));

  return { activosPorEstado, proximasExpLicencias, utilizacionLicencias, rotacionActivos30d };
}

// Nota: listLicensePools es provisto por mockItLicensesApi
