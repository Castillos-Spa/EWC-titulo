import type { StockMovement } from '../types';

interface Props {
  data: StockMovement[];
  loading?: boolean;
}

export default function MovementsTable({ data, loading }: Readonly<Props>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50/80 text-left text-slate-500 dark:bg-white/10 dark:text-blue-100">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium text-right">Cantidad</th>
            <th className="px-4 py-3 font-medium">Motivo</th>
            <th className="px-4 py-3 font-medium">Usuario</th>
            <th className="px-4 py-3 font-medium text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Cargando…</td></tr>}
          {!loading && data.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-500">Sin movimientos</td></tr>}
          {!loading && data.map(m => (
            <tr key={m.id} className="border-t border-slate-100/70 text-slate-700 dark:border-white/10 dark:text-blue-100">
              <td className="px-4 py-3">{new Date(m.fecha).toLocaleString()}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${m.tipo === 'INGRESO' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                  {m.tipo}
                </span>
              </td>
              <td className="px-4 py-3 text-right">{m.cantidad}</td>
              <td className="px-4 py-3">{m.motivo}</td>
              <td className="px-4 py-3">{m.usuario}</td>
              <td className="px-4 py-3 text-right">{m.saldoPosterior}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
