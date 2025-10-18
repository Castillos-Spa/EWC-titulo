import React, { useMemo, useState } from 'react';
import { CalendarDays, Route as RouteIcon, Truck, Users } from 'lucide-react';
import { TruckAssignmentProvider } from '../context/TruckAssignmentContext';
import TruckKpis from '../components/TruckKpis';
import TruckAssignmentCards from '../components/TruckAssignmentCards';
import { RouteProvider } from '@features/transport-routes/context/RouteContext';
import { useTruckAssignment } from '../hooks/useTruckAssignment';

const PlannerHero: React.FC<{ date: string }> = ({ date }) => {
  const { assignments, trucks } = useTruckAssignment();
  const targetDay = useMemo(() => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }, [date]);

  const { scheduledRoutes, distinctTrucks } = useMemo(() => {
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const todaysAssignments = assignments.filter(entry => {
      const assignmentDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
      return sameDay(assignmentDate, targetDay);
    });
    const truckIds = new Set(todaysAssignments.map(item => item.truckId));
    return { scheduledRoutes: todaysAssignments.length, distinctTrucks: truckIds.size };
  }, [assignments, targetDay]);

  const activeFleet = useMemo(() => trucks.filter(truck => truck.active).length, [trucks]);
  const freeFleet = Math.max(activeFleet - distinctTrucks, 0);
  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('es-CL', { dateStyle: 'full' }).format(targetDay);
    } catch {
      return targetDay.toISOString().slice(0, 10);
    }
  }, [targetDay]);

  const heroStats = [
    {
      id: 'fleet-available',
      icon: <Truck className="h-5 w-5" />,
      label: 'Flota activa',
      value: activeFleet,
      helper: `${freeFleet} sin asignar`,
      accent: 'from-sky-500/30 via-blue-500/20 to-sky-400/25',
    },
    {
      id: 'scheduled-routes',
      icon: <RouteIcon className="h-5 w-5" />,
      label: 'Rutas planificadas',
      value: scheduledRoutes,
      helper: `${distinctTrucks} camiones en ruta`,
      accent: 'from-emerald-500/25 via-teal-500/20 to-emerald-400/25',
    },
    {
      id: 'team-ready',
      icon: <Users className="h-5 w-5" />,
      label: 'Conductores listos',
      value: trucks.length ? `${Math.round((distinctTrucks / Math.max(trucks.length, 1)) * 100)}%` : '0%',
      helper: 'Asignaciones con conductor',
      accent: 'from-amber-500/25 via-orange-500/20 to-amber-400/25',
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-4xl border border-slate-200/60 bg-white/80 px-6 py-8 text-slate-900 shadow-[0_20px_60px_-20px_rgba(30,64,175,0.25)] backdrop-blur-lg dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-32 right-10 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-50/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 dark:border-sky-300/30 dark:bg-sky-500/10 dark:text-sky-200">
            <CalendarDays className="h-4 w-4" />
            Planificación de rutas
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Agenda logística del {formattedDate}</h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Coordina camiones, conductores y rutas con una vista centralizada. Gestiona asignaciones, detecta disponibilidad y
              ajusta la capacidad antes de que comience la jornada.
            </p>
          </div>
        </div>
        <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
          {heroStats.map(stat => (
            <article
              key={stat.id}
              className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-4 py-3 shadow-lg shadow-slate-200/40 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
              <div className="relative space-y-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-slate-100">
                  {stat.icon}
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</p>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{stat.value}</p>
                </div>
                <p className="text-xs text-slate-500 dark:text-blue-200/70">{stat.helper}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const TruckAssignmentPage: React.FC = () => {
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0,10);
  });
  const refDay = useMemo(() => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
  }, [date]);
  return (
    <RouteProvider>
      <TruckAssignmentProvider>
        <div className="space-y-6">
          <PlannerHero date={date} />
          <TruckKpis date={date} onDateChange={setDate} />
          <TruckAssignmentCards refDay={refDay} />
        </div>
      </TruckAssignmentProvider>
    </RouteProvider>
  );
};

export default TruckAssignmentPage;
