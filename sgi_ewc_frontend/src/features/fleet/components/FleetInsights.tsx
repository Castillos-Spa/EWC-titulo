import React, { useMemo } from 'react';
import { Truck, CheckCircle2, Wrench, AlertTriangle } from 'lucide-react';
import { useFleetContext } from '../context/FleetContext';

interface StatDescriptor {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  accent: string;
  progress?: number;
}

const FleetInsights: React.FC = () => {
  const { items, loading } = useFleetContext();

  const stats = useMemo<StatDescriptor[]>(() => {
    const total = items.length;
    const available = items.filter(v => v.estado === 'disponible').length;
    const maintenance = items.filter(v => v.estado === 'en_mantenimiento').length;
    const inUse = items.filter(v => v.estado === 'en_uso').length;
    const ninetyDaysAgo = (() => {
      const date = new Date();
      date.setDate(date.getDate() - 90);
      return date;
    })();
    const maintenanceDue = items.filter(v => {
      if (!v.lastMaintenanceDate) return false;
      const last = new Date(v.lastMaintenanceDate);
      return Number.isFinite(last.getTime()) && last < ninetyDaysAgo;
    }).length;

    const operational = total === 0 ? 0 : Math.round(((available + inUse) / total) * 100);

    return [
      {
        id: 'fleet-total',
        label: 'Flota Activa',
        value: String(total),
        helper: `${operational}% operativa`,
        icon: <Truck className="h-6 w-6" />,
        accent: 'from-sky-500/20 to-indigo-500/30',
        progress: operational,
      },
      {
        id: 'fleet-available',
        label: 'Disponibles',
        value: String(available),
        helper: `${available} vehículos listos para asignación`,
        icon: <CheckCircle2 className="h-6 w-6" />,
        accent: 'from-emerald-500/20 to-teal-500/30',
        progress: total === 0 ? 0 : Math.round((available / total) * 100),
      },
      {
        id: 'fleet-maintenance',
        label: 'En mantenimiento',
        value: String(maintenance),
        helper: `${maintenance} intervenciones activas`,
        icon: <Wrench className="h-6 w-6" />,
        accent: 'from-amber-500/25 to-orange-500/30',
        progress: total === 0 ? 0 : Math.round((maintenance / total) * 100),
      },
      {
        id: 'fleet-due',
        label: 'Revisión pendiente',
        value: String(maintenanceDue),
        helper: maintenanceDue > 0 ? 'Planifica nuevas órdenes preventivas' : 'Todo al día',
        icon: <AlertTriangle className="h-6 w-6" />,
        accent: 'from-rose-500/25 to-red-500/30',
        progress: total === 0 ? 0 : Math.min(100, Math.round((maintenanceDue / total) * 100)),
      },
    ];
  }, [items]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map(stat => (
        <article
          key={stat.id}
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
          <div className="relative flex flex-col gap-4 text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
                {stat.label}
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                {stat.icon}
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tight">{loading ? '—' : stat.value}</div>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
                style={{ width: `${loading ? 0 : stat.progress ?? 0}%` }}
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
};

export default FleetInsights;
