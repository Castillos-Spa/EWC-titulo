import React, { useMemo } from 'react';
import { AlertTriangle, Gauge, Fuel, Route, TrendingUp } from 'lucide-react';

interface FuelKpisProps {
  totalDistance: number;
  totalLiters: number;
  avgConsumption: number;
  monitoredVehicles: number;
  criticalVehicles: number;
  refuelCount: number;
}

interface KpiDescriptor {
  id: string;
  label: string;
  helper: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}

const FuelKpis: React.FC<FuelKpisProps> = ({ totalDistance, totalLiters, avgConsumption, monitoredVehicles, criticalVehicles, refuelCount }) => {
  const stats = useMemo<KpiDescriptor[]>(() => [
    {
      id: 'fuel-distance',
      label: 'Distancia acumulada',
      value: `${totalDistance.toLocaleString('es-CL')} km`,
      helper: `${refuelCount.toLocaleString('es-CL')} recargas registradas`,
      icon: <Route className="h-6 w-6" />,
      accent: 'from-sky-500/25 via-indigo-500/25 to-sky-400/25',
    },
    {
      id: 'fuel-liters',
      label: 'Litros despachados',
      value: `${totalLiters.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`,
      helper: 'Integrado con reportes de ruta',
      icon: <TrendingUp className="h-6 w-6" />,
      accent: 'from-emerald-500/25 to-teal-500/25',
    },
    {
      id: 'fuel-consumption',
      label: 'Consumo promedio',
      value: `${avgConsumption.toFixed(1)} L/100km`,
      helper: avgConsumption > 0 ? 'Basado en tramos válidos' : 'Aún sin mediciones válidas',
      icon: <Gauge className="h-6 w-6" />,
      accent: 'from-blue-500/25 to-cyan-500/25',
    },
    {
      id: 'fuel-critical',
      label: 'Vehículos críticos',
      value: `${criticalVehicles}`,
      helper: criticalVehicles > 0 ? 'Prioriza revisión de hábitos' : 'Sin alertas por ahora',
      icon: <AlertTriangle className="h-6 w-6" />,
      accent: 'from-rose-500/25 to-amber-500/25',
    },
    {
      id: 'fuel-monitored',
      label: 'Vehículos monitoreados',
      value: `${monitoredVehicles}`,
      helper: 'Activos con telemetría de combustible',
      icon: <Fuel className="h-6 w-6" />,
      accent: 'from-amber-500/25 to-orange-500/25',
    },
  ], [totalDistance, refuelCount, totalLiters, avgConsumption, criticalVehicles, monitoredVehicles]);

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {stats.map((stat) => (
        <article
          key={stat.id}
          className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/30"
        >
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
          <div className="relative flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</span>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
                {stat.icon}
              </span>
            </div>
            <div className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value}</div>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
          </div>
        </article>
      ))}
    </section>
  );
};

export default FuelKpis;
