import { useState } from 'react';
import type { CreateITAssetPayload, ITAssetCategory } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateITAssetPayload) => Promise<void> | void;
}

const categorias: ITAssetCategory[] = ['Laptop','Monitor','Licencia','Periférico','Desktop','Impresora','Servidor'];

export default function ITAssetFormModal({ open, onClose, onSubmit }: Readonly<Props>) {
  const [form, setForm] = useState<CreateITAssetPayload>({ assetTag: '', nombre: '', categoria: 'Laptop', ubicacion: 'Bodega IT' });
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSubmit(form); onClose(); setForm({ assetTag: '', nombre: '', categoria: 'Laptop', ubicacion: 'Bodega IT' }); } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold">Nuevo activo IT</h3>
        <form onSubmit={handle} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col">
            <label htmlFor="assetTag" className="text-xs font-medium text-slate-500">Asset Tag</label>
            <input id="assetTag" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.assetTag} onChange={e => setForm({ ...form, assetTag: e.target.value })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="nombre" className="text-xs font-medium text-slate-500">Nombre</label>
            <input id="nombre" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="categoria" className="text-xs font-medium text-slate-500">Categoría</label>
            <select id="categoria" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value as ITAssetCategory })}>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex flex-col">
            <label htmlFor="ubicacion" className="text-xs font-medium text-slate-500">Ubicación</label>
            <input id="ubicacion" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="serialNumber" className="text-xs font-medium text-slate-500">Serie</label>
            <input id="serialNumber" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.serialNumber ?? ''} onChange={e => setForm({ ...form, serialNumber: e.target.value })} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="proveedor" className="text-xs font-medium text-slate-500">Proveedor</label>
            <input id="proveedor" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.proveedor ?? ''} onChange={e => setForm({ ...form, proveedor: e.target.value })} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="fechaCompra" className="text-xs font-medium text-slate-500">Fecha compra</label>
            <input id="fechaCompra" type="date" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.fechaCompra ? form.fechaCompra.substring(0,10) : ''} onChange={e => setForm({ ...form, fechaCompra: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <div className="flex flex-col">
            <label htmlFor="garantiaHasta" className="text-xs font-medium text-slate-500">Garantía hasta</label>
            <input id="garantiaHasta" type="date" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.garantiaHasta ? form.garantiaHasta.substring(0,10) : ''} onChange={e => setForm({ ...form, garantiaHasta: e.target.value ? new Date(e.target.value).toISOString() : undefined })} />
          </div>
          <div className="col-span-2 flex flex-col">
            <label htmlFor="notas" className="text-xs font-medium text-slate-500">Notas</label>
            <textarea id="notas" rows={3} className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.notas ?? ''} onChange={e => setForm({ ...form, notas: e.target.value })} />
          </div>
          <div className="col-span-2 mt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Cancelar</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50">{submitting ? 'Creando…' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
