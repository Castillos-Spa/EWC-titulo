import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Fuel as FuelIcon, Gauge, Plus, Sparkles } from 'lucide-react';
import { FuelProvider, useFuelContext } from '../context/FuelContext';
import FuelLogFormModal from '../../../components/WaterTransport/FuelLogFormModal';
import { useAuth } from '../../../contexts/AuthContext';
import FuelKpis from '../components/FuelKpis';
import FuelFilters from '../components/FuelFilters';
import FuelVehicleCard from '../components/FuelVehicleCard';
import FuelTrendsSparkline from '../components/FuelTrendsSparkline';
import type { VehicleWithFuelHistory } from '../../../utils/fuelApi';

type EfficiencyBadge = 'excellent' | 'good' | 'watch' | 'critical' | 'unknown';

const calculateVehicleMetrics = (vehicle: VehicleWithFuelHistory) => {
  const fuelLogs = (vehicle.fuelLogs ?? []).slice().sort((a, b) => a.odometer - b.odometer);
  if (fuelLogs.length < 2) {
    return { consumption: 0, totalDistance: 0, totalLiters: 0 } as const;
  }

  let totalDistance = 0;
  let totalLiters = 0;
  for (let index = 1; index < fuelLogs.length; index++) {
    const previousLog = fuelLogs[index - 1];
    const currentLog = fuelLogs[index];
    const distance = currentLog.odometer - previousLog.odometer;
    const liters = previousLog.liters;
    if (distance > 0 && liters > 0) {
      totalDistance += distance;
      totalLiters += liters;
    }
  }

  const consumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0;
  return { consumption, totalDistance, totalLiters } as const;
};

const classifyEfficiency = (consumption: number): EfficiencyBadge => {
  if (consumption <= 0) return 'unknown';
  if (consumption < 20) return 'excellent';
  if (consumption < 30) return 'good';
  if (consumption < 40) return 'watch';
  return 'critical';
};

function FuelInnerPage() {
  const { items, loading, error, search, from, to, setSearch, setFrom, setTo, refresh } = useFuelContext();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showFuelForm, setShowFuelForm] = useState(false);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((vehicle) => {
      const target = `${vehicle.patente} ${vehicle.marca} ${vehicle.modelo}`.toLowerCase();
      return target.includes(query);
    });
  }, [items, search]);

  const summaries = useMemo(() => {
    return filtered.map((vehicle) => {
      const metrics = calculateVehicleMetrics(vehicle);
      const efficiency = classifyEfficiency(metrics.consumption);
      const refuelCount = vehicle.fuelLogs?.length ?? 0;
      const vehicleLiters = (vehicle.fuelLogs ?? []).reduce((sum, log) => sum + log.liters, 0);
      return { vehicle, metrics, efficiency, refuelCount, vehicleLiters } as const;
    });
  }, [filtered]);

  const fleetMetrics = useMemo(() => {
    if (summaries.length === 0) {
      return {
        totalDistance: 0,
        totalLiters: 0,
        avgConsumption: 0,
        criticalVehicles: 0,
        monitoredVehicles: 0,
        refuelCount: 0,
      } as const;
    }

    const totalDistance = summaries.reduce((sum, summary) => sum + summary.metrics.totalDistance, 0);
    const totalLiters = summaries.reduce((sum, summary) => sum + summary.vehicleLiters, 0);
    const consumptions = summaries
      .map((summary) => summary.metrics.consumption)
      .filter((value) => value > 0);
    const avgConsumption = consumptions.length > 0 ? consumptions.reduce((sum, value) => sum + value, 0) / consumptions.length : 0;
    const criticalVehicles = summaries.filter((summary) => summary.efficiency === 'critical').length;
    const refuelCount = summaries.reduce((sum, summary) => sum + summary.refuelCount, 0);

    return {
      totalDistance,
      totalLiters,
      avgConsumption,
      criticalVehicles,
      monitoredVehicles: summaries.length,
      refuelCount,
    } as const;
  }, [summaries]);

  const fleetTrendData = useMemo(() => {
    const aggregate = new Map<string, number>();
    for (const summary of summaries) {
      for (const log of summary.vehicle.fuelLogs ?? []) {
        const key = new Date(log.date).toISOString().slice(0, 10);
        aggregate.set(key, (aggregate.get(key) ?? 0) + log.liters);
      }
    }

    return Array.from(aggregate.entries())
      .map(([date, liters]) => ({ date, liters }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [summaries]);

  const ranking = useMemo(() => {
    const valid = summaries.filter((summary) => summary.metrics.consumption > 0);
    if (valid.length === 0) return { best: null, worst: null } as const;
    const sorted = [...valid].sort((a, b) => a.metrics.consumption - b.metrics.consumption);
    const best = sorted[0] ?? null;
    let worst = best;
    for (const candidate of sorted) {
      worst = candidate;
    }
    return { best, worst: worst ?? null } as const;
  }, [summaries]);

  const canRegisterFuel = useMemo(() => {
    if (!user) return false;
    const isDriver = user.roleAssignments?.some((assignment) => assignment.specialty === 'DRIVER');
    const isTransportSupervisor = user.roleAssignments?.some(
      (assignment) => assignment.area === 'Transporte' && (assignment.role === 'Supervisor' || assignment.role === 'Jefe'),
    );
    return Boolean(user.isAdmin || isDriver || isTransportSupervisor);
  }, [user]);

  const handleSuccess = () => {
    setShowFuelForm(false);
    refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
        Sincronizando datos de combustible…
      </div>
    );
  }

  return (
    <div className="space-y-10 text-slate-800 dark:text-slate-100">
      {error && (
        <div className="relative overflow-hidden rounded-3xl border border-rose-200/70 bg-rose-50/80 px-6 py-4 text-rose-700 shadow-sm shadow-rose-200/40 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.25),_rgba(244,63,94,0)_70%)]" />
          <div className="relative flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-emerald-100 px-8 py-6 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-900/10 dark:shadow-slate-900/40">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-400/25 blur-3xl dark:bg-sky-500/20" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <FuelIcon className="h-4 w-4" />
              <span>Panel de combustible</span>
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Visibilidad integral del consumo y eficiencia por vehículo</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">
              Controla cómo evolucionan las cargas, identifica hábitos críticos y acompaña a conductores con recomendaciones claras. Todo bajo el nuevo lenguaje visual del tablero corporativo.
            </p>
            <div className="grid gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70 sm:grid-cols-2">
              {ranking.best ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200/70 bg-white/70 px-4 py-2 text-emerald-600 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <Sparkles className="h-4 w-4" /> Mejor eficiencia: {ranking.best.vehicle.patente} · {ranking.best.metrics.consumption.toFixed(1)} L/100km
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-200/70">
                  <Sparkles className="h-4 w-4" /> Aún sin mediciones suficientes
                </div>
              )}
              {ranking.worst ? (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-200/70 bg-white/70 px-4 py-2 text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
                  <AlertTriangle className="h-4 w-4" /> Vigilancia: {ranking.worst.vehicle.patente} · {ranking.worst.metrics.consumption.toFixed(1)} L/100km
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-2 text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-200/70">
                  <AlertTriangle className="h-4 w-4" /> Sin alertas activas
                </div>
              )}
            </div>
          </div>
          {canRegisterFuel && (
            <button
              type="button"
              onClick={() => setShowFuelForm(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" /> Registrar nueva carga
            </button>
          )}
        </div>
      </section>

      <FuelKpis
        totalDistance={fleetMetrics.totalDistance}
        totalLiters={fleetMetrics.totalLiters}
        avgConsumption={fleetMetrics.avgConsumption}
        monitoredVehicles={fleetMetrics.monitoredVehicles}
        criticalVehicles={fleetMetrics.criticalVehicles}
        refuelCount={fleetMetrics.refuelCount}
      />

      <section className="grid gap-6 lg:grid-cols-5">
        <article className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30 lg:col-span-3">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_rgba(14,165,233,0)_65%)]" />
          <div className="relative flex flex-col gap-4">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">Tendencia de consumo de flota</h2>
                <p className="text-sm text-slate-500 dark:text-blue-200/80">{fleetMetrics.refuelCount > 0 ? `${fleetMetrics.refuelCount.toLocaleString('es-CL')} recargas registradas en el periodo` : 'Sin recargas registradas aún'}.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:bg-white/10 dark:text-blue-200/70">
                <Gauge className="h-3.5 w-3.5" /> {fleetMetrics.avgConsumption > 0 ? `${fleetMetrics.avgConsumption.toFixed(1)} L/100km promedio` : 'A la espera de datos'}
              </span>
            </header>
            <div className="h-52 w-full md:h-60">
              <FuelTrendsSparkline data={fleetTrendData} />
            </div>
          </div>
        </article>
        <div className="grid gap-4 lg:col-span-2">
          <article className="relative overflow-hidden rounded-3xl border border-emerald-200/60 bg-emerald-50/80 px-5 py-4 text-emerald-700 shadow-md shadow-emerald-200/40 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_rgba(20,83,45,0)_75%)]" />
            <div className="relative space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-[0.32em]">Conducción eficiente</h3>
              <p className="text-sm leading-6">
                {ranking.best
                  ? `Mantén la ruta de ${ranking.best.vehicle.patente}. Logra ${ranking.best.metrics.consumption.toFixed(1)} L/100km con ${ranking.best.refuelCount} recarga(s).`
                  : 'Comienza a registrar consumo para premiar a los conductores con mejores registros.'}
              </p>
            </div>
          </article>
          <article className="relative overflow-hidden rounded-3xl border border-rose-200/60 bg-rose-50/80 px-5 py-4 text-rose-700 shadow-md shadow-rose-200/40 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-100">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,63,94,0.25),_rgba(76,5,25,0)_75%)]" />
            <div className="relative space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-[0.32em]">Alertas de consumo</h3>
              <p className="text-sm leading-6">
                {fleetMetrics.criticalVehicles > 0
                  ? `${fleetMetrics.criticalVehicles} vehículo(s) requieren seguimiento. El de mayor consumo es ${ranking.worst?.vehicle.patente ?? 'N/D'}.`
                  : 'Todo el parque opera dentro de los márgenes definidos. Mantén la disciplina de registro.'}
              </p>
            </div>
          </article>
        </div>
      </section>

      <FuelFilters
        search={search}
        from={from}
        to={to}
        total={summaries.length}
        onSearchChange={setSearch}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      <div className="grid gap-6">
        {summaries.map((summary) => (
          <FuelVehicleCard
            key={summary.vehicle.id}
            vehicle={summary.vehicle}
            metrics={summary.metrics}
            isExpanded={Boolean(expanded[summary.vehicle.id])}
            onToggle={() => setExpanded((previous) => ({ ...previous, [summary.vehicle.id]: !previous[summary.vehicle.id] }))}
          />
        ))}
      </div>

      {summaries.length === 0 && (
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 px-6 py-12 text-center shadow-lg shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/30">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(15,23,42,0)_70%)]" />
          <div className="relative space-y-3">
            <AlertTriangle className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No se encontraron vehículos con los criterios actuales</h3>
            <p className="text-sm text-slate-500 dark:text-blue-200/80">Ajusta los filtros o solicita acceso a la flota que necesitas monitorear.</p>
          </div>
        </div>
      )}

      <FuelLogFormModal isOpen={showFuelForm} onClose={() => setShowFuelForm(false)} onSuccess={handleSuccess} vehiclesForDriver={items} />
    </div>
  );
}

export default function FuelPage() {
  return (
    <FuelProvider>
      <FuelInnerPage />
    </FuelProvider>
  );
}
