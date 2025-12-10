import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ClipboardList, Factory, Wrench, X } from 'lucide-react';
import type { Vehiculo } from '../../../types/Vehiculo';
import type { User as AppUser } from '../../../types/User';
import type { CreateTallerWorkOrderPayload } from '../../../utils/tallerApi';
import type { MaintenanceStatus } from '../context/MaintenanceContext';

const STATUS_OPTIONS: MaintenanceStatus[] = ['abierta', 'en_progreso', 'pendiente_revision', 'completado'];
const TYPE_OPTIONS: CreateTallerWorkOrderPayload['tipo'][] = ['Preventivo', 'Correctivo', 'Emergencia'];

type ComposerPayload = CreateTallerWorkOrderPayload & { estado?: MaintenanceStatus };

interface MaintenanceComposerModalProps {
  open: boolean;
  vehicles: Vehiculo[];
  mechanics: AppUser[];
  onClose: () => void;
  onSubmit: (payload: ComposerPayload) => Promise<void>;
}

type FormState = {
  vehiculoId: string;
  tipo: CreateTallerWorkOrderPayload['tipo'];
  estado: MaintenanceStatus;
  description: string;
  scheduledDate: string;
  responsableId: string;
  estimatedCost: string;
  repuestos: string;
  observations: string;
  nextServiceDate: string;
};

const DEFAULT_FORM: FormState = {
  vehiculoId: '',
  tipo: 'Preventivo',
  estado: 'abierta',
  description: '',
  scheduledDate: '',
  responsableId: '',
  estimatedCost: '',
  repuestos: '',
  observations: '',
  nextServiceDate: '',
};

const getIsoDate = (value?: string | Date | null) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const MaintenanceComposerModal: React.FC<MaintenanceComposerModalProps> = ({ open, vehicles, mechanics, onClose, onSubmit }) => {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setForm(DEFAULT_FORM);
      setSubmitting(false);
    }
  }, [open]);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map(vehicle => ({
        value: String(vehicle.id),
        label: `${vehicle.patente} · ${vehicle.marca ?? ''} ${vehicle.modelo ?? ''}`.trim(),
        lastMaintenanceDate: getIsoDate(vehicle.lastMaintenanceDate),
      })),
    [vehicles],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm(prev => {
      if (name === 'vehiculoId') {
        const selected = vehicleOptions.find(option => option.value === value);
        return {
          ...prev,
          vehiculoId: value,
          scheduledDate: selected?.lastMaintenanceDate ?? '',
        };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.vehiculoId || form.description.trim() === '') {
      alert('Selecciona un vehículo y describe la intervención planificada.');
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const toIsoOrUndefined = (value: string) => {
        if (!value) return undefined;
        const isoCandidate = new Date(`${value}T00:00:00Z`).toISOString();
        return isoCandidate;
      };

      const payload: ComposerPayload = {
        vehiculoId: Number(form.vehiculoId),
        tipo: form.tipo,
        description: form.description.trim(),
        responsableId: form.responsableId ? Number(form.responsableId) : undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        scheduledDate: toIsoOrUndefined(form.scheduledDate),
        repuestos: form.repuestos
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
        observations: form.observations.trim() || undefined,
        nextServiceDate: toIsoOrUndefined(form.nextServiceDate),
        estado: form.estado,
      };
      await onSubmit(payload);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/90 dark:shadow-slate-900/60">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.45))]" />
        <form className="relative flex max-h-[90vh] flex-col" onSubmit={handleSubmit}>
          <header className="flex items-start justify-between gap-6 px-8 pt-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
                <ClipboardList className="h-4 w-4" /> Nueva orden de taller
              </span>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Programar mantenimiento</h2>
              <p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
                Define el vehículo, la tipología y los repuestos necesarios para continuar alineando el módulo con el nuevo sistema visual.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white/80 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="mt-6 flex-1 space-y-6 overflow-y-auto px-8 pb-8">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Vehículo</span>
                <select
                  name="vehiculoId"
                  value={form.vehiculoId}
                  onChange={handleChange}
                  required
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <option value="">Selecciona un vehículo</option>
                  {vehicleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tipo de intervención</span>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {TYPE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Estado inicial</span>
                <select
                  name="estado"
                  value={form.estado}
                  onChange={handleChange}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Técnico responsable</span>
                <select
                  name="responsableId"
                  value={form.responsableId}
                  onChange={handleChange}
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                >
                  <option value="">Sin asignar</option>
                  {mechanics.map(mechanic => (
                    <option key={mechanic.id} value={mechanic.id}>
                      {mechanic.username}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Descripción</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Detalle la intervención o el síntoma reportado"
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Fecha programada</span>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                  <input
                    type="date"
                    name="scheduledDate"
                    value={form.scheduledDate}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Próximo servicio</span>
                <div className="relative">
                  <CalendarClock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
                  <input
                    type="date"
                    name="nextServiceDate"
                    value={form.nextServiceDate}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                  />
                </div>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Costo estimado</span>
                <input
                  type="number"
                  name="estimatedCost"
                  value={form.estimatedCost}
                  onChange={handleChange}
                  placeholder="250000"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Repuestos o materiales</span>
                <input
                  type="text"
                  name="repuestos"
                  value={form.repuestos}
                  onChange={handleChange}
                  placeholder="Filtro aceite, Aceite 5W-30"
                  className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Observaciones</span>
              <textarea
                name="observations"
                value={form.observations}
                onChange={handleChange}
                rows={3}
                placeholder="Notas adicionales sobre el estado del vehículo o recordatorios de QA"
                className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
              />
            </label>
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/60 bg-white/70 px-8 py-6 backdrop-blur dark:border-white/10 dark:bg-white/5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">
              <Factory className="h-4 w-4" /> Ordenará automática el flujo dentro de taller.
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Wrench className="h-4 w-4" /> {submitting ? 'Guardando…' : 'Programar orden'}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default MaintenanceComposerModal;
