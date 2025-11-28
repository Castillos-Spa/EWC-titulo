import { useState } from 'react';
import type { InventoryItem } from '../types';

interface Props {
  item: InventoryItem | null;
  onClose: () => void;
  onAdjust: (itemId: number, cantidad: number, motivo: string) => Promise<void> | void;
}

export default function AdjustStockModal({ item, onClose, onAdjust }: Readonly<Props>) {
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (cantidad !== 0) await onAdjust(item.id, cantidad, motivo || 'Ajuste manual');
      onClose();
      setCantidad(0); setMotivo('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold">Ajustar stock: {item.nombre}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col">
            <label htmlFor="cantidad" className="text-xs font-medium text-slate-500">Cantidad (+ ingreso / - egreso)</label>
            <input id="cantidad" type="number" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="motivo" className="text-xs font-medium text-slate-500">Motivo</label>
            <textarea id="motivo" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" rows={3} value={motivo} onChange={e => setMotivo(e.target.value)} />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Cancelar</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50">
              {submitting ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-xs text-slate-500">Stock actual: {item.stockActual} (mín {item.stockMinimo})</p>
      </div>
    </div>
  );
}
