import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';
import type { Vehiculo } from '../../../types/Vehiculo';
import type { User as AppUser } from '../../../types/User';
import type { CreateTallerWorkOrderPayload } from '../../../utils/tallerApi';
import {
  createTallerWorkOrder,
  getTallerWorkOrders,
  getVehiculosFromTaller,
  updateWorkOrderStatus,
} from '../../../utils/tallerApi';
import { getUsers } from '../../../utils/userApi';

export type MaintenanceStatus = OrdenTrabajo['estado'];
export type MaintenanceType = CreateTallerWorkOrderPayload['tipo'];

export type MaintenanceCtx = {
  records: OrdenTrabajo[];
  vehicles: Vehiculo[];
  users: AppUser[];
  mechanics: AppUser[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createRecord: (payload: CreateTallerWorkOrderPayload) => Promise<OrdenTrabajo>;
  updateStatus: (id: number, status: MaintenanceStatus) => Promise<OrdenTrabajo>;
};

const MaintenanceContext = createContext<MaintenanceCtx | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<OrdenTrabajo[]>([]);
  const [vehicles, setVehicles] = useState<Vehiculo[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const [recordsData, vehiclesData, usersData] = await Promise.all([
        getTallerWorkOrders(),
        getVehiculosFromTaller(),
        getUsers(),
      ]);
      setRecords(recordsData);
      setVehicles(vehiclesData);
      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los registros de mantenimiento');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createRecord = useCallback(async (payload: CreateTallerWorkOrderPayload) => {
    const created = await createTallerWorkOrder(payload);
    setRecords(prev => [created, ...prev]);
    return created;
  }, []);

  const updateStatus = useCallback(async (id: number, status: MaintenanceStatus) => {
    const updated = await updateWorkOrderStatus(id, status);
    setRecords(prev => prev.map(record => (record.id === id ? updated : record)));
    return updated;
  }, []);

  const mechanics = useMemo(
    () =>
      users.filter(user =>
        user.roleAssignments?.some(assignment => assignment.specialty === 'MECHANIC'),
      ),
    [users],
  );

  const value = useMemo<MaintenanceCtx>(
    () => ({ records, vehicles, users, mechanics, loading, error, refresh, createRecord, updateStatus }),
    [records, vehicles, users, mechanics, loading, error, refresh, createRecord, updateStatus],
  );

  return <MaintenanceContext.Provider value={value}>{children}</MaintenanceContext.Provider>;
};

export default MaintenanceContext;
