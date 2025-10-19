import React from 'react';
import { Navigation, MapPin, Compass, Activity } from 'lucide-react';
import { useRouteContext } from '../context/useRouteContext';

const numberFmt = (n: number, digits = 0) => n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

const RouteKPIs: React.FC = () => {
  const { kpis } = useRouteContext();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Total Rutas"
        description="Carpetas activas en el prototipo"
        icon={<Navigation className="h-5 w-5" />}
        value={numberFmt(kpis.total)}
        gradient="from-sky-500/80 to-indigo-500/80"
      />
      <KpiCard
        title="Distancia Total (km)"
        description="Kilómetros planificados acumulados"
        icon={<MapPin className="h-5 w-5" />}
        value={numberFmt(kpis.totalDistance)}
        gradient="from-emerald-500/80 to-teal-500/80"
      />
      <KpiCard
        title="Distancia Promedio (km)"
        description="Promedio de los trayectos cargados"
        icon={<Compass className="h-5 w-5" />}
        value={numberFmt(kpis.avgDistance, 1)}
        gradient="from-amber-500/80 to-orange-500/80"
      />
      <KpiCard
        title="% Activas"
        description="Rutas disponibles para despacho"
        icon={<Activity className="h-5 w-5" />}
        value={`${numberFmt(kpis.activePct, 0)}%`}
        gradient="from-fuchsia-500/80 to-purple-500/80"
        progress={kpis.activePct}
      />
    </div>
  );
};

const KpiCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  value: React.ReactNode;
  gradient: string;
  progress?: number;
}> = ({ title, description, icon, value, gradient, progress }) => (
  <article className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-5 text-slate-700 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:text-white">
    <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-20`} />
    <div className="relative flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{title}</p>
          <p className="mt-1 text-[0.7rem] text-slate-500/80 dark:text-blue-200/60">{description}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-slate-700 shadow-md shadow-slate-200/60 dark:bg-white/10 dark:text-white">
          {icon}
        </span>
      </header>
      <div className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</div>
      {typeof progress === 'number' && (
        <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  </article>
);

export default RouteKPIs;
