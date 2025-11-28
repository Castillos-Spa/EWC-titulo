import { useState } from 'react';
import type { CreateItemPayload } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateItemPayload) => Promise<void> | void;
}

export default function ItemFormModal({ open, onClose, onSubmit }: Readonly<Props>) {
  const [form, setForm] = useState<CreateItemPayload>({
    sku: '', nombre: '', categoria: '', ubicacion: '', stockInicial: 0, stockMinimo: 0, unidadMedida: 'unidades', descripcion: ''
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
      onClose();
      setForm({ sku: '', nombre: '', categoria: '', ubicacion: '', stockInicial: 0, stockMinimo: 0, unidadMedida: 'unidades', descripcion: '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-4 text-lg font-semibold">Nuevo artículo</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col">
            <label htmlFor="sku" className="text-xs font-medium text-slate-500">SKU</label>
            <input id="sku" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} required />
          </div>
          <div className="col-span-2 flex flex-col">
            <label htmlFor="nombre" className="text-xs font-medium text-slate-500">Nombre</label>
            <input id="nombre" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="categoria" className="text-xs font-medium text-slate-500">Categoría</label>
            <input id="categoria" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="ubicacion" className="text-xs font-medium text-slate-500">Ubicación</label>
            <input id="ubicacion" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="stockInicial" className="text-xs font-medium text-slate-500">Stock inicial</label>
            <input id="stockInicial" type="number" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.stockInicial} onChange={e => setForm({ ...form, stockInicial: Number(e.target.value) })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="stockMinimo" className="text-xs font-medium text-slate-500">Stock mínimo</label>
            <input id="stockMinimo" type="number" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.stockMinimo} onChange={e => setForm({ ...form, stockMinimo: Number(e.target.value) })} required />
          </div>
          <div className="flex flex-col">
            <label htmlFor="unidadMedida" className="text-xs font-medium text-slate-500">Unidad</label>
            <select id="unidadMedida" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" value={form.unidadMedida} onChange={e => setForm({ ...form, unidadMedida: e.target.value })}>
              <option value="unidades">unidades</option>
              <option value="kg">kg</option>
              <option value="lts">lts</option>
            </select>
          </div>
          <div className="col-span-2 flex flex-col">
            <label htmlFor="descripcion" className="text-xs font-medium text-slate-500">Descripción</label>
            <textarea id="descripcion" className="rounded-lg border border-slate-300 px-3 py-2 dark:border-white/10 dark:bg-slate-800" rows={3} value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="col-span-2 mt-2 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Cancelar</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow disabled:opacity-50">
              {submitting ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
