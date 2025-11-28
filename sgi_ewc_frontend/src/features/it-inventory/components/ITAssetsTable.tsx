import type { ITAsset } from '../types';
import { Laptop, Monitor, Mouse, KeySquare, Server, Printer, HardDrive } from 'lucide-react';

function iconFor(cat: ITAsset['categoria']) {
  switch (cat) {
    case 'Laptop': return Laptop;
    case 'Monitor': return Monitor;
    case 'Licencia': return KeySquare;
    case 'Periférico': return Mouse;
    case 'Servidor': return Server;
    case 'Impresora': return Printer;
    case 'Desktop': return HardDrive;
    default: return Laptop;
  }
}

interface Props {
  assets: ITAsset[];
  loading?: boolean;
  onSelect: (asset: ITAsset) => void;
}

export default function ITAssetsTable({ assets, loading, onSelect }: Readonly<Props>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500 dark:bg-white/10 dark:text-blue-100">
          <tr>
            <th className="px-4 py-3 font-medium">Asset Tag</th>
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Ubicación</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Asignado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Cargando…</td></tr>}
          {!loading && assets.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Sin activos</td></tr>}
          {!loading && assets.map(a => {
            const Icon = iconFor(a.categoria);
            return (
              <tr key={a.id} className="border-t border-slate-100/70 text-slate-700 dark:border-white/10 dark:text-blue-100">
                <td className="px-4 py-3 font-mono text-xs">{a.assetTag}</td>
                <td className="px-4 py-3 flex items-center gap-2"><Icon className="h-4 w-4 text-slate-400" /> {a.nombre}</td>
                <td className="px-4 py-3">{a.categoria}</td>
                <td className="px-4 py-3">{a.ubicacion}</td>
                <td className="px-4 py-3">
                  {(() => {
                    let cls: string;
                    switch (a.estado) {
                      case 'EN_STOCK':
                        cls = 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-blue-100';
                        break;
                      case 'ASIGNADO':
                        cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
                        break;
                      case 'EN_REPARACION':
                        cls = 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
                        break;
                      case 'RETIRADO':
                        cls = 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
                        break;
                      default:
                        cls = 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-blue-100';
                    }
                    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{a.estado}</span>;
                  })()}
                </td>
                <td className="px-4 py-3 text-xs">{a.asignadoA ?? '-'}</td>
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onSelect(a)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-white/20 dark:text-blue-100 dark:hover:bg-white/10">Ver</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
