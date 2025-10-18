import React, { useEffect, useMemo, useState } from 'react';
import { X, Truck, Car } from 'lucide-react';
import { useFleetContext } from '../context/FleetContext';
import type { CreateVehiculoPayload } from '../../../utils/tallerApi';

type VehicleType = 'camion' | 'camioneta';

const FleetVehicleModal: React.FC = () => {
  const { showForm, editing, closeForm, create, update } = useFleetContext();
  const [vehicleType, setVehicleType] = useState<VehicleType>('camion');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!showForm) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeForm();
    };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [showForm, closeForm]);

  useEffect(() => {
    if (!showForm) return;
    const nextType: VehicleType = (() => {
      if (!editing) return 'camion';
      const raw = editing.tipo?.toLowerCase() ?? '';
      if (raw.includes('camioneta')) return 'camioneta';
      if (raw.includes('camion')) return 'camion';
      return editing.capacidad > 0 ? 'camion' : 'camioneta';
    })();
    setVehicleType(nextType);
  }, [editing, showForm]);

  const modalTitle = useMemo(() => {
    if (editing) return `Editar ${editing.patente}`;
    return 'Registrar nuevo vehículo';
  }, [editing]);

  let submitLabel = 'Registrar vehículo';
  if (editing) submitLabel = 'Actualizar ficha';
  if (submitting) submitLabel = 'Guardando…';

  const toInputDate = (value: string | Date | null | undefined) => {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
  };

  const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500';
  const labelCls = 'mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70';

  if (!showForm) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const getStr = (key: string, fallback = ''): string => {
      const value = fd.get(key);
      return typeof value === 'string' ? value.trim() : fallback;
    };
    const getNum = (key: string): number | undefined => {
      const raw = fd.get(key);
      if (typeof raw !== 'string' || raw.trim() === '') return undefined;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : undefined;
    };

    const estado = getStr('estado') as CreateVehiculoPayload['estado'];
    const maintenanceRaw = getStr('lastMaintenanceDate');

    const basePayload: CreateVehiculoPayload = {
      patente: getStr('patente'),
      marca: getStr('marca'),
      modelo: getStr('modelo'),
      tipo: vehicleType === 'camion' ? 'Camion' : 'Camioneta',
      capacidad: vehicleType === 'camion' ? (getNum('capacidad') ?? 0) : 0,
      odometro: getNum('odometro') ?? 0,
      estado,
      areaAsignada: getStr('area'),
      codigo: getStr('codigo'),
      lastMaintenanceDate: maintenanceRaw ? new Date(maintenanceRaw).toISOString() : undefined,
    };

    if (!basePayload.patente || !basePayload.marca || !basePayload.modelo) {
      setFormError('Completa los campos obligatorios.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      if (editing) {
        await update(editing.id, basePayload);
      } else {
        await create(basePayload);
        form.reset();
      }
    } catch (error) {
      console.error(error);
      setFormError('No pudimos guardar la ficha. Inténtalo nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-8 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_rgba(191,219,254,0.08))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.25),_rgba(15,23,42,0.4))]" />
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/70">
              {editing ? 'Actualización' : 'Nuevo registro'}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{modalTitle}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">
              Documenta especificaciones clave y mantén control del ciclo de vida de cada unidad de la flota.
            </p>
          </div>
          <button
            type="button"
            onClick={closeForm}
            className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative mt-8 space-y-6">
          <fieldset className="space-y-3 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Tipo de vehículo</legend>
            <div className="flex flex-wrap gap-3">
              <label className={`flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-600 transition ${vehicleType === 'camion' ? 'border-sky-300 bg-white/90 shadow-sm shadow-sky-200/40 dark:border-sky-500/40 dark:bg-white/10 dark:text-white' : 'border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-blue-100'}`}>
                <input
                  type="radio"
                  name="vehicleType"
                  value="camion"
                  checked={vehicleType === 'camion'}
                  onChange={() => setVehicleType('camion')}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-400"
                />
                <span className="inline-flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Camión cisterna
                </span>
              </label>
              <label className={`flex items-center gap-3 rounded-2xl border px-4 py-2 text-sm font-semibold text-slate-600 transition ${vehicleType === 'camioneta' ? 'border-sky-300 bg-white/90 shadow-sm shadow-sky-200/40 dark:border-sky-500/40 dark:bg-white/10 dark:text-white' : 'border-slate-200 bg-white/60 dark:border-white/10 dark:bg-white/5 dark:text-blue-100'}`}>
                <input
                  type="radio"
                  name="vehicleType"
                  value="camioneta"
                  checked={vehicleType === 'camioneta'}
                  onChange={() => setVehicleType('camioneta')}
                  className="h-4 w-4 text-sky-500 focus:ring-sky-400"
                />
                <span className="inline-flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Camioneta de apoyo
                </span>
              </label>
            </div>
          </fieldset>

          {formError && (
            <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">
              {formError}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="patente" className={labelCls}>Placa patente</label>
              <input
                id="patente"
                name="patente"
                defaultValue={editing?.patente}
                placeholder="TK-004"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="marca" className={labelCls}>Marca</label>
              <input
                id="marca"
                name="marca"
                defaultValue={editing?.marca}
                placeholder="Volvo"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="modelo" className={labelCls}>Modelo</label>
              <input
                id="modelo"
                name="modelo"
                defaultValue={editing?.modelo}
                placeholder="FMX"
                className={inputCls}
                required
              />
            </div>
            {vehicleType === 'camion' && (
              <div>
                <label htmlFor="capacidad" className={labelCls}>Capacidad (litros)</label>
                <input
                  id="capacidad"
                  name="capacidad"
                  type="number"
                  min={0}
                  defaultValue={editing?.capacidad ?? ''}
                  placeholder="30000"
                  className={inputCls}
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="odometro" className={labelCls}>Odómetro (km)</label>
              <input
                id="odometro"
                name="odometro"
                type="number"
                min={0}
                defaultValue={editing?.odometro ?? 0}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label htmlFor="estado" className={labelCls}>Estado operativo</label>
              <select id="estado" name="estado" defaultValue={editing?.estado ?? 'disponible'} className={inputCls}>
                <option value="disponible">Disponible</option>
                <option value="en_mantenimiento">En mantenimiento</option>
                <option value="inactivo">Inactivo</option>
                <option value="en_uso">En uso</option>
              </select>
            </div>
            <div>
              <label htmlFor="area" className={labelCls}>Área asignada</label>
              <input
                id="area"
                name="area"
                defaultValue={editing?.areaAsignada ?? ''}
                placeholder="Transporte"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="codigo" className={labelCls}>Conductor / responsable</label>
              <input
                id="codigo"
                name="codigo"
                defaultValue={editing?.codigo ?? ''}
                placeholder="ID o nombre"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="lastMaintenanceDate" className={labelCls}>Último mantenimiento</label>
              <input
                id="lastMaintenanceDate"
                name="lastMaintenanceDate"
                type="date"
                defaultValue={toInputDate(editing?.lastMaintenanceDate)}
                className={inputCls}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 text-sm dark:border-white/10 md:flex-row md:justify-end">
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 font-semibold text-slate-600 transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 ${submitting ? 'opacity-60' : ''}`}
              disabled={submitting}
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FleetVehicleModal;
