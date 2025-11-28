import { useContext } from 'react';
import MaintenanceContext from '../context/MaintenanceContext';

const useMaintenance = () => {
  const ctx = useContext(MaintenanceContext);
  if (!ctx) {
    throw new Error('useMaintenance debe usarse dentro de MaintenanceProvider');
  }
  return ctx;
};

export default useMaintenance;
