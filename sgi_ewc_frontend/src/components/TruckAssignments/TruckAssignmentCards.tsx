import React, { useMemo, useState } from 'react';
import { useTruckAssignment } from './useTruckAssignment';
import { useRouteContext } from '@features/transport-routes/context/useRouteContext';
import AssignTruckModal from './AssignTruckModal';

interface Props {
  refDay: Date;
}


// Estado visual removido del flujo; sin uso de colores dinámicos

const TruckAssignmentCards: React.FC<Props> = ({ refDay }) => {
  const { assignments, trucks, drivers, removeAssignment } = useTruckAssignment();
  const { routes } = useRouteContext();
  const [modalTruckId, setModalTruckId] = useState<string | null>(null);
  const [truckQuery, setTruckQuery] = useState('');
  const [driverFilter, setDriverFilter] = useState<string>(''); // ''=Todos, 'none'=Sin conductor, otro=driverId
  const [routeQuery, setRouteQuery] = useState('');

  const dayAsgs = useMemo(() => {
    const d0 = new Date(refDay); d0.setHours(0,0,0,0);
    return assignments.filter(a => {
      const d = a.date instanceof Date ? a.date : new Date(a.date);
      return d.getFullYear()===d0.getFullYear() && d.getMonth()===d0.getMonth() && d.getDate()===d0.getDate();
    });
  }, [assignments, refDay]);

  const groups = useMemo(() => {
    // Cards por camión activo; cada card lista sus rutas asignadas del día
    const d = new Date(refDay); d.setHours(0,0,0,0);
    const byTruck = new Map<string, typeof dayAsgs>();
    for (const a of dayAsgs) {
      const arr = byTruck.get(a.truckId) || [] as typeof dayAsgs;
      arr.push(a);
      byTruck.set(a.truckId, arr);
    }
    const activeTrucks = trucks.filter(t => t.active);
    return activeTrucks.map(t => {
      const asgs = byTruck.get(t.id) || [];
      const selectedDriverId = asgs.length > 0 ? asgs[0].driverId : '';
      const sameDriver = asgs.every(a => a.driverId === selectedDriverId);
      let driverName = '-';
      if (sameDriver && selectedDriverId) {
        const drv = drivers.find(dv => dv.id === selectedDriverId);
        driverName = drv?.name || '-';
      } else if (asgs.length) {
        driverName = 'Varios';
      }
      const routeMap = new Map(routes.map(r => [String(r.id), r] as const));
      const routeItems = asgs.map(a => ({ a, route: routeMap.get(String(a.routeId)) }));
      return { truck: t, driverName, routeItems };
    });
  }, [dayAsgs, trucks, drivers, routes, refDay]);

  const filteredGroups = useMemo(() => {
    const tq = truckQuery.trim().toLowerCase();
    const rq = routeQuery.trim().toLowerCase();
    return groups.filter(g => {
      const matchesTruck = tq === '' || g.truck.code.toLowerCase().includes(tq);

      let matchesDriver = true;
      if (driverFilter === 'none') {
        matchesDriver = g.routeItems.length === 0;
      } else if (driverFilter !== '') {
        matchesDriver = false;
        for (const ri of g.routeItems) {
          if (ri.a.driverId === driverFilter) { matchesDriver = true; break; }
        }
      }

      let matchesRoute = true;
      if (rq !== '') {
        matchesRoute = false;
        for (const ri of g.routeItems) {
          const code = (ri.route?.code || '').toLowerCase();
          if (code.includes(rq)) { matchesRoute = true; break; }
        }
      }

      return matchesTruck && matchesDriver && matchesRoute;
    });
  }, [groups, truckQuery, driverFilter, routeQuery]);

  const onDelete = (id: string) => removeAssignment(id);

  // Siempre renderizar tarjetas por camión; si no hay rutas, se muestra "Sin rutas asignadas" y botón para asignar

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label htmlFor="filter-truck" className="block mb-1 text-xs font-medium uppercase text-gray-400">Camión</label>
            <input
              id="filter-truck"
              value={truckQuery}
              onChange={e => setTruckQuery(e.target.value)}
              placeholder="Código (p.ej., CAM-001)"
              className="w-full px-3 py-2 text-sm border rounded text-gray-100 bg-gray-800 border-gray-700 placeholder-gray-500"
            />
          </div>
          <div>
            <label htmlFor="filter-driver" className="block mb-1 text-xs font-medium uppercase text-gray-400">Conductor</label>
            <select
              id="filter-driver"
              value={driverFilter}
              onChange={e => setDriverFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded text-gray-100 bg-gray-800 border-gray-700"
            >
              <option value="">Todos</option>
              <option value="none">Sin conductor</option>
              {drivers.filter(d => d.active).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-route" className="block mb-1 text-xs font-medium uppercase text-gray-400">Código de ruta</label>
            <input
              id="filter-route"
              value={routeQuery}
              onChange={e => setRouteQuery(e.target.value)}
              placeholder="Ej: R-001"
              className="w-full px-3 py-2 text-sm border rounded text-gray-100 bg-gray-800 border-gray-700 placeholder-gray-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setTruckQuery(''); setDriverFilter(''); setRouteQuery(''); }}
              className="px-3 py-2 text-sm font-medium text-gray-200 bg-gray-700 rounded hover:bg-gray-600"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {filteredGroups.map(({ truck, driverName, routeItems }) => (
        <div key={truck.id} className="p-4 bg-gray-900 rounded-lg shadow border border-gray-800">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-gray-100 font-semibold">Camión {truck.code}</h4>
              <p className="text-xs text-gray-400">Fecha: {refDay.toISOString().slice(0,10)}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalTruckId(truck.id)} className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded">{routeItems.length ? 'Editar rutas' : 'Asignar rutas'}</button>
            </div>
          </div>
          <div className="mt-3 text-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="text-gray-300"><span className="text-gray-400">Conductor:</span> <span className="font-medium">{driverName}</span></div>
            <div className="text-gray-300"><span className="text-gray-400">Capacidad (t):</span> <span className="font-medium">{truck.capacityTons ?? '-'}</span></div>
            <div className="text-gray-300"><span className="text-gray-400">Rutas:</span> <span className="font-medium">{routeItems.length}</span></div>
          </div>
          <div className="mt-4 space-y-2">
            {routeItems.length === 0 ? (
              <div className="px-3 py-2 text-gray-400 bg-gray-800 rounded">Sin rutas asignadas</div>
            ) : (
              routeItems.map(({ a, route }) => (
                <div key={a.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded">
                  <div className="text-gray-200">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300 mr-2">{route?.code || 'Ruta'}</span>
                    <span className="text-gray-300">{route ? `${route.origin} → ${route.destination}` : a.routeId}</span>
                    <span className="ml-3 text-gray-400">Volumen: <span className="text-gray-200 font-medium">{a.volumeLiters === undefined ? '-' : `${a.volumeLiters} L`}</span></span>
                  </div>
                  <button onClick={() => onDelete(a.id)} className="px-3 py-1.5 text-xs font-medium text-gray-200 bg-gray-700 rounded hover:bg-gray-600">Eliminar</button>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
      <AssignTruckModal open={!!modalTruckId} onClose={() => setModalTruckId(null)} truckId={modalTruckId || ''} refDay={refDay} />
    </div>
  );
};

export default TruckAssignmentCards;
