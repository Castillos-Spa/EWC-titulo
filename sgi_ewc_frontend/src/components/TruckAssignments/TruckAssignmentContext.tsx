import React, { createContext, useCallback, useMemo, useState, useEffect } from 'react';
import { getVehiculosFromTaller, getDrivers } from '../../utils/tallerApi';
import { getAssignments, createAssignment, deleteAssignment } from '../../utils/assignmentsApi';

export interface Truck {
  id: string;
  code: string; // Código del camión
  capacityTons?: number;
  active: boolean;
}

export interface Driver {
  id: string;
  name: string;
  active: boolean;
}

export interface TruckAssignment {
  id: string;
  truckId: string;
  routeId: string;
  driverId: string;
  date: Date; // día planificado
  status?: 'Planificada' | 'Programada' | 'Iniciada' | 'Cancelada';
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  volumeLiters?: number;
}

interface ContextValue {
  trucks: Truck[];
  drivers: Driver[];
  assignments: TruckAssignment[];
  addAssignment: (data: Omit<TruckAssignment, 'id'>) => { ok: boolean; error?: string };
  removeAssignment: (id: string) => void;
  setTruckDayAssignment: (
    truckId: string,
    date: Date,
    driverId: string,
    routes: Array<{ routeId: string; volumeLiters?: number }>
  ) => { ok: boolean; error?: string };
  updateAssignment: (id: string, patch: Partial<TruckAssignment>) => void;
  kpis: {
    totalTrucks: number;
    activeTrucks: number;
  };
}

const TruckAssignmentContext = createContext<ContextValue | undefined>(undefined);

const dateOnly = (input?: Date) => {
  const d = input ? new Date(input) : new Date();
  d.setHours(0,0,0,0);
  return d;
};


const sameDay = (a: Date, b: Date) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const TruckAssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<TruckAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [truckData, driverData, assignmentData] = await Promise.all([
        getVehiculosFromTaller({ tipo: 'Camion', estado: 'disponible' }), // Filtra por tipo 'Camion' y estado 'disponible'
        getDrivers(),
        getAssignments(),
      ]);
      setTrucks(truckData);
      setDrivers(driverData);
      setAssignments(assignmentData.map(a => ({...a, date: new Date(a.date)}))); // Asegurarse que las fechas son objetos Date
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar datos de asignación';
      setError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const addAssignment: ContextValue['addAssignment'] = (data) => {
    // Esta función ahora se manejará principalmente a través de `setTruckDayAssignment`
    // Se mantiene por compatibilidad pero la lógica principal se mueve.
    console.warn('addAssignment está deprecado, usar setTruckDayAssignment');
    return { ok: true };
  };

  const removeAssignment: ContextValue['removeAssignment'] = (id) => {
    // Asumimos que el ID es numérico si viene de la DB
    void deleteAssignment(Number(id)).then(fetchData);
  };

  // Actual implementation with details
  const _setTruckDayAssignmentImpl = (
    truckId: string,
    date: Date,
    driverId: string,
    routesWithVolumes: Array<{ routeId: string; volumeLiters?: number }>,
  ): { ok: boolean; error?: string } => {
    let conflict = false;
    const currentAssignments = assignments;
      const d0 = dateOnly(date);
      // Validar conductor no asignado a otro camión en el mismo día (excluye el mismo camión)
      const driverConflict = currentAssignments.some(a => sameDay(a.date, d0) && a.driverId === driverId && a.truckId !== truckId);
      if (driverConflict) {
        conflict = true;
        return { ok: false, error: 'El conductor ya está asignado a otro camión en esa fecha.' };
      }
      // Eliminar todas las asignaciones existentes del camión para ese día
      const toDelete = currentAssignments.filter(a => a.truckId === truckId && sameDay(a.date, d0));
      const toCreate = routesWithVolumes.map(entry => ({
        truckId,
        routeId: entry.routeId,
        driverId,
        date,
        status: 'Planificada' as const,
        volumeLiters: entry.volumeLiters,
      }));

      // Ejecutar operaciones en la API
      Promise.all([
        ...toDelete.map(a => deleteAssignment(Number(a.id))),
        ...toCreate.map(c => createAssignment(c))
      ]).then(fetchData).catch(err => {
        console.error("Error al guardar asignaciones:", err);
        setError(err instanceof Error ? err.message : 'Error al guardar');
      });

      return { ok: true };
  };

  // Rebind exported function to actual impl (keeping type compatibility)
  const setTruckDayAssignmentWithDetails: ContextValue['setTruckDayAssignment'] = useCallback(
    (truckId, date, driverId, routes) => _setTruckDayAssignmentImpl(truckId, date, driverId, routes),
    [assignments] // Depende de assignments para la validación
  );

  const updateAssignment: ContextValue['updateAssignment'] = (id, patch) => {
    // La actualización completa se maneja con setTruckDayAssignment.
    // Esta función podría usarse para cambios de estado menores en el futuro.
    console.warn('updateAssignment no está completamente implementado con la API');
    setAssignments(prev => prev.map(a => (a.id === id ? { ...a, ...patch } : a)));
  };

  const kpis = useMemo(() => {
    const totalTrucks = trucks.length;
    const activeTrucks = trucks.filter(t => t.active).length;
    return { totalTrucks, activeTrucks };
  }, [trucks]);

  const value = useMemo(() => ({ trucks, drivers, assignments, addAssignment, removeAssignment, setTruckDayAssignment: setTruckDayAssignmentWithDetails, updateAssignment, kpis }), [trucks, drivers, assignments, kpis, setTruckDayAssignmentWithDetails]);

  return <TruckAssignmentContext.Provider value={value}>{children}</TruckAssignmentContext.Provider>;
};

export default TruckAssignmentContext;