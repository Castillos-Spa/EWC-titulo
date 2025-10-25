import React, { useMemo, useState } from 'react';
import type { TransportRoute, CreateTransportRoutePayload } from '../context/RouteContext';
import { useRouteContext } from '../context/useRouteContext';
import { toast } from 'sonner';

const frequencies = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];

interface RouteFormProps {
  initial?: Partial<TransportRoute>;
  mode?: 'create' | 'edit';
  onSubmitSuccess?: () => void;
}

const RouteForm: React.FC<RouteFormProps> = ({ initial, mode = 'create', onSubmitSuccess }) => {
  const { addRoute, updateRoute, routes } = useRouteContext();
  const [codeError, setCodeError] = useState<string | null>(null);
  const [code, setCode] = useState(initial?.code || '');
  const [origin, setOrigin] = useState(initial?.origin || '');
  const [destination, setDestination] = useState(initial?.destination || '');
  const [distanceKm, setDistanceKm] = useState<number | ''>(initial?.distanceKm ?? '');
  const [frequency, setFrequency] = useState(initial?.frequency || 'Diaria');
  const [active, setActive] = useState(initial?.active ?? true);

  const canSubmit = useMemo(() => {
    if (!code || !origin || !destination || distanceKm === '') return false;
    if (typeof distanceKm === 'number' && distanceKm <= 0) return false;
    return !codeError;
  }, [code, origin, destination, distanceKm, codeError]);

  const reset = () => {
    setCode('');
    setOrigin('');
    setDestination('');
    setDistanceKm('');
    setFrequency('Diaria');
    setActive(true);
    setCodeError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const normalized = code.trim().toLowerCase();
    const duplicate = routes.some(r => r.code.trim().toLowerCase() === normalized && r.id !== initial?.id);
    if (duplicate) {
      setCodeError('El código ya existe. Debe ser único.');
      toast.error('El código de ruta ya existe');
      return;
    }
    setCodeError(null);

    const payload: CreateTransportRoutePayload = {
      code: code.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      distanceKm: Number(distanceKm),
      frequency,
    };

    try {
      if (mode === 'edit' && initial?.id) {
        await updateRoute(initial.id, { ...payload, active });
        toast.success(`Ruta ${payload.code} actualizada`);
      } else {
        await addRoute(payload);
        toast.success(`Ruta ${payload.code} creada`);
        reset();
      }
      onSubmitSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado al guardar la ruta';
      toast.error(message);
    }
  };

  const labelCls = 'mb-2 block text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70';
  const inputCls = 'w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm text-slate-800 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder:text-blue-200/60 dark:focus:ring-sky-500';

  return (
    <form onSubmit={handleSubmit} className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-inner shadow-slate-200/40 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-black/30">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_rgba(226,232,240,0.08))] dark:bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_rgba(15,23,42,0.4))]" />
      <div className="relative space-y-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-blue-200/60">{mode === 'edit' ? 'Actualización' : 'Ficha operativa'}</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{mode === 'edit' ? `Editar ${initial?.code ?? 'ruta'}` : 'Detalles del trayecto'}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/70">Completa los datos operativos para que el trayecto quede disponible dentro del prototipo.</p>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-1">
            <label htmlFor="route-code" className={labelCls}>Código</label>
            <input
              id="route-code"
              value={code}
              onChange={e => { setCode(e.target.value); setCodeError(null); }}
              placeholder="Ej. R-001"
              className={`${inputCls} ${codeError ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200 dark:border-rose-400/40 dark:focus:ring-rose-400' : ''}`}
            />
            {codeError && <p className="mt-2 text-xs font-semibold text-rose-500 dark:text-rose-300">{codeError}</p>}
          </div>

          <div className="md:col-span-1">
            <label htmlFor="route-frequency" className={labelCls}>Frecuencia</label>
            <select
              id="route-frequency"
              value={frequency}
              onChange={e => setFrequency(e.target.value)}
              className={inputCls}
            >
              {frequencies.map(f => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <label htmlFor="route-origin" className={labelCls}>Origen</label>
            <input
              id="route-origin"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              placeholder="Punto de partida"
              className={inputCls}
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="route-destination" className={labelCls}>Destino</label>
            <input
              id="route-destination"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="Punto de llegada"
              className={inputCls}
            />
          </div>

          <div className="md:col-span-1">
            <label htmlFor="route-distance" className={labelCls}>Distancia (km)</label>
            <input
              id="route-distance"
              type="number"
              min={1}
              value={distanceKm}
              onChange={e => {
                const value = e.target.value;
                setDistanceKm(value === '' ? '' : Number(value));
              }}
              placeholder="0"
              className={inputCls}
            />
          </div>

          <div className="md:col-span-1">
            <span className={labelCls}>Estado</span>
            <div className="inline-flex w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setActive(true)}
                className={`flex-1 px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500 ${active ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-200/50 dark:shadow-sky-900/50' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
              >
                Activa
              </button>
              <button
                type="button"
                aria-pressed={!active}
                onClick={() => setActive(false)}
                className={`flex-1 px-4 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:focus-visible:ring-sky-500 ${active ? 'hover:bg-slate-100 dark:hover:bg-white/10' : 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md shadow-rose-200/50 dark:shadow-rose-900/40'}`}
              >
                Inactiva
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-blue-200/70">Controla si la ruta se muestra operativa dentro del listado principal.</p>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200/70 pt-4 text-sm dark:border-white/10 md:flex-row md:items-center md:justify-end md:space-x-3">
          {mode === 'create' && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
            >
              Limpiar formulario
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 px-6 py-2 font-semibold text-white shadow-lg shadow-sky-400/40 transition hover:-translate-y-0.5 ${canSubmit ? '' : 'opacity-60'}`}
          >
            {mode === 'edit' ? 'Guardar cambios' : 'Registrar ruta'}
          </button>
        </footer>
      </div>
    </form>
  );
};

export default RouteForm;
