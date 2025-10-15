import React, { createContext, useCallback, useMemo, useState } from 'react';

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

// Seeds
const seedTrucks: Truck[] = [
  { id: 't1', code: 'CAM-001', capacityTons: 10, active: true },
  { id: 't2', code: 'CAM-002', capacityTons: 8, active: true },
  { id: 't3', code: 'CAM-003', capacityTons: 12, active: false },
  { id: 't4', code: 'CAM-004', capacityTons: 7, active: true },
  { id: 't5', code: 'CAM-005', capacityTons: 15, active: true },
];

const seedDrivers: Driver[] = [
  { id: 'd1', name: 'Juan Pérez', active: true },
  { id: 'd2', name: 'María González', active: true },
  { id: 'd3', name: 'Carlos Jiménez', active: true },
  { id: 'd4', name: 'Ana Torres', active: false },
  { id: 'd5', name: 'Luis Romero', active: true },
];

export const TruckAssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trucks] = useState<Truck[]>(seedTrucks);
  const [drivers] = useState<Driver[]>(seedDrivers);
  const [assignments, setAssignments] = useState<TruckAssignment[]>([]);

  const addAssignment: ContextValue['addAssignment'] = (data) => {
    // Reglas: una asignación por camión por día y un conductor no puede estar asignado a más de un camión el mismo día
    let conflict = false;
    setAssignments(prev => {
      const targetDay = dateOnly(data.date);
      // Conflicto de conductor
      const driverConflict = prev.some(a => sameDay(a.date, targetDay) && a.driverId === data.driverId && a.truckId !== data.truckId);
      if (driverConflict) {
        conflict = true;
        return prev;
      }
      // Permitir múltiples rutas por camión y día: solo evitar duplicados exactos de (truckId, date, routeId)
      const duplicate = prev.some(a => a.truckId === data.truckId && sameDay(a.date, targetDay) && a.routeId === data.routeId);
      if (duplicate) return prev; // no agregar duplicado
      return [...prev, { id: 'a' + (prev.length + 1 + Math.round(Math.random()*1000)), ...data }];
    });
    if (conflict) return { ok: false, error: 'El conductor ya está asignado a otro camión en esa fecha.' };
    return { ok: true };
  };

  const removeAssignment: ContextValue['removeAssignment'] = (id) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  // Actual implementation with details
  const _setTruckDayAssignmentImpl = (
    truckId: string,
    date: Date,
    driverId: string,
    routesWithVolumes: Array<{ routeId: string; volumeLiters?: number }>
  ): { ok: boolean; error?: string } => {
    let conflict = false;
    setAssignments(prev => {
      const d0 = dateOnly(date);
      // Validar conductor no asignado a otro camión en el mismo día (excluye el mismo camión)
      const driverConflict = prev.some(a => sameDay(a.date, d0) && a.driverId === driverId && a.truckId !== truckId);
      if (driverConflict) {
        conflict = true;
        return prev;
      }
      // Eliminar todas las asignaciones existentes del camión para ese día
      const rest = prev.filter(a => !(a.truckId === truckId && sameDay(a.date, d0)));
      // Agregar nuevas asignaciones para cada ruta
      const next: TruckAssignment[] = [...rest];
      for (const entry of routesWithVolumes) {
        next.push({
          id: 'a' + (next.length + 1 + Math.round(Math.random()*1000)),
          truckId,
          routeId: entry.routeId,
          driverId,
          date: d0,
          status: 'Planificada',
          volumeLiters: entry.volumeLiters,
        });
      }
      return next;
    });
    if (conflict) return { ok: false, error: 'El conductor ya está asignado a otro camión en esa fecha.' };
    return { ok: true };
  };

  // Rebind exported function to actual impl (keeping type compatibility)
  const setTruckDayAssignmentWithDetails: ContextValue['setTruckDayAssignment'] = useCallback(
    (truckId, date, driverId, routes) => _setTruckDayAssignmentImpl(truckId, date, driverId, routes),
    []
  );

  const updateAssignment: ContextValue['updateAssignment'] = (id, patch) => {
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