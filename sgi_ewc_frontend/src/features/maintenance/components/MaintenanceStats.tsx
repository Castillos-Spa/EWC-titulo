import React, { useMemo } from 'react';
import { Wrench, CalendarClock, ShieldCheck, DollarSign } from 'lucide-react';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';
import { useIntlFormat } from '../../../app/intl/format';

interface MaintenanceStatsProps {
  records: OrdenTrabajo[];
  loading: boolean;
}

const MaintenanceStats: React.FC<MaintenanceStatsProps> = ({ records, loading }) => {
  const { locale } = useIntlFormat();
  const stats = useMemo(() => {
    const today = new Date();
    const active = records.filter(record => record.estado !== 'completado');
    const inProgress = active.filter(record => record.estado === 'en_progreso').length;
    const pendingReview = records.filter(record => record.estado === 'pendiente_revision').length;
    const scheduled = records.filter(record => {
      if (!record.scheduledDate || record.estado === 'completado') return false;
      const scheduledDate = new Date(record.scheduledDate);
      return !Number.isNaN(scheduledDate.getTime()) && scheduledDate >= today;
    }).length;
    const overdue = records.filter(record => {
      if (!record.scheduledDate || record.estado === 'completado') return false;
      const scheduledDate = new Date(record.scheduledDate);
      return !Number.isNaN(scheduledDate.getTime()) && scheduledDate < today;
    }).length;
  const totalCost = records.reduce((acc, record) => acc + (record.estimatedCost || 0), 0);

    return [
      {
        id: 'maintenance-active',
        label: 'Órdenes activas',
        value: active.length,
  helper: `${inProgress} en progreso`,
        icon: <Wrench className="h-6 w-6" />,
        accent: 'from-sky-500/30 to-indigo-500/20',
      },
      {
        id: 'maintenance-scheduled',
        label: 'Programadas',
        value: scheduled,
        helper: overdue > 0 ? `${overdue} vencidas` : 'Sin atrasos',
        icon: <CalendarClock className="h-6 w-6" />,
        accent: 'from-emerald-500/25 to-teal-500/20',
      },
      {
        id: 'maintenance-review',
        label: 'Pendiente QA',
        value: pendingReview,
        helper: pendingReview > 0 ? 'Requieren revisión final' : 'Todo revisado',
        icon: <ShieldCheck className="h-6 w-6" />,
        accent: 'from-purple-500/25 to-pink-500/20',
      },
      {
        id: 'maintenance-cost',
        label: 'Costo acumulado',
  value: totalCost > 0 ? new Intl.NumberFormat(locale, { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(totalCost) : '$0',
  helper: totalCost > 0 ? 'Presupuesto ejecutado' : 'Sin gastos registrados',
        icon: <DollarSign className="h-6 w-6" />,
        accent: 'from-amber-500/25 to-orange-500/20',
      },
    ];
  }, [records, locale]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map(stat => (
        <article
          key={stat.id}
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                {stat.icon}
              </span>
            </div>
            <div className="text-3xl font-semibold tracking-tight">{loading ? '—' : stat.value}</div>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{loading ? 'Actualizando métricas…' : stat.helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default MaintenanceStats;
