import { InventoryItem } from '../types';

interface Props {
  items: InventoryItem[];
  onAdjust: (item: InventoryItem) => void;
}

export default function InventoryTable({ items, onAdjust }: Readonly<Props>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50/70 dark:bg-white/5">
          <tr className="text-left text-slate-600 dark:text-blue-100">
            <th className="px-4 py-3">SKU</th>
            <th className="px-4 py-3">Nombre</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Ubicación</th>
            <th className="px-4 py-3">Stock</th>
            <th className="px-4 py-3">Mínimo</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id} className="border-t border-slate-100/80 dark:border-white/5 text-slate-800 dark:text-slate-100">
              <td className="px-4 py-3 font-mono text-xs">{it.sku}</td>
              <td className="px-4 py-3">{it.nombre}</td>
              <td className="px-4 py-3">{it.categoria}</td>
              <td className="px-4 py-3">{it.ubicacion}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium ${it.stockActual <= it.stockMinimo ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'}`}>
                  {it.stockActual} {it.unidadMedida}
                </span>
              </td>
              <td className="px-4 py-3">{it.stockMinimo}</td>
              <td className="px-4 py-3">{it.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}</td>
              <td className="px-4 py-3 text-right">
                <button
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                  onClick={() => onAdjust(it)}
                >Ajustar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="p-6 text-center text-sm text-slate-600 dark:text-blue-100/80">Sin resultados.</div>
      )}
    </div>
  );
}
