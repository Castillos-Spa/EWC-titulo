import React, { useMemo } from 'react';
import { ShieldCheck, ClipboardList, CalendarClock, Package, Wrench, X } from 'lucide-react';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';
import type { Vehiculo } from '../../../types/Vehiculo';
import type { User as AppUser } from '../../../types/User';
import type { MaintenanceStatus, MaintenanceType } from '../context/MaintenanceContext';
import { useIntlFormat } from '../../../app/intl/format';
import { useLanguage } from '../../../contexts/LanguageContext';

interface MaintenanceDetailModalProps {
  record: OrdenTrabajo | null;
  vehicles: Vehiculo[];
  users: AppUser[];
  onClose: () => void;
}

const statusCopy: Record<MaintenanceStatus, { label: string; description: string }> = {
  abierta: {
    label: 'Abierta',
    description: 'Orden registrada y pendiente de asignación o inicio.',
  },
  en_progreso: {
    label: 'En progreso',
    description: 'Intervención en ejecución por el equipo técnico.',
  },
  pendiente_revision: {
    label: 'Pendiente QA',
    description: 'A la espera de revisión y cierre de calidad.',
  },
  completado: {
    label: 'Completada',
    description: 'La intervención fue realizada y validada por QA.',
  },
};

const typeLabels: Record<MaintenanceType, string> = {
  Preventivo: 'Preventivo',
  Correctivo: 'Correctivo',
  Emergencia: 'Emergencia',
};

const MaintenanceDetailModal: React.FC<MaintenanceDetailModalProps> = ({ record, vehicles, users, onClose }) => {
  const { formatDateTime, locale } = useIntlFormat();
  const { t } = useLanguage();
  const vehicleMap = useMemo(() => new Map(vehicles.map(vehicle => [vehicle.id, vehicle])), [vehicles]);
  const userMap = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);

  if (!record) return null;

  const vehicle = vehicleMap.get(record.vehiculoId);
  const mechanic = record.responsableId ? userMap.get(record.responsableId) : undefined;
  const statusInfo = statusCopy[record.estado];
  const type = (record.tipo as MaintenanceType) || 'Preventivo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/60 bg-white/95 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:shadow-slate-900/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(165,243,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.22),_rgba(15,23,42,0.45))]" />
        <div className="relative flex max-h-[90vh] flex-col">
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <ClipboardList className="h-4 w-4" /> {t('maintenance.detail')}
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                OT #{record.id} · {vehicle?.patente ?? t('maintenance.noVehicle')}
              </h2>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">{t('maintenance.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-8 pb-8 text-sm text-slate-600 dark:text-blue-200/80">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.currentStatus')}</p>
                <div className="mt-2 flex flex-col gap-1">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-200">
                    <ShieldCheck className="h-3.5 w-3.5" /> {statusInfo.label}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-blue-200/70">{statusInfo.description}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.interventionType')}</p>
                <p className="mt-2 text-base font-semibold text-slate-700 dark:text-blue-100">{typeLabels[type]}</p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.vehicle')}</p>
                <p className="mt-2 text-base font-semibold text-slate-700 dark:text-blue-100">{vehicle?.patente ?? t('maintenance.noVehicle')}</p>
                <p className="text-xs text-slate-500 dark:text-blue-200/70">{vehicle?.marca} {vehicle?.modelo}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.responsibleTechnician')}</p>
                <p className="mt-2 text-base font-semibold text-slate-700 dark:text-blue-100">{mechanic?.username ?? t('maintenance.notAssigned')}</p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.scheduleBlock')}</p>
                <div className="mt-2 space-y-2">
                  <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {t('maintenance.scheduledAt')}: {formatDateTime(record.scheduledDate)}</p>
                  <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {t('maintenance.lastUpdate')}: {formatDateTime(record.updatedAt)}</p>
                  <p className="flex items-center gap-2"><CalendarClock className="h-4 w-4" /> {t('maintenance.createdAt')}: {formatDateTime(record.createdAt)}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.cost')}</p>
                <p className="mt-2 text-base font-semibold text-slate-700 dark:text-blue-100">{
                  new Intl.NumberFormat(locale, { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(record.estimatedCost || 0)
                }</p>
              </div>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('common.description')}</p>
              <p className="mt-2 leading-relaxed text-slate-600 dark:text-blue-200/80">{record.description || t('maintenance.noDescription')}</p>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('maintenance.partsUsed')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {record.repuestos.length > 0 ? (
                  Array.from(new Set(record.repuestos)).map(item => (
                    <span key={item} className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-200">
                      <Package className="h-3.5 w-3.5" />
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 dark:text-blue-200/70">{t('maintenance.noParts')}</span>
                )}
              </div>
            </section>

            {record.observations && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{t('cleaning.observations')}</p>
                <p className="mt-2 leading-relaxed text-slate-600 dark:text-blue-200/80">{record.observations}</p>
              </section>
            )}

            {record.tareas?.length ? (
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tareas asociadas</p>
                <ul className="space-y-2 text-slate-600 dark:text-blue-200/80">
                  {record.tareas.map(task => (
                    <li key={task} className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-sky-500" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-white/60 bg-white/70 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              <X className="h-4 w-4" /> {t('common.close')}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetailModal;
