import React from 'react';
import { RouteProvider } from '@features/transport-routes/context/RouteContext';
import RouteKPIs from '@features/transport-routes/components/RouteKPIs';
import RegisterRouteModal from '@features/transport-routes/components/RegisterRouteModal';
import RouteList from '@features/transport-routes/components/RouteList';

const RoutesPageInner: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="mb-2 text-xl font-bold tracking-tight">Módulo de Rutas (Mock)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-prose">Registro y visualización básica de rutas de transporte con KPIs simples. Esta vista es un prototipo desconectado (sin backend) pensado para iterar requerimientos.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setOpen(true)} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded shadow hover:bg-blue-700">Registrar Ruta</button>
        </div>
      </div>
      <RouteKPIs />
      <RouteList />
      <div className="p-4 text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300">
        <strong>Nota:</strong> Datos en memoria. Al recargar la página se restablecen los registros semilla. Para integrarlo con backend se debe reemplazar el contexto por fetch a la API y mutaciones reales.
      </div>
      <RegisterRouteModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

const RoutesPage: React.FC = () => (
  <RouteProvider>
    <RoutesPageInner />
  </RouteProvider>
);

export default RoutesPage;
