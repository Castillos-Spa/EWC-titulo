import { useEffect, useState } from 'react';
import { Activity, AlertTriangle, BarChart3 } from 'lucide-react';
import { getDashboardKPIs, type DashboardKPIs } from '../services/mockItDashboardService';

function formatPercent(ratio: number) {
  return `${Math.round(ratio * 100)}%`;
}

export default function ITInventoryDashboard() {
  const [data, setData] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError(null);
    getDashboardKPIs()
      .then(kpis => { if (mounted) setData(kpis); })
      .catch(() => { if (mounted) setError('No se pudieron cargar las métricas'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const stock = data?.activosPorEstado?.EN_STOCK ?? 0;
  const asignados = data?.activosPorEstado?.ASIGNADO ?? 0;
  const reparacion = data?.activosPorEstado?.EN_REPARACION ?? 0;
  const retirados = data?.activosPorEstado?.RETIRADO ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 dark:border-white/10 dark:bg-slate-900/40">
        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
          <BarChart3 className="h-5 w-5" />
          <h2 className="text-lg font-semibold tracking-tight">Resumen</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Activos por estado, próximas renovaciones, rotación 30d y utilización de licencias.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-300/60 bg-rose-50 p-4 text-rose-800 dark:border-rose-900/50 dark:bg-rose-900/30 dark:text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="font-medium">Activos en stock</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : stock}</div>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="font-medium">Asignados</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : asignados}</div>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="font-medium">En reparación</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : reparacion}</div>
        </div>
        <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 text-sm shadow-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="font-medium">Retirados</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : retirados}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Próximas renovaciones */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 text-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-base font-semibold tracking-tight">Próximas renovaciones (≤ 60 días)</h3>
          </div>
          <div className="divide-y divide-slate-200/60 dark:divide-white/10">
            {loading && <div className="py-2 text-slate-500">Cargando…</div>}
            {!loading && (data?.proximasExpLicencias?.length ? data.proximasExpLicencias.map(x => (
              <div key={x.poolId} className="flex items-center justify-between gap-3 py-2">
                <div className="truncate">
                  <div className="font-medium">{x.producto}</div>
                  <div className="text-xs text-slate-500">Pool: {x.poolId}</div>
                </div>
                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                  {x.dias} días
                </div>
              </div>
            )) : <div className="py-2 text-slate-500">Sin renovaciones en los próximos 60 días</div>)}
          </div>
        </div>

        {/* Rotación y utilización */}
        <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-6 text-sm dark:border-white/10 dark:bg-slate-900/40">
          <div className="mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Activity className="h-5 w-5 text-sky-500" />
            <h3 className="text-base font-semibold tracking-tight">Rotación 30 días y utilización</h3>
          </div>
          <div className="mb-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">Movimientos relevantes en 30 días</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight">{loading ? '—' : data?.rotacionActivos30d ?? 0}</div>
          </div>
          <div className="space-y-3">
            {loading && <div className="text-slate-500">Cargando…</div>}
            {!loading && data?.utilizacionLicencias?.map(u => (
              <div key={u.poolId}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="truncate text-slate-700 dark:text-slate-200">{u.producto}</div>
                  <div className="text-xs text-slate-500">{formatPercent(u.ratio)}</div>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${Math.min(100, Math.round(u.ratio * 100))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
