import React, { useMemo } from 'react';
import { CalendarClock, Package, ShieldCheck, Sparkles, Wrench, ArrowUpRight } from 'lucide-react';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';
import type { Vehiculo } from '../../../types/Vehiculo';
import type { User as AppUser } from '../../../types/User';
import type { MaintenanceStatus, MaintenanceType } from '../context/MaintenanceContext';
import { useIntlFormat } from '../../../app/intl/format';

interface MaintenanceBoardProps {
  records: OrdenTrabajo[];
  vehicles: Vehiculo[];
  users: AppUser[];
  loading: boolean;
  error: string | null;
  onView: (record: OrdenTrabajo) => void;
  onStatusChange: (record: OrdenTrabajo, status: MaintenanceStatus) => void;
}

const statusStyles: Record<MaintenanceStatus, { label: string; badge: string }> = {
  abierta: {
    label: 'Abierta',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  },
  en_progreso: {
    label: 'En progreso',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  },
  pendiente_revision: {
    label: 'Pendiente QA',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200',
  },
  completado: {
    label: 'Completada',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200',
  },
};

const typeStyles: Record<MaintenanceType, string> = {
  Preventivo: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  Correctivo: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200',
  Emergencia: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
};

const MaintenanceBoard: React.FC<MaintenanceBoardProps> = ({
  records,
  vehicles,
  users,
  loading,
  error,
  onView,
  onStatusChange,
}) => {
  const { formatDate, locale } = useIntlFormat();
  const vehicleMap = useMemo(() => new Map(vehicles.map(vehicle => [vehicle.id, vehicle])), [vehicles]);
  const userMap = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);

  const getNextAction = (record: OrdenTrabajo) => {
    if (record.estado === 'abierta') {
      return { label: 'Iniciar intervención', status: 'en_progreso' as MaintenanceStatus };
    }
    if (record.estado === 'en_progreso') {
      return { label: 'Enviar a QA', status: 'pendiente_revision' as MaintenanceStatus };
    }
    if (record.estado === 'pendiente_revision') {
      return { label: 'Marcar completada', status: 'completado' as MaintenanceStatus };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 px-8 py-12 text-center text-sm text-slate-500 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
        Actualizando órdenes de mantenimiento…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200/80 bg-rose-50/80 px-6 py-5 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
        {error}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200/60 bg-white/70 px-8 py-14 text-center text-slate-500 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:text-blue-100/80">
        <Sparkles className="mx-auto mb-4 h-12 w-12 text-slate-400 dark:text-blue-200/60" />
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Sin órdenes con los filtros actuales</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-blue-200/70">
          Crea un nuevo mantenimiento preventivo o ajusta los filtros para revisar el historial completo.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      {records.map(record => {
        const vehicle = vehicleMap.get(record.vehiculoId);
        const mechanic = record.responsableId ? userMap.get(record.responsableId) : undefined;
        const statusConfig = statusStyles[record.estado];
        const type = (record.tipo as MaintenanceType) || 'Preventivo';
        const typeBadge = typeStyles[type] ?? typeStyles.Preventivo;
        const nextAction = getNextAction(record);

        return (
          <article
            key={record.id}
            className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/40 transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_rgba(15,23,42,0.45))]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
                      <Wrench className="h-6 w-6" />
                    </span>
                    <div>
                      <h3 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        OT #{record.id} · {vehicle?.patente ?? 'Vehículo sin patente'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-blue-200/80">{record.description || 'Sin descripción'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${statusConfig.badge}`}>
                      {statusConfig.label}
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${typeBadge}`}>
                      {type}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 text-sm md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Fecha programada</p>
                    <div className="mt-2 flex items-center gap-2 text-slate-700 dark:text-blue-100">
                      <CalendarClock className="h-4 w-4" />
                      <span>{formatDate(record.scheduledDate) || '—'}</span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Último servicio</p>
                    <span className="mt-2 block text-slate-700 dark:text-blue-100">{formatDate(vehicle?.lastMaintenanceDate) || '—'}</span>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Técnico asignado</p>
                    <span className="mt-2 block text-slate-700 dark:text-blue-100">{mechanic?.username ?? 'No asignado'}</span>
                  </div>
                  <div className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-blue-200/70">Costo estimado</p>
                    <span className="mt-2 block text-slate-700 dark:text-blue-100">{
                      new Intl.NumberFormat(locale, { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(record.estimatedCost || 0)
                    }</span>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-600 dark:text-blue-200/80">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Repuestos utilizados</h4>
                    <div className="flex flex-wrap gap-2">
                      {record.repuestos.length > 0 ? (
                        Array.from(new Set(record.repuestos)).map(item => (
                          <span key={item} className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                            <Package className="h-3.5 w-3.5" />
                            {item}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500 dark:text-blue-200/60">No hay repuestos registrados.</span>
                      )}
                    </div>
                  </div>

                  {record.observations && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Observaciones</h4>
                      <p className="leading-relaxed text-slate-600 dark:text-blue-200/80">{record.observations}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:w-52">
                <button
                  type="button"
                  onClick={() => onView(record)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
                >
                  <ArrowUpRight className="h-4 w-4" /> Ver detalle
                </button>
                {nextAction && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(record, nextAction.status)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5"
                  >
                    <ShieldCheck className="h-4 w-4" /> {nextAction.label}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default MaintenanceBoard;
