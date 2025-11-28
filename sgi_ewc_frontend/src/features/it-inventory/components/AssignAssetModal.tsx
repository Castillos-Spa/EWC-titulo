import { useEffect, useState } from 'react';
import type { ITAsset } from '../types';

interface Props {
  open: boolean;
  asset: ITAsset | null;
  onClose: () => void;
  onAssign: (payload: { usuario: string; detalle: string }) => Promise<void> | void;
  onUnassign: (detalle: string) => Promise<void> | void;
}

export default function AssignAssetModal({ open, asset, onClose, onAssign, onUnassign }: Readonly<Props>) {
  const [usuario, setUsuario] = useState('');
  const [detalle, setDetalle] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [releasing, setReleasing] = useState(false);

  useEffect(() => {
    if (asset && open) {
      setUsuario(asset.asignadoA ?? '');
      setDetalle('');
    }
  }, [asset, open]);

  if (!open || !asset) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim()) return;
    setAssigning(true);
    try {
      await onAssign({ usuario: usuario.trim(), detalle });
      setDetalle('');
    } finally {
      setAssigning(false);
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      await onUnassign(detalle);
      setUsuario('');
      setDetalle('');
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold">Asignar activo · {asset.assetTag}</h3>
        <form onSubmit={handleAssign} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label htmlFor="usuario" className="text-xs font-medium text-slate-500">Usuario / correo</label>
            <input id="usuario" value={usuario} onChange={e => setUsuario(e.target.value)} placeholder="usuario@empresa.com" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" />
          </div>
          <div className="space-y-1">
            <label htmlFor="detalleAsignacion" className="text-xs font-medium text-slate-500">Detalle</label>
            <textarea id="detalleAsignacion" rows={3} value={detalle} onChange={e => setDetalle(e.target.value)} placeholder="Notas de asignación o devolución" className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Cerrar</button>
            <div className="flex gap-2">
              {asset.asignadoA && (
                <button type="button" onClick={handleRelease} disabled={releasing} className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-40 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-500/10">
                  {releasing ? 'Liberando…' : 'Liberar'}
                </button>
              )}
              <button type="submit" disabled={assigning || !usuario.trim()} className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-40">
                {assigning ? 'Asignando…' : 'Asignar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
