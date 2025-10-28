import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useStandardFleet } from '../context/StandardFleetContext';
import type { CreateStandardVehiculo } from '../../../../utils/mockStandardApi';
import type { VehiculoStatus } from '../../../../types/Vehiculo';

type VehicleType = 'camion' | 'camioneta';

export default function StandardVehicleModal() {
  const { showForm, editing, closeForm, create, update } = useStandardFleet();
  const [vehicleType, setVehicleType] = useState<VehicleType>('camion');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const steps = useMemo(() => [
    'Identificación',
    'Operación',
    'Ficha técnica',
    'Propiedad y costos',
    'Seguro y cumplimiento',
    'Resumen',
  ], []);
  const [preview, setPreview] = useState<CreateStandardVehiculo | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!showForm) return;
    const handler = (ev: KeyboardEvent) => { if (ev.key === 'Escape') closeForm(); };
    globalThis.addEventListener('keydown', handler);
    return () => globalThis.removeEventListener('keydown', handler);
  }, [showForm, closeForm]);

  useEffect(() => {
    if (!showForm) return;
    const raw = (editing?.tipo ?? '').toLowerCase();
    if (raw.includes('camioneta')) setVehicleType('camioneta');
    else setVehicleType('camion');
  }, [editing, showForm]);

  const title = useMemo(() => editing ? `Editar ${editing.patente}` : 'Nuevo vehículo estándar', [editing]);
  let submitLabel = 'Registrar';
  if (editing) submitLabel = 'Actualizar';
  if (submitting) submitLabel = 'Guardando…';

  if (!showForm) return null;

  const readPayload = (fd: FormData): CreateStandardVehiculo => {
    const getStr = (k: string) => {
      const v = fd.get(k);
      return typeof v === 'string' ? v.trim() : '';
    };
    const getNum = (k: string) => {
      const raw = getStr(k);
      if (!raw) return undefined;
      const v = Number(raw);
      return Number.isFinite(v) ? v : undefined;
    };
    const estado = (getStr('estado') || 'disponible') as VehiculoStatus;
    const payload: CreateStandardVehiculo = {
      empresaId: getStr('empresaId'),
      codigo: getStr('codigo'),
      patente: getStr('patente'),
      marca: getStr('marca'),
      modelo: getStr('modelo'),
      tipo: vehicleType === 'camion' ? 'Camion' : 'Camioneta',
      capacidad: vehicleType === 'camion' ? (getNum('capacidad') ?? 0) : 0,
      odometro: getNum('odometro') ?? 0,
      estado,
      areaAsignada: getStr('areaAsignada') || null,
      nombre: getStr('nombre') || null,
      segmento: getStr('segmento') || null,
      centroCosto: getStr('centroCosto') || null,
      region: getStr('region') || null,
      manager: getStr('manager') || null,
      tags: (getStr('tags') || '').split(',').map(x => x.trim()).filter(Boolean),
      metadata: null,
      vin: getStr('vin') || null,
      anio: getNum('anio') ?? null,
      combustible: getStr('combustible') || null,
      normaEmisiones: getStr('normaEmisiones') || null,
      baseUbicacion: getStr('baseUbicacion') || null,
      propietario: getStr('propietario') || null,
      arrendador: getStr('arrendador') || null,
      contrato: getStr('contrato') || null,
      valorCompra: getNum('valorCompra') ?? null,
      valorResidual: getNum('valorResidual') ?? null,
      vidaUtilMeses: getNum('vidaUtilMeses') ?? null,
      aseguradora: getStr('aseguradora') || null,
      polizaNumero: getStr('polizaNumero') || null,
      polizaVence: (() => { const d = getStr('polizaVence'); return d ? new Date(d).toISOString() : null; })(),
      dispositivosIoT: null,
    };
    return payload;
  };

  const validateStep0 = (fd: FormData): string | null => {
    const r = (k: string) => {
      const v = fd.get(k);
      return typeof v === 'string' ? v.trim() : '';
    };
    const empresaId = r('empresaId');
    const codigo = r('codigo');
    const patente = r('patente');
    const marca = r('marca');
    const modelo = r('modelo');
    if (!empresaId || !codigo || !patente || !marca || !modelo) return 'Completa empresa, código, patente, marca y modelo.';
    if (vehicleType === 'camion') {
      const cap = Number(r('capacidad'));
      if (!Number.isFinite(cap) || cap <= 0) return 'Capacidad es obligatoria para vehículos tipo Camion.';
    }
    return null;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void (async () => {
      const fd = new FormData(e.currentTarget);
      const err = validateStep0(fd);
      if (err) { setFormError(err); return; }
      const payload = readPayload(fd);
      try {
        setSubmitting(true);
        setFormError(null);
        if (editing) await update(editing.id, payload); else await create(payload);
        e.currentTarget.reset();
      } catch (err) {
        const msg = (err as { message?: string } | undefined)?.message ?? 'No se pudo guardar.';
        setFormError(msg);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500';
  const labelCls = 'mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-blue-100/80';
  const legendCls = 'px-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-700 dark:text-blue-100/80';

  const handleNext = () => {
    if (!formRef.current) return;
    if (currentStep === 0) {
      const fd = new FormData(formRef.current);
      const err = validateStep0(fd);
      if (err) { setFormError(err); return; }
    }
    const next = Math.min(currentStep + 1, steps.length - 1);
    if (next === steps.length - 1) {
      const fd = new FormData(formRef.current);
      setPreview(readPayload(fd));
    }
    setFormError(null);
    setCurrentStep(next);
  };

  const handlePrev = () => {
    setCurrentStep(s => Math.max(0, s - 1));
  };

  const totalSteps = steps.length;
  const progress = Math.round((currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-10 backdrop-blur">
      <div className="relative w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-8 text-slate-800 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-slate-100">
        <div className="relative flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/70">{editing ? 'Actualización' : 'Nuevo registro'}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">Captura datos estandarizados (multiempresa) y define reglas comunes.</p>
          </div>
          <button onClick={closeForm} className="rounded-2xl border border-slate-200 bg-white/80 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-blue-100" aria-label="Cerrar"><X className="h-4 w-4" /></button>
        </div>

        {/* Stepper */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {steps.map((label, i) => (
            <div key={label} className={`flex items-center gap-2 rounded-2xl border px-3 py-1 text-xs ${i === currentStep ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-200' : 'border-slate-200 text-slate-500 dark:border-white/10 dark:text-blue-200/70'}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[0.7rem] ${i <= currentStep ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-blue-100/70'}`}>{i + 1}</span>
              <span className="hidden sm:block">{label}</span>
            </div>
          ))}
        </div>

        {/* Indicador de progreso */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-[0.75rem] text-slate-500 dark:text-blue-200/70">
            <span>Progreso</span>
            <span>{progress}% · Paso {currentStep + 1} de {totalSteps}</span>
          </div>
          <progress value={progress} max={100} className="h-2 w-full overflow-hidden rounded-full [appearance:none] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200/80 dark:[&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-gradient-to-r [&::-webkit-progress-value]:from-sky-500 [&::-webkit-progress-value]:to-indigo-500" />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Paso 1: Identificación */}
          {currentStep === 0 && (
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="empresaId" className={labelCls}>Empresa</label>
                <input id="empresaId" name="empresaId" defaultValue={editing?.empresaId ?? 'EWC'} className={inputCls} required />
              </div>
              <div>
                <label htmlFor="codigo" className={labelCls}>Código</label>
                <input id="codigo" name="codigo" defaultValue={editing?.codigo ?? ''} placeholder="TK-001" className={inputCls} required />
              </div>
              <div>
                <label htmlFor="patente" className={labelCls}>Patente</label>
                <input id="patente" name="patente" defaultValue={editing?.patente ?? ''} placeholder="ABCD11" className={inputCls} required />
              </div>
              <div>
                <label htmlFor="marca" className={labelCls}>Marca</label>
                <input id="marca" name="marca" defaultValue={editing?.marca ?? ''} placeholder="Volvo" className={inputCls} required />
              </div>
              <div>
                <label htmlFor="modelo" className={labelCls}>Modelo</label>
                <input id="modelo" name="modelo" defaultValue={editing?.modelo ?? ''} placeholder="FMX" className={inputCls} required />
              </div>
              <div>
                <label htmlFor="tipo" className={labelCls}>Tipo</label>
                <select id="tipo" name="tipo" value={vehicleType} onChange={e => setVehicleType(e.target.value as VehicleType)} className={inputCls}>
                  <option value="camion">Camión cisterna</option>
                  <option value="camioneta">Camioneta de apoyo</option>
                </select>
              </div>
              {vehicleType === 'camion' && (
                <div>
                  <label htmlFor="capacidad" className={labelCls}>Capacidad (L)</label>
                  <input id="capacidad" name="capacidad" type="number" min={0} defaultValue={editing?.capacidad ?? 0} className={inputCls} required />
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Operación */}
          {currentStep === 1 && (
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label htmlFor="odometro" className={labelCls}>Odómetro (km)</label>
                <input id="odometro" name="odometro" type="number" min={0} defaultValue={editing?.odometro ?? 0} className={inputCls} />
              </div>
              <div>
                <label htmlFor="estado" className={labelCls}>Estado</label>
                <select id="estado" name="estado" defaultValue={editing?.estado ?? 'disponible'} className={inputCls}>
                  <option value="disponible">Disponible</option>
                  <option value="en_mantenimiento">En mantenimiento</option>
                  <option value="en_uso">En uso</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </div>
              <div>
                <label htmlFor="nombre" className={labelCls}>Nombre</label>
                <input id="nombre" name="nombre" defaultValue={editing?.nombre ?? ''} className={inputCls} />
              </div>
              <div>
                <label htmlFor="segmento" className={labelCls}>Segmento</label>
                <input id="segmento" name="segmento" defaultValue={editing?.segmento ?? ''} className={inputCls} />
              </div>
              <div>
                <label htmlFor="centroCosto" className={labelCls}>Centro de costo</label>
                <input id="centroCosto" name="centroCosto" defaultValue={editing?.centroCosto ?? ''} className={inputCls} />
              </div>
              <div>
                <label htmlFor="areaAsignada" className={labelCls}>Área asignada</label>
                <input id="areaAsignada" name="areaAsignada" defaultValue={editing?.areaAsignada ?? ''} className={inputCls} />
              </div>
              <div>
                <label htmlFor="region" className={labelCls}>Región</label>
                <input id="region" name="region" defaultValue={editing?.region ?? ''} className={inputCls} />
              </div>
              <div>
                <label htmlFor="manager" className={labelCls}>Responsable</label>
                <input id="manager" name="manager" defaultValue={editing?.manager ?? ''} className={inputCls} />
              </div>
              <div className="md:col-span-3">
                <label htmlFor="tags" className={labelCls}>Tags (separados por coma)</label>
                <input id="tags" name="tags" defaultValue={(editing?.tags ?? []).join(', ')} className={inputCls} />
              </div>
            </div>
          )}

          {/* Paso 3: Ficha técnica */}
          {currentStep === 2 && (
            <fieldset className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
              <legend className={legendCls}>Ficha técnica</legend>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label htmlFor="vin" className={labelCls}>VIN</label>
                  <input id="vin" name="vin" defaultValue={editing?.vin ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="anio" className={labelCls}>Año</label>
                  <input id="anio" name="anio" type="number" min={1900} max={2100} defaultValue={editing?.anio ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="combustible" className={labelCls}>Combustible</label>
                  <input id="combustible" name="combustible" defaultValue={editing?.combustible ?? ''} placeholder="Diésel / Gasolina / Eléctrico" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="normaEmisiones" className={labelCls}>Norma de emisiones</label>
                  <input id="normaEmisiones" name="normaEmisiones" defaultValue={editing?.normaEmisiones ?? ''} placeholder="Euro V" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="baseUbicacion" className={labelCls}>Base / Ubicación</label>
                  <input id="baseUbicacion" name="baseUbicacion" defaultValue={editing?.baseUbicacion ?? ''} className={inputCls} />
                </div>
              </div>
            </fieldset>
          )}

          {/* Paso 4: Propiedad y costos */}
          {currentStep === 3 && (
            <fieldset className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
              <legend className={legendCls}>Propiedad y costos</legend>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label htmlFor="propietario" className={labelCls}>Propietario</label>
                  <input id="propietario" name="propietario" defaultValue={editing?.propietario ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="arrendador" className={labelCls}>Arrendador</label>
                  <input id="arrendador" name="arrendador" defaultValue={editing?.arrendador ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="contrato" className={labelCls}>Contrato</label>
                  <input id="contrato" name="contrato" defaultValue={editing?.contrato ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="valorCompra" className={labelCls}>Valor compra</label>
                  <input id="valorCompra" name="valorCompra" type="number" min={0} step="0.01" defaultValue={editing?.valorCompra ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="valorResidual" className={labelCls}>Valor residual</label>
                  <input id="valorResidual" name="valorResidual" type="number" min={0} step="0.01" defaultValue={editing?.valorResidual ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="vidaUtilMeses" className={labelCls}>Vida útil (meses)</label>
                  <input id="vidaUtilMeses" name="vidaUtilMeses" type="number" min={0} defaultValue={editing?.vidaUtilMeses ?? ''} className={inputCls} />
                </div>
              </div>
            </fieldset>
          )}

          {/* Paso 5: Seguro y cumplimiento */}
          {currentStep === 4 && (
            <fieldset className="space-y-4 rounded-3xl border border-slate-200/60 bg-white/70 p-4 shadow-inner shadow-slate-200/40 dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
              <legend className={legendCls}>Seguro y cumplimiento</legend>
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label htmlFor="aseguradora" className={labelCls}>Aseguradora</label>
                  <input id="aseguradora" name="aseguradora" defaultValue={editing?.aseguradora ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="polizaNumero" className={labelCls}>Póliza</label>
                  <input id="polizaNumero" name="polizaNumero" defaultValue={editing?.polizaNumero ?? ''} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="polizaVence" className={labelCls}>Vence</label>
                  <input id="polizaVence" name="polizaVence" type="date" defaultValue={editing?.polizaVence ? String(editing.polizaVence).slice(0,10) : ''} className={inputCls} />
                </div>
              </div>
            </fieldset>
          )}

          {/* Paso 6: Resumen */}
          {currentStep === 5 && preview && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div><span className={labelCls}>Empresa</span><div className="text-sm">{preview.empresaId}</div></div>
                <div><span className={labelCls}>Código</span><div className="text-sm">{preview.codigo}</div></div>
                <div><span className={labelCls}>Patente</span><div className="text-sm">{preview.patente}</div></div>
                <div><span className={labelCls}>Marca</span><div className="text-sm">{preview.marca}</div></div>
                <div><span className={labelCls}>Modelo</span><div className="text-sm">{preview.modelo}</div></div>
                <div><span className={labelCls}>Tipo / Capacidad</span><div className="text-sm">{preview.tipo}{preview.capacidad ? ` — ${preview.capacidad} L` : ''}</div></div>
                <div><span className={labelCls}>Odómetro</span><div className="text-sm">{preview.odometro}</div></div>
                <div><span className={labelCls}>Estado</span><div className="text-sm">{preview.estado}</div></div>
                <div className="md:col-span-3"><span className={labelCls}>Tags</span><div className="text-sm">{(preview.tags ?? []).join(', ') || '—'}</div></div>
              </div>
              <p className="text-xs text-slate-500 dark:text-blue-200/70">Revisa la información. Puedes volver a pasos anteriores para modificar.</p>
            </div>
          )}

          {formError && (
            <div className="rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm text-rose-600 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-100">{formError}</div>
          )}

          <div className="flex justify-between gap-3 border-t border-slate-200/70 pt-5 dark:border-white/10">
            <div className="flex gap-2">
              <button type="button" onClick={closeForm} className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100" disabled={submitting}>Cancelar</button>
              <button type="button" onClick={handlePrev} className="rounded-2xl border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 disabled:opacity-50 dark:border-white/10 dark:bg-white/10 dark:text-blue-100" disabled={submitting || currentStep === 0}>Atrás</button>
            </div>
            {currentStep < steps.length - 1 ? (
              <button type="button" onClick={handleNext} className={`rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 ${submitting ? 'opacity-60' : ''}`} disabled={submitting}>Siguiente</button>
            ) : (
              <button type="submit" className={`rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 ${submitting ? 'opacity-60' : ''}`} disabled={submitting}>{submitLabel}</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
