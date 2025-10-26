import React, { useMemo } from 'react';
import { Filter, Search, Truck, Wrench, AlertTriangle, Radio } from 'lucide-react';
import type { Vehiculo } from '../../../types/Vehiculo';
import { useFleetContext } from '../context/FleetContext';
import { useIntlFormat } from '../../../app/intl/format';

const statusConfig: Record<Vehiculo['estado'], { label: string; badge: string; icon: React.ReactNode }> = {
  disponible: {
    label: 'Disponible',
    badge: 'bg-emerald-100 text-emerald-700 shadow-inner shadow-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-200',
    icon: <Radio className="h-3.5 w-3.5" />,
  },
  en_mantenimiento: {
    label: 'En mantenimiento',
    badge: 'bg-amber-100 text-amber-700 shadow-inner shadow-amber-200/70 dark:bg-amber-500/15 dark:text-amber-200',
    icon: <Wrench className="h-3.5 w-3.5" />,
  },
  inactivo: {
    label: 'Inactivo',
    badge: 'bg-rose-100 text-rose-700 shadow-inner shadow-rose-200/70 dark:bg-rose-500/15 dark:text-rose-200',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
  en_uso: {
    label: 'En uso',
    badge: 'bg-sky-100 text-sky-700 shadow-inner shadow-sky-200/70 dark:bg-sky-500/15 dark:text-sky-200',
    icon: <Truck className="h-3.5 w-3.5" />,
  },
};

const formatKm = (km: number | undefined | null) => {
  if (!km && km !== 0) return '—';
  return `${km.toLocaleString()} km`;
};

const FleetDirectory: React.FC = () => {
  const { items, loading, error, search, setSearch, openEdit } = useFleetContext();


  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(vehicle => {
      const haystack = [
        vehicle.patente,
        vehicle.marca,
        vehicle.modelo,
        vehicle.areaAsignada,
        vehicle.codigo,
      ]
        .map(part => (part ?? '').toString().toLowerCase())
        .join(' ');
      return haystack.includes(query);
    });
  }, [items, search]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_rgba(191,219,254,0.05))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.2),_rgba(15,23,42,0.4))]" />
      <div className="relative space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <Truck className="h-4 w-4" />
              <span>Directorio de flota</span>
            </span>
            <p className="text-sm text-slate-500 dark:text-blue-200/70">
              Explora el parque vehicular, revisa mantenimientos recientes y accede a la ficha de cada unidad.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar placas, marcas o responsables"
                className="w-72 rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500"
              />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              <Filter className="h-4 w-4" />
              Filtros rápidos
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {loading && (
            <div className="rounded-2xl border border-slate-200/60 bg-white/70 px-4 py-8 text-center text-sm text-slate-500 shadow-inner dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
              Cargando vehículos...
            </div>
          )}

          {!loading && filtered.map(vehicle => (
            <FleetCard key={vehicle.id} vehicle={vehicle} onEdit={() => openEdit(vehicle)} />
          ))}
        </div>

        {!loading && filtered.length === 0 && !error && (
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 px-8 py-12 text-center text-slate-500 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
            <Truck className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-blue-200/60" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Sin resultados</h3>
            <p className="mt-2 text-sm">
              Ajusta la búsqueda o registra una nueva unidad para verla en el directorio.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

const FleetCard: React.FC<{ vehicle: Vehiculo; onEdit: () => void }> = ({ vehicle, onEdit }) => {
  const { formatDate } = useIntlFormat();
  const status = statusConfig[vehicle.estado] ?? statusConfig.disponible;
  const typeBadge = vehicle.tipo ? vehicle.tipo.toLowerCase() : 'Vehículo';

  return (
    <article className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.14),_transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_60%)]" />
      <div className="relative flex flex-col gap-6 text-slate-800 dark:text-slate-100 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-sky-600 shadow-inner shadow-sky-200/70 dark:from-sky-500/30 dark:to-indigo-500/30 dark:text-blue-100">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{vehicle.patente}</h3>
                  <span className="rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">
                    {typeBadge}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">
                  {vehicle.marca} {vehicle.modelo} • Capacidad {vehicle.capacidad?.toLocaleString() ?? '0'} L
                </p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${status.badge}`}>
              {status.icon}
              {status.label}
            </span>
          </div>

          <dl className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Kilometraje</dt>
              <dd className="mt-1 text-base font-semibold text-slate-800 dark:text-white">{formatKm(vehicle.odometro)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Área asignada</dt>
              <dd className="mt-1 text-base font-semibold text-slate-800 dark:text-white">{vehicle.areaAsignada || 'Por asignar'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Conductor</dt>
              <dd className="mt-1 text-base font-semibold text-slate-800 dark:text-white">{vehicle.codigo || 'Pendiente'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Último mantenimiento</dt>
              <dd className="mt-1 text-base font-semibold text-slate-800 dark:text-white">{formatDate(vehicle.lastMaintenanceDate)}</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
          >
            Ver ficha
          </button>
        </div>
      </div>
    </article>
  );
};

export default FleetDirectory;
