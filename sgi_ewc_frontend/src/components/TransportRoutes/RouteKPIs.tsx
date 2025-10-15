import React from 'react';
import { useRouteContext } from './useRouteContext';

const numberFmt = (n: number, digits = 0) => n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });

const RouteKPIs: React.FC = () => {
  const { kpis } = useRouteContext();
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Total Rutas</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{kpis.total}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Distancia Total (km)</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{numberFmt(kpis.totalDistance)}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Distancia Promedio (km)</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{numberFmt(kpis.avgDistance, 1)}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">% Activas</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{numberFmt(kpis.activePct, 0)}%</p>
        <div className="w-full h-2 mt-2 bg-gray-200 rounded dark:bg-gray-700">
          <div className="h-2 bg-blue-600 rounded" style={{ width: `${kpis.activePct}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default RouteKPIs;
