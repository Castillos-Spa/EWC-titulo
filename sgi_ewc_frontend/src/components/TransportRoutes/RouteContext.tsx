import React, { createContext, useState, useMemo, ReactNode } from 'react';

// Tipo principal de una Ruta de transporte (mock)
export interface TransportRoute {
  id: string;
  code: string;           // Código de referencia interno
  origin: string;         // Origen
  destination: string;    // Destino
  distanceKm: number;     // Distancia estimada
  frequency: string;      // Frecuencia (Diaria, Semanal, Adhoc)
  active: boolean;        // Estado
  createdAt: Date;
}

interface RouteContextValue {
  routes: TransportRoute[];
  addRoute: (data: Omit<TransportRoute, 'id' | 'createdAt'>) => void;
  updateRoute: (id: string, changes: Partial<Omit<TransportRoute, 'id' | 'createdAt'>>) => void;
  toggleActive: (id: string) => void;
  kpis: {
    total: number;
    totalDistance: number;
    avgDistance: number;
    activePct: number; // porcentaje de rutas activas
  };
}

const RouteContext = createContext<RouteContextValue | undefined>(undefined);


// Datos iniciales mock
const seed: TransportRoute[] = [
  {
    id: 'r1',
    code: 'R-001',
    origin: 'Base Norte',
    destination: 'Planta Central',
    distanceKm: 120,
    frequency: 'Diaria',
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 5),
  },
  {
    id: 'r2',
    code: 'R-002',
    origin: 'Planta Central',
    destination: 'Puerto',
    distanceKm: 45,
    frequency: 'Semanal',
    active: true,
    createdAt: new Date(Date.now() - 86400000 * 3),
  },
  {
    id: 'r3',
    code: 'R-003',
    origin: 'Puerto',
    destination: 'Base Norte',
    distanceKm: 165,
    frequency: 'Adhoc',
    active: false,
    createdAt: new Date(Date.now() - 86400000 * 10),
  },
];

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routes, setRoutes] = useState<TransportRoute[]>(seed);

  const addRoute: RouteContextValue['addRoute'] = (data) => {
    setRoutes(prev => [
      ...prev,
      {
        id: 'r' + (prev.length + 1 + Math.round(Math.random() * 1000)),
        createdAt: new Date(),
        ...data,
      }
    ]);
  };

  const updateRoute: RouteContextValue['updateRoute'] = (id, changes) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, ...changes } : r));
  };

  const toggleActive: RouteContextValue['toggleActive'] = (id) => {
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const kpis = useMemo(() => {
    const total = routes.length;
    const totalDistance = routes.reduce((acc, r) => acc + r.distanceKm, 0);
    const avgDistance = total ? totalDistance / total : 0;
    const activeCount = routes.filter(r => r.active).length;
    const activePct = total ? (activeCount / total) * 100 : 0;
    return { total, totalDistance, avgDistance, activePct };
  }, [routes]);

  const value = useMemo<RouteContextValue>(() => ({
    routes,
    addRoute,
    updateRoute,
    toggleActive,
    kpis,
  }), [routes, kpis]);

  return <RouteContext.Provider value={value}>{children}</RouteContext.Provider>;
};

export default RouteContext;