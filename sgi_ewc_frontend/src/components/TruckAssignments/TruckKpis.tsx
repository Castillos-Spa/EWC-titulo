import React, { useMemo } from 'react';
import { useTruckAssignment } from './useTruckAssignment';

interface Props {
  date: string;
  onDateChange: (value: string) => void;
}

const TruckKpis: React.FC<Props> = ({ date, onDateChange }) => {
  const { kpis, assignments, trucks } = useTruckAssignment();

  const day = useMemo(() => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
  }, [date]);

  const dayKpis = useMemo(() => {
    const sameDay = (a: Date, b: Date) => a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
    const activeTrucks = trucks.filter(t => t.active).length;
    const asgs = assignments.filter(a => sameDay(a.date instanceof Date ? a.date : new Date(a.date), day));
    const used = new Set(asgs.map(a => a.truckId));
    const planned = asgs.length;
    const available = trucks.filter(t => t.active && !used.has(t.id)).length;
    const utilization = activeTrucks ? (planned / activeTrucks) * 100 : 0;
    return { planned, available, utilization };
  }, [assignments, trucks, day]);
  return (
    <div className="grid gap-4 md:grid-cols-5">
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Camiones Totales</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{kpis.totalTrucks}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Camiones Activos</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{kpis.activeTrucks}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Fecha</p>
  <input type="date" value={date} onChange={e => onDateChange(e.target.value)} className="mt-2 w-full px-3 py-2 text-sm border rounded text-gray-900 dark:text-gray-100 dark:bg-gray-800 dark:border-gray-700" />
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Planificadas (día)</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{dayKpis.planned}</p>
      </div>
      <div className="p-4 bg-white rounded-lg shadow dark:bg-gray-900">
        <p className="text-xs font-medium tracking-wide uppercase text-gray-500 dark:text-gray-400">Disponibles (día)</p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">{dayKpis.available}</p>
        <div className="w-full h-2 mt-2 bg-gray-200 rounded dark:bg-gray-700">
          <div className="h-2 bg-blue-600 rounded" style={{ width: `${dayKpis.utilization}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default TruckKpis;