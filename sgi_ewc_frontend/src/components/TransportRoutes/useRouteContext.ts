import { useContext } from 'react';
import RouteContext from './RouteContext';

export const useRouteContext = () => {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error('useRouteContext debe usarse dentro de RouteProvider');
  return ctx;
};

export default useRouteContext;