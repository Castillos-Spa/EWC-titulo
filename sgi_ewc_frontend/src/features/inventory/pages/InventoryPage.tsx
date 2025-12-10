import { useCallback, useEffect, useMemo, useState } from 'react';
import { Boxes, Plus, Scale, BadgePercent } from 'lucide-react';
import type { InventoryItem, InventoryFilters, StockMovement } from '../types';
import { listItems, createItem, adjustStock, listMovements } from '../services/inventoryApi';
import InventoryFiltersComp from '../components/InventoryFilters';
import ItemsTable from '../components/ItemsTable';
import ItemFormModal from '../components/ItemFormModal';
import AdjustStockModal from '../components/AdjustStockModal';
import MovementsTable from '../components/MovementsTable';

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({ estado: 'all' });
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [movs, setMovs] = useState<StockMovement[]>([]);
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAdjust, setShowAdjust] = useState<InventoryItem | null>(null);

  const categorias = useMemo(() => {
    return Array.from(new Set(items.map(i => i.categoria))).sort((a,b) => a.localeCompare(b));
  }, [items]);

  const reloadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listItems(filters);
      setItems(data);
    } catch (error) {
      console.error('[InventoryPage] error loading items', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listItems(filters)
      .then(data => { if (active) setItems(data); })
      .catch(error => { if (active) console.error('[InventoryPage] error loading items', error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  useEffect(() => {
    const onGlobalSearch = (e: Event) => {
      const detail = (e as CustomEvent).detail as { query?: string } | undefined;
      if (detail?.query) setFilters(f => ({ ...f, search: detail.query }));
    };
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as { id?: number } | undefined;
      const id = d?.id;
      if (typeof id === 'number') {
        const found = items.find(r => r.id === id) || null;
        setSelected(found);
      }
    };
    globalThis.addEventListener('global-search', onGlobalSearch as EventListener);
    globalThis.addEventListener('inventory:open', onOpen as EventListener);
    return () => {
      globalThis.removeEventListener('global-search', onGlobalSearch as EventListener);
      globalThis.removeEventListener('inventory:open', onOpen as EventListener);
    };
  }, [items]);

  useEffect(() => {
    if (!selected) { setMovs([]); return; }
    let active = true;
    listMovements(selected.id)
      .then(data => { if (active) setMovs(data); })
      .catch(error => { if (active) console.error('[InventoryPage] error loading movements', error); });
    return () => { active = false; };
  }, [selected]);

  const handleCreate = async (payload: Parameters<typeof createItem>[0]) => {
    try {
      const created = await createItem(payload);
      setSelected(created);
    } catch (error) {
      console.error('[InventoryPage] error creating inventory item', error);
    } finally {
      setShowCreate(false);
      await reloadItems();
    }
  };

  const handleAdjust = async (itemId: number, cantidad: number, motivo: string) => {
    try {
      const updated = await adjustStock(itemId, { cantidad, motivo });
      setSelected(prev => (prev?.id === updated.id ? updated : prev));
      if (selected?.id === itemId) {
        const movements = await listMovements(itemId);
        setMovs(movements);
      }
    } catch (error) {
      console.error('[InventoryPage] error adjusting stock', error);
    } finally {
      setShowAdjust(null);
      await reloadItems();
    }
  };

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-indigo-100 via-white to-sky-100 px-8 py-6 shadow-xl shadow-slate-200/40 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/30 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl dark:bg-indigo-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Boxes className="h-4 w-4" />
              <span>Inventario Taller</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Ítems, movimientos y ajustes</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Mock UI para gestionar repuestos, lubricantes y consumibles del taller. No conecta a backend; usa datos en memoria.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Nuevo artículo
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={() => setShowAdjust(selected)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-lg disabled:opacity-40"
            >
              <Scale className="h-4 w-4" />
              Ajuste stock
            </button>
          </div>
        </div>
      </section>

      <InventoryFiltersComp
        filters={filters}
        categorias={categorias}
        onChange={setFilters}
        onReset={() => setFilters({ estado: 'all' })}
        total={items.length}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-7 2xl:col-span-8 space-y-4">
          <ItemsTable items={items} loading={loading} onView={setSelected} />
        </div>
        <div className="col-span-12 xl:col-span-5 2xl:col-span-4 space-y-4">
          <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            <div className="mb-3 flex items-center gap-2">
              <BadgePercent className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-semibold">Detalle y movimientos</h3>
            </div>
            {selected === null ? (
              <p className="text-sm text-slate-500">Selecciona un ítem para ver sus movimientos.</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">SKU</span>
                  <span className="font-mono text-xs">{selected.sku}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nombre</span>
                  <span className="font-medium">{selected.nombre}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Categoría</span>
                  <span>{selected.categoria}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Ubicación</span>
                  <span>{selected.ubicacion}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Stock</span>
                  <span>{selected.stockActual} <span className="text-xs text-slate-400">(min {selected.stockMinimo})</span></span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Unidad</span>
                  <span>{selected.unidadMedida}</span>
                </div>
              </div>
            )}
          </div>
          <MovementsTable data={movs} />
        </div>
      </div>

      <ItemFormModal open={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
      <AdjustStockModal item={showAdjust} onClose={() => setShowAdjust(null)} onAdjust={handleAdjust} />
    </div>
  );
}
