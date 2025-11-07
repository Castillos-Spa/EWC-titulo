import { useEffect, useMemo, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import type { ITAsset, ITFilters, ITMovement, ITAssetCategory, ITAssetStatus } from '../types';
import { listAssets, createAsset, listMovements, changeStatus } from '../services/mockItInventoryApi';
import ITInventoryFilters from '../components/ITInventoryFilters';
import ITAssetsTable from '../components/ITAssetsTable';
import ITAssetFormModal from '../components/ITAssetFormModal';
import ITAssetDetail from '../components/ITAssetDetail';

// Pestaña de Activos: contiene la lógica original del módulo antes de la refactorización a layout con tabs.
export default function ITInventoryAssets() {
  const [filters, setFilters] = useState<ITFilters>({ estado: 'all', categoria: 'all' });
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ITAsset | null>(null);
  const [movs, setMovs] = useState<ITMovement[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const categorias: ITAssetCategory[] = useMemo(() => {
    return Array.from(new Set(assets.map(a => a.categoria))).sort((a,b) => a.localeCompare(b));
  }, [assets]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    listAssets(filters).then(d => { if (mounted) setAssets(d); }).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [filters]);

  useEffect(() => {
    if (!selected) { setMovs([]); return; }
    listMovements(selected.id).then(setMovs);
  }, [selected]);

  const handleCreate = async (payload: Parameters<typeof createAsset>[0]) => {
    await createAsset(payload);
    setShowCreate(false);
    setLoading(true);
    listAssets(filters).then(setAssets).finally(() => setLoading(false));
  };

  const cycleStatus = async (asset: ITAsset) => {
    const order: ITAssetStatus[] = ['EN_STOCK','ASIGNADO','EN_REPARACION','RETIRADO'];
    const next = order[(order.indexOf(asset.estado) + 1) % order.length];
    await changeStatus(asset.id, next, `Cambio de estado a ${next}`);
    if (selected?.id === asset.id) listMovements(asset.id).then(setMovs);
    setLoading(true); listAssets(filters).then(setAssets).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5">
          <Plus className="h-4 w-4" /> Nuevo activo
        </button>
        <button type="button" disabled={!selected} onClick={() => selected && cycleStatus(selected)} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40">
          <Wrench className="h-4 w-4" /> Ciclar estado
        </button>
      </div>

      <ITInventoryFilters filters={filters} categorias={categorias} onChange={setFilters} onReset={() => setFilters({ estado: 'all', categoria: 'all' })} total={assets.length} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-7 2xl:col-span-8 space-y-4">
          <ITAssetsTable assets={assets} loading={loading} onSelect={setSelected} />
        </div>
        <div className="col-span-12 xl:col-span-5 2xl:col-span-4 space-y-4">
          <ITAssetDetail asset={selected} movements={movs} />
        </div>
      </div>

      <ITAssetFormModal open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </div>
  );
}
