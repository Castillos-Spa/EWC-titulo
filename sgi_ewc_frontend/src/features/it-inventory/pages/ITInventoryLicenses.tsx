import { useEffect, useState } from 'react';
import { listLicensePools, listLicenseAssignments, assignLicense, releaseLicense, type LicensePool, type LicenseAssignment } from '../services/mockItLicensesApi';
import { Plus, KeySquare, Users, Laptop2, Trash2 } from 'lucide-react';

type Tab = 'pools' | 'assignments';

export default function ITInventoryLicenses() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pools, setPools] = useState<LicensePool[]>([]);
  const [tab, setTab] = useState<Tab>('pools');
  const [selectedPool, setSelectedPool] = useState<LicensePool | null>(null);
  const [assignments, setAssignments] = useState<LicenseAssignment[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [targetUser, setTargetUser] = useState('');
  const [targetAsset, setTargetAsset] = useState('');
  const [busyRelease, setBusyRelease] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true); setError(null);
    listLicensePools()
      .then(data => { if (mounted) setPools(data); })
      .catch(() => { if (mounted) setError('No se pudieron cargar los pools'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedPool) { setAssignments([]); return; }
    listLicenseAssignments(selectedPool.id).then(setAssignments);
  }, [selectedPool]);

  const refreshAssignments = () => {
    if (!selectedPool) return;
    listLicenseAssignments(selectedPool.id).then(setAssignments);
  };

  const handleAssign = async () => {
    if (!selectedPool) return;
    setAssigning(true); setError(null);
    try {
      await assignLicense({ poolId: selectedPool.id, target: { usuarioId: targetUser || undefined, assetId: targetAsset || undefined } });
      setTargetUser(''); setTargetAsset('');
      // refrescar pools y assignments
      listLicensePools().then(setPools);
      refreshAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error asignando');
    } finally {
      setAssigning(false);
    }
  };

  const handleRelease = async (id: string) => {
    setBusyRelease(id); setError(null);
    try {
      await releaseLicense(id);
      listLicensePools().then(setPools);
      refreshAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error liberando');
    } finally {
      setBusyRelease(null);
    }
  };

  const daysToExpire = (pool: LicensePool) => pool.venceEl ? Math.ceil((new Date(pool.venceEl).getTime() - Date.now()) / (24*60*60*1000)) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2"><KeySquare className="h-5 w-5" /> Licencias</h2>
        <div className="flex gap-2 text-sm">
          <button onClick={() => setTab('pools')} className={`rounded-full px-4 py-1.5 ${tab==='pools' ? 'bg-indigo-600 text-white shadow' : 'bg-white/70 text-slate-600 border border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200'}`}>Pools</button>
          <button disabled={!selectedPool} onClick={() => setTab('assignments')} className={`rounded-full px-4 py-1.5 ${tab==='assignments' ? 'bg-indigo-600 text-white shadow' : 'bg-white/70 text-slate-600 border border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200'} disabled:opacity-40`}>Asignaciones</button>
        </div>
      </div>

      {error && <div className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">{error}</div>}

      {tab==='pools' && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {loading && <div className="col-span-full text-sm text-slate-500">Cargando pools…</div>}
            {!loading && pools.map(p => {
              const avail = p.seatsTotales - p.seatsUsados;
              const ratio = p.seatsTotales ? p.seatsUsados / p.seatsTotales : 0;
              const dias = daysToExpire(p);
              return (
                <button key={p.id} type="button" onClick={() => setSelectedPool(p)}
                  className={`group rounded-2xl border p-4 text-left transition ${selectedPool?.id===p.id ? 'border-indigo-500 shadow-md bg-white dark:bg-slate-800' : 'border-slate-200 bg-white/70 hover:border-indigo-300 dark:border-white/10 dark:bg-slate-900/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold tracking-tight text-slate-800 dark:text-slate-100 truncate">{p.producto}</div>
                    {dias !== null && dias <= 30 && dias > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">{dias}d</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{p.fabricante} · {p.tipo}</div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Uso: {p.seatsUsados}/{p.seatsTotales}</span>
                      <span className="text-slate-500">Disp: {avail}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style={{ width: `${Math.min(100, Math.round(ratio*100))}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {!loading && !pools.length && <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No hay pools creados.</div>}
        </div>
      )}

      {tab==='assignments' && selectedPool && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold tracking-tight">Asignaciones: {selectedPool.producto}</h3>
              <p className="text-xs text-slate-500">Seats usados: {selectedPool.seatsUsados}/{selectedPool.seatsTotales} (disp: {selectedPool.seatsTotales - selectedPool.seatsUsados})</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={assigning}
                onClick={handleAssign}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-40"
              >
                <Plus className="h-4 w-4" /> Asignar
              </button>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white/80 p-4 text-sm dark:border-white/10 dark:bg-slate-900/40">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="usuarioId" className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Usuario ID</label>
                <input id="usuarioId" value={targetUser} onChange={e => { setTargetUser(e.target.value); if (e.target.value) setTargetAsset(''); }} placeholder="usr_123" className="w-full rounded-lg border border-slate-300 bg-white/70 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div className="space-y-1">
                <label htmlFor="assetId" className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1"><Laptop2 className="h-3.5 w-3.5" /> Asset ID</label>
                <input id="assetId" value={targetAsset} onChange={e => { setTargetAsset(e.target.value); if (e.target.value) setTargetUser(''); }} placeholder="it_456" className="w-full rounded-lg border border-slate-300 bg-white/70 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800" />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Ingresa usuario o asset (uno solo). Valida cupos disponibles antes de asignar.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-4 dark:border-white/10 dark:bg-slate-900/40">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span>Asignaciones activas ({assignments.filter(a => a.estado==='ACTIVA').length})</span>
              <button type="button" onClick={refreshAssignments} className="text-indigo-600 hover:underline">Refrescar</button>
            </div>
            <div className="divide-y divide-slate-200/60 text-xs dark:divide-white/10">
              {assignments.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="truncate">
                    <div className="font-medium">{a.asignadoA === 'USUARIO' ? `Usuario: ${a.usuarioId}` : `Asset: ${a.assetId}`}</div>
                    <div className="text-[10px] text-slate-500">Desde: {new Date(a.desde).toLocaleDateString()} · Estado: {a.estado}</div>
                  </div>
                  {a.estado==='ACTIVA' && (
                    <button type="button" onClick={() => handleRelease(a.id)} disabled={busyRelease===a.id} className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-200 disabled:opacity-40">
                      <Trash2 className="h-3.5 w-3.5" /> Liberar
                    </button>
                  )}
                </div>
              ))}
              {!assignments.length && <div className="py-2 text-slate-500">No hay asignaciones.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
