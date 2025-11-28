import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Fuel,
  Gauge,
  DollarSign,
  Save,
  Sparkles,
  CalendarCheck,
  CarFront,
  ClipboardList,
} from 'lucide-react';
import { createFuelLog, type CreateFuelLogPayload, type VehicleWithFuelHistory } from '../../../utils/fuelApi';
import { useAuth } from '../../../contexts/AuthContext';
import { getVehiculosFromTaller } from '../../../utils/tallerApi';
import { useIntlFormat } from '../../../app/intl/format';

interface FuelLogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  vehiclesForDriver: VehicleWithFuelHistory[];
}

type VehicleOption = { id: number; patente: string; marca: string; modelo: string };

const FuelLogFormModal: React.FC<FuelLogFormModalProps> = ({ isOpen, onClose, onSuccess, vehiclesForDriver }) => {
  const { user } = useAuth();
  const { locale } = useIntlFormat();
  const [formData, setFormData] = useState<Partial<CreateFuelLogPayload>>({
    date: new Date().toISOString().split('T')[0],
  });
  const [vehicleList, setVehicleList] = useState<VehicleOption[]>(
    (vehiclesForDriver || []).map(v => ({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVehicle = useMemo(() => {
    if (!formData.vehiculoId) return null;
    return vehicleList.find((v) => String(v.id) === String(formData.vehiculoId)) ?? null;
  }, [formData.vehiculoId, vehicleList]);

  useEffect(() => {
    const isManager = user?.roleAssignments?.some(ra => ra.role === 'Admin' || (ra.area === 'Transporte' && ra.role === 'Supervisor'));

    async function fetchAllVehicles() {
      if (isOpen && isManager) {
        try {
          const allVehicles = await getVehiculosFromTaller();
          setVehicleList(allVehicles.map(v => ({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo })));
        } catch (e) {
          console.error('Failed to fetch all vehicles for modal', e);
          setError('No se pudo cargar la lista completa de vehículos.');
        }
      } else {
        setVehicleList((vehiclesForDriver || []).map(v => ({ id: v.id, patente: v.patente, marca: v.marca, modelo: v.modelo })));
      }
    }

    fetchAllVehicles();

    if (vehiclesForDriver.length === 1 && !isManager) {
      setFormData(prev => ({ ...prev, vehiculoId: vehiclesForDriver[0].id }));
    }

    if (isOpen) {
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, user, vehiclesForDriver]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!formData.vehiculoId || !formData.date || !formData.liters || !formData.odometer) {
      setError('Por favor, complete todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateFuelLogPayload = {
        vehiculoId: Number(formData.vehiculoId),
        date: new Date(formData.date).toISOString(),
        liters: Number(formData.liters),
        odometer: Number(formData.odometer),
        cost: formData.cost ? Number(formData.cost) : undefined,
      };

      await createFuelLog(payload);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar el registro. Intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur md:py-12">
      <div className="w-full max-w-5xl max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="relative grid overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-slate-950 md:grid-cols-[0.9fr,1.1fr]">
          <aside className="relative hidden h-full flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-8 text-white md:flex md:overflow-y-auto">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_70%)]" />
            <div className="relative space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em]">
                <ClipboardList className="h-4 w-4" />
                Registro rápido
              </span>
              <h2 className="text-2xl font-semibold leading-tight">Captura recargas de combustible con contexto operativo</h2>
              <p className="text-sm text-white/80">
                Prioriza vehículos críticos, registra litros y kilometraje en un flujo moderno diseñado para analíticas en tiempo real.
              </p>
            </div>

            <div className="relative space-y-4 text-sm">
              <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
                <div className="flex items-center gap-3">
                  <CarFront className="h-5 w-5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-white/70">Vehículo seleccionado</p>
                    <p className="text-base font-semibold">
                      {selectedVehicle ? `${selectedVehicle.patente}` : 'Selecciona un vehículo'}
                    </p>
                  </div>
                </div>
                {selectedVehicle && (
                  <p className="pt-2 text-xs text-white/80">
                    {selectedVehicle.marca} {selectedVehicle.modelo}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Litros</p>
                  <p className="text-xl font-semibold">
                    {formData.liters ? Number(formData.liters).toFixed(1) : '—'}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/12 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/70">Odómetro</p>
                  <p className="text-xl font-semibold">
                    {formData.odometer ? new Intl.NumberFormat(locale).format(Number(formData.odometer)) : '—'} km
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-white/12 p-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/70">Tip operativo</p>
                    <p className="text-sm text-white/80">
                      Completa litros, odómetro y fecha para proyectar consumo y programar mantenimientos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="relative flex h-full flex-col bg-white px-6 py-6 dark:bg-slate-950 md:min-h-0 md:px-8 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  Registrar combustible
                </span>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Anota la recarga y sincroniza con los indicadores de consumo</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">Completa los campos clave para alimentar el tablero de eficiencia y alertas tempranas.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </button>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-rose-200/70 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-1 flex-col gap-8 overflow-y-auto pr-1 md:min-h-0">
              <section className="space-y-4">
                <header className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow dark:bg-white dark:text-slate-900">1</span>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Selecciona el vehículo y la fecha</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Elige la unidad a la que se le carga combustible y registra la fecha exacta.</p>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-[1.2fr,0.8fr]">
                  <div>
                    <label htmlFor="vehiculoId" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Vehículo</label>
                    <div className="relative">
                      <CarFront className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <select
                        id="vehiculoId"
                        name="vehiculoId"
                        value={formData.vehiculoId || ''}
                        onChange={handleChange}
                        required
                        className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      >
                        <option value="" disabled>
                          Selecciona un vehículo
                        </option>
                        {vehicleList.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.patente} · {v.marca} {v.modelo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="date" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Fecha de carga</label>
                    <div className="relative">
                      <CalendarCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="date"
                        name="date"
                        type="date"
                        value={formData.date || ''}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <header className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white shadow dark:bg-white dark:text-slate-900">2</span>
                  <div>
                    <h4 className="text-base font-semibold text-slate-900 dark:text-white">Captura los indicadores de carga</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Litros y odómetro alimentan los cálculos de eficiencia y rutas.</p>
                  </div>
                </header>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <label htmlFor="liters" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Litros<span className="text-rose-500"> *</span></label>
                    <div className="relative">
                      <Fuel className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="liters"
                        name="liters"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej. 52.7"
                        value={formData.liters || ''}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="odometer" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Odómetro (km)<span className="text-rose-500"> *</span></label>
                    <div className="relative">
                      <Gauge className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="odometer"
                        name="odometer"
                        type="number"
                        min="0"
                        placeholder="Ej. 123456"
                        value={formData.odometer || ''}
                        onChange={handleChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="cost" className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Costo total (opcional)</label>
                    <div className="relative">
                      <DollarSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="cost"
                        name="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ej. 45000"
                        value={formData.cost || ''}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm text-slate-900 shadow-inner shadow-slate-200/60 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:shadow-none dark:focus:border-indigo-400 dark:focus:ring-indigo-500/30"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>Los indicadores registrados impactan los KPI de consumo y el plan de mantenimiento.</span>
                  <span>
                    {formData.liters && formData.odometer
                      ? 'Datos listos para sincronizar'
                      : 'Completa los campos obligatorios para continuar'}
                  </span>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200/60 transition hover:-translate-y-0.5 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? 'Guardando…' : 'Guardar registro'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelLogFormModal;
