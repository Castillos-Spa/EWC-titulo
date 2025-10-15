import React, { useState } from 'react';
import { TransportRoute } from './RouteContext';
import { useRouteContext } from './useRouteContext';

const frequencies = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];

interface RouteFormProps {
  initial?: Partial<TransportRoute>;
  mode?: 'create' | 'edit';
  onSubmitSuccess?: () => void; // Para cerrar modal externo
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

  const reset = () => {
    setCode('');
    setOrigin('');
    setDestination('');
    setDistanceKm('');
    setFrequency('Diaria');
    setActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !origin || !destination || distanceKm === '' || distanceKm <= 0) return;
  // Validación código único (ignora ruta actual en modo edición)
  const normalized = code.trim().toLowerCase();
  const duplicate = routes.some(r => r.code.trim().toLowerCase() === normalized && r.id !== initial?.id);
    if (duplicate) {
      setCodeError('El código ya existe. Debe ser único.');
      return;
    }
    setCodeError(null);
    if (mode === 'edit' && initial?.id) {
      updateRoute(initial.id, { code, origin, destination, distanceKm: Number(distanceKm), frequency, active });
    } else {
      addRoute({ code, origin, destination, distanceKm: Number(distanceKm), frequency, active });
      reset();
    }
    onSubmitSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
  <h3 className="text-lg font-semibold">{mode === 'edit' ? 'Editar Ruta' : 'Registrar Nueva Ruta'}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="route-code" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Código</label>
          <input id="route-code" value={code} onChange={e => setCode(e.target.value)} className={`w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700 ${codeError ? 'border-red-500 focus:border-red-500' : ''}`} />
          {codeError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{codeError}</p>}
        </div>
        <div>
          <label htmlFor="route-frequency" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Frecuencia</label>
          <select id="route-frequency" value={frequency} onChange={e => setFrequency(e.target.value)} className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700">
            {frequencies.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="route-origin" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Origen</label>
          <input id="route-origin" value={origin} onChange={e => setOrigin(e.target.value)} className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div>
          <label htmlFor="route-destination" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Destino</label>
          <input id="route-destination" value={destination} onChange={e => setDestination(e.target.value)} className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div>
          <label htmlFor="route-distance" className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-200">Distancia (km)</label>
          <input id="route-distance" type="number" min={1} value={distanceKm} onChange={e => setDistanceKm(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
        </div>
        <div className="flex items-center space-x-2">
          <input id="active-route" type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} />
          <label htmlFor="active-route" className="text-sm text-gray-700 dark:text-gray-200">Activa</label>
        </div>
      </div>
      <div className="flex justify-end pt-2 space-x-2 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={reset} className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Limpiar</button>
  <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50" disabled={!code || !origin || !destination || distanceKm === '' || !!codeError}>{mode === 'edit' ? 'Guardar Cambios' : 'Guardar'}</button>
      </div>
    </form>
  );
};

export default RouteForm;