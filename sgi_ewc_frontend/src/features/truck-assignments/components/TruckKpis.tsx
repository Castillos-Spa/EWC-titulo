import React, { useMemo } from 'react';
import { Truck, GaugeCircle, CalendarClock, RefreshCw, Activity } from 'lucide-react';
import { useTruckAssignment } from '../hooks/useTruckAssignment';

interface Props {
  date: string;
  onDateChange: (value: string) => void;
}

const TruckKpis: React.FC<Props> = ({ date, onDateChange }) => {
  const { kpis, assignments, trucks } = useTruckAssignment();

  const day = useMemo(() => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, [date]);

  const dayMetrics = useMemo(() => {
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const activeTrucks = trucks.filter(truck => truck.active).length;
    const plannedAssignments = assignments.filter(assignment => {
      const assignmentDate = assignment.date instanceof Date ? assignment.date : new Date(assignment.date);
      return sameDay(assignmentDate, day);
    });
    const usedTrucks = new Set(plannedAssignments.map(assignment => assignment.truckId));
    const plannedCount = plannedAssignments.length;
    const availableCount = trucks.filter(truck => truck.active && !usedTrucks.has(truck.id)).length;
    const utilization = activeTrucks ? Math.min(100, Math.round((plannedCount / activeTrucks) * 100)) : 0;
    const unassignedDrivers = trucks.filter(truck => truck.active && !usedTrucks.has(truck.id)).length;
    return { plannedCount, availableCount, utilization, unassignedDrivers };
  }, [assignments, trucks, day]);

  const stats = useMemo(
    () => [
      {
        id: 'trucks-total',
        label: 'Flota total',
        value: String(kpis.totalTrucks),
        helper: `${kpis.activeTrucks} activos hoy`,
        accent: 'from-sky-500/25 via-indigo-500/20 to-sky-400/25',
        icon: <Truck className="h-6 w-6" />,
      },
      {
        id: 'trucks-planned',
        label: 'Rutas planificadas',
        value: String(dayMetrics.plannedCount),
        helper: 'Asignaciones confirmadas',
        meta: `${dayMetrics.availableCount} camiones libres`,
        accent: 'from-emerald-500/25 to-teal-500/25',
        icon: <Activity className="h-6 w-6" />,
      },
      {
        id: 'trucks-utilization',
        label: 'Utilización diaria',
        value: `${dayMetrics.utilization}%`,
        helper: `${dayMetrics.unassignedDrivers} pendientes de asignar`,
        meta: `${dayMetrics.availableCount} unidades disponibles`,
        progress: dayMetrics.utilization,
        accent: 'from-amber-500/25 to-orange-500/25',
        icon: <GaugeCircle className="h-6 w-6" />,
      },
    ],
    [dayMetrics, kpis],
  );

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
            <div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
            {stat.meta && <p className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/50">{stat.meta}</p>}
            {typeof stat.progress === 'number' && (
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200/70 dark:bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500"
                  style={{ width: `${Math.min(stat.progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </article>
      ))}

      <article className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/25 via-sky-500/15 to-indigo-400/20" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Fecha de planificación</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
              <CalendarClock className="h-6 w-6" />
            </span>
          </div>
          <div className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Actualizar agenda</div>
          <input
            type="date"
            value={date}
            onChange={event => onDateChange(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
          <div className="flex items-center gap-2 text-xs text-sky-700 dark:text-sky-200/80">
            <RefreshCw className="h-4 w-4" />
            La vista se recalcula automáticamente por fecha.
          </div>
        </div>
      </article>
    </section>
  );
};

export default TruckKpis;
