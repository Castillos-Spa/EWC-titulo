import { useEffect, useState } from 'react';
import type { ITAsset, ITAssetStatus } from '../types';

interface Props {
  open: boolean;
  asset: ITAsset | null;
  onClose: () => void;
  onSubmit: (payload: { estado: ITAssetStatus; detalle: string }) => Promise<void> | void;
}

const estados: ITAssetStatus[] = ['EN_STOCK','ASIGNADO','EN_REPARACION','RETIRADO'];

export default function AssetStatusModal({ open, asset, onClose, onSubmit }: Readonly<Props>) {
  const [estado, setEstado] = useState<ITAssetStatus>('EN_STOCK');
  const [detalle, setDetalle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (asset && open) {
      setEstado(asset.estado);
      setDetalle('');
    }
  }, [asset, open]);

  if (!open || !asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({ estado, detalle });
      setDetalle('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold">Actualizar estado · {asset.assetTag}</h3>
        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label htmlFor="estado" className="text-xs font-medium text-slate-500">Estado</label>
            <select id="estado" value={estado} onChange={e => setEstado(e.target.value as ITAssetStatus)} className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800">
              {estados.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="detalle" className="text-xs font-medium text-slate-500">Detalle</label>
            <textarea id="detalle" rows={3} value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Motivo del cambio" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" />
          </div>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Cancelar</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-40">{submitting ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
