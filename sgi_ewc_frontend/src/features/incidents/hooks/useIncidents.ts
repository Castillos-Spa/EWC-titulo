import { useContext } from 'react';
import IncidentsContext from '../context/IncidentsContext';

export const useIncidents = () => {
  const ctx = useContext(IncidentsContext);
  if (!ctx) throw new Error('useIncidents debe usarse dentro de IncidentsProvider');
  return ctx;
};

export default useIncidents;