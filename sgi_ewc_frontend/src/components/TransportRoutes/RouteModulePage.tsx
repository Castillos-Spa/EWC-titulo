import React from 'react';
/**
 * Módulo Mock de Rutas de Transporte
 * ----------------------------------
 * Objetivo: Servir como prototipo rápido para validar campos necesarios, KPIs y flujo básico
 * de registro de rutas antes de integrar backend real.
 *
 * Siguientes pasos sugeridos para versión real:
 * 1. Reemplazar RouteContext con hooks que consuman un endpoint REST/GraphQL (GET /routes, POST /routes)
 * 2. Añadir validaciones adicionales (código único, distancia máxima, etc.)
 * 3. Incorporar edición y desactivación (soft delete) de rutas
 * 4. Ampliar KPIs (ej: rutas por frecuencia, top distancias, utilización histórica)
 * 5. Incorporar paginación/virtualización para grandes volúmenes
 */
import { RouteProvider } from './RouteContext';
import RouteKPIs from './RouteKPIs';
import RegisterRouteModal from './RegisterRouteModal';
import RouteList from './RouteList';

// Página principal del módulo mock de Rutas de Transporte
const RouteModulePageInner: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-6 text-gray-900 dark:text-gray-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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

const RouteModulePage: React.FC = () => (
  <RouteProvider>
    <RouteModulePageInner />
  </RouteProvider>
);

export default RouteModulePage;