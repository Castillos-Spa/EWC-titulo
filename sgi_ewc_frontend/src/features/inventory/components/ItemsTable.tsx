import { PackageOpen } from 'lucide-react';
import type { InventoryItem } from '../types';

interface Props {
  items: InventoryItem[];
  loading?: boolean;
  onView: (item: InventoryItem) => void;
}

export default function ItemsTable({ items, loading, onView }: Readonly<Props>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500 dark:bg-white/10 dark:text-blue-100">
          <tr>
            <th className="px-4 py-3 font-medium">SKU</th>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Ubicación</th>
            <th className="px-4 py-3 font-medium text-right">Stock</th>
            <th className="px-4 py-3 font-medium">Unidad</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-500">Cargando…</td></tr>
          )}
          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-slate-100 p-2 dark:bg-white/10">
                  <PackageOpen className="h-full w-full text-slate-400" />
                </div>
                Sin resultados con los filtros actuales
              </td>
            </tr>
          )}
          {!loading && items.length > 0 && items.map(item => (
              <tr key={item.id} className="border-t border-slate-100/70 text-slate-700 dark:border-white/10 dark:text-blue-100">
                <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                <td className="px-4 py-3">{item.nombre}</td>
                <td className="px-4 py-3">{item.categoria}</td>
                <td className="px-4 py-3">{item.ubicacion}</td>
                <td className="px-4 py-3 text-right">
                  <span className={item.stockActual <= item.stockMinimo ? 'text-rose-600 dark:text-rose-400' : ''}>
                    {item.stockActual}
                  </span>
                  <span className="ml-1 text-xs text-slate-400">(min {item.stockMinimo})</span>
                </td>
                <td className="px-4 py-3">{item.unidadMedida}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${item.estado === 'ACTIVO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-blue-100'}`}>
                    {item.estado}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onView(item)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
