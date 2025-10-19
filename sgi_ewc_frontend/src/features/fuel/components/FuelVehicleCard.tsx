import React, { useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Fuel, Gauge, MapPin } from 'lucide-react';
import type { FuelLog, VehicleWithFuelHistory } from '../../../utils/fuelApi';
import VehicleFuelSparkline from './VehicleFuelSparkline';

interface FuelVehicleCardProps {
  vehicle: VehicleWithFuelHistory;
  metrics: {
    consumption: number;
    totalDistance: number;
    totalLiters: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
}

const efficiencyTone = (consumption: number) => {
  if (consumption === 0) return { label: 'Sin datos', tone: 'bg-slate-200 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300' };
  if (consumption < 20) return { label: 'Excelente', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100' };
  if (consumption < 30) return { label: 'Óptimo', tone: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-100' };
  if (consumption < 40) return { label: 'Vigilar', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-100' };
  return { label: 'Crítico', tone: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-100' };
};

const getLastRefuel = (logs: FuelLog[]) => {
  if (!logs.length) return null;
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return sorted[0] ?? null;
};

const FuelVehicleCard: React.FC<FuelVehicleCardProps> = ({ vehicle, metrics, isExpanded, onToggle }) => {
  const fuelLogs = useMemo(() => (vehicle.fuelLogs ?? []).slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [vehicle.fuelLogs]);
  const lastRefuel = useMemo(() => getLastRefuel(vehicle.fuelLogs ?? []), [vehicle.fuelLogs]);
  const efficiency = efficiencyTone(metrics.consumption);

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/40 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_rgba(8,47,73,0)_65%)]" />
      <div className="relative flex flex-col gap-6">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onToggle}
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-300/60 bg-white/70 text-slate-600 transition hover:border-sky-400 hover:text-sky-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-sky-400 dark:hover:text-sky-300"
              aria-label={isExpanded ? 'Contraer historial' : 'Expandir historial'}
            >
              {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{vehicle.patente}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-300">{vehicle.marca} · {vehicle.modelo}</p>
              {vehicle.areaAsignada && (
                <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-slate-400 dark:text-blue-200/70">
                  <MapPin className="h-3.5 w-3.5" /> {vehicle.areaAsignada}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] ${efficiency.tone}`}>
              <Gauge className="h-3.5 w-3.5" /> {efficiency.label}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:bg-white/10 dark:text-blue-200/70">
              <Fuel className="h-3.5 w-3.5" /> {metrics.totalLiters.toFixed(1)} L totales
            </span>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="h-32 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/60 p-3 shadow-inner shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-950/40 dark:shadow-none">
              <VehicleFuelSparkline logs={fuelLogs} />
            </div>
          </div>
          <dl className="grid gap-4 md:col-span-2">
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-950/40 dark:shadow-none">
              <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/70">Consumo</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{metrics.consumption > 0 ? `${metrics.consumption.toFixed(1)} L/100km` : 'Sin datos'}</dd>
              <p className="text-xs text-slate-500 dark:text-slate-300">Basado en tramos válidos entre recargas</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-950/40 dark:shadow-none">
              <dt className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/70">Última recarga</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{lastRefuel ? new Date(lastRefuel.date).toLocaleDateString('es-CL') : 'Sin registros'}</dd>
              <p className="text-xs text-slate-500 dark:text-slate-300">{lastRefuel ? `${lastRefuel.liters.toFixed(1)} L a ${lastRefuel.odometer.toLocaleString('es-CL')} km` : 'Registra la primera carga'}</p>
            </div>
          </dl>
        </div>

        {isExpanded && (
          <section className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 p-5 shadow-inner shadow-slate-200/40 dark:border-slate-700 dark:bg-slate-950/50 dark:shadow-none">
            <header className="flex items-center justify-between">
              <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Historial de recargas</h4>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:bg-white/10 dark:text-blue-200/70">
                <AlertTriangle className="h-3.5 w-3.5" /> {fuelLogs.length} registros
              </span>
            </header>
            <div className="grid gap-3">
              {fuelLogs.length > 0 ? (
                fuelLogs
                  .slice()
                  .reverse()
                  .map((log) => (
                    <article
                      key={log.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm shadow-slate-200/40 transition hover:border-sky-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-950/40 dark:shadow-none"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{new Date(log.date).toLocaleDateString('es-CL')}</p>
                          <p className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">{log.driver.username}</p>
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-200">
                          <span>{log.liters.toFixed(1)} L</span>
                          <span>{log.odometer.toLocaleString('es-CL')} km</span>
                          {typeof log.cost === 'number' && (
                            <span>${log.cost.toLocaleString('es-CL')}</span>
                          )}
                        </div>
                      </div>
                      {log.invoiceUrl && (
                        <a
                          href={log.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-600 underline decoration-dotted underline-offset-4 hover:text-sky-500 dark:text-sky-300"
                        >
                          Ver comprobante
                        </a>
                      )}
                    </article>
                  ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-300">Todavía no se registran recargas para este vehículo.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};

export default FuelVehicleCard;
