// Datos mínimos para el modo demo del frontend web
// Nota: mantener liviano, solo lo necesario para navegar y mostrar ejemplos

export const demoNowIso = () => new Date().toISOString();

export const demoUser = {
  id: 999,
  username: "demo",
  email: "demo@example.com",
  firstName: "Demo",
  lastName: "User",
  active: true,
  roleAssignments: [
    { role: "Lector", specialty: "DRIVER", isActive: true },
  ],
};

export const demoNotifications = {
  items: [
    {
      id: 1,
      title: "Bienvenido al modo Demo",
      message: "Esta es una notificación de ejemplo.",
      priority: "NORMAL",
      createdAt: demoNowIso(),
      scheduledAt: null,
      pinned: false,
      roles: [],
      areas: [],
      type: "GENERAL",
      createdBy: { id: 1, username: "system" },
      readBy: [],
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const demoVehicles = [
  {
    id: 101,
    patente: "ABCZ10",
    marca: "Volvo",
    modelo: "FH",
    tipo: "Camión",
    capacidad: 20000,
    odometro: 123456,
    estado: "disponible",
    areaAsignada: "Transporte",
    codigo: "V-101",
    conductorId: 999,
  lastMaintenanceDate: new Date(),
    createdAt: demoNowIso(),
    updatedAt: demoNowIso(),
  },
  {
    id: 102,
    patente: "JKLZ20",
    marca: "Mercedes",
    modelo: "Actros",
    tipo: "Camión",
    capacidad: 18000,
    odometro: 654321,
    estado: "en_mantenimiento",
    areaAsignada: "Transporte",
    codigo: "V-102",
    conductorId: 999,
  lastMaintenanceDate: new Date(),
    createdAt: demoNowIso(),
    updatedAt: demoNowIso(),
  },
];

export const demoFuelSummary = demoVehicles.map((v) => ({
  ...v,
  fuelLogs: [
    {
      id: 1,
      date: demoNowIso(),
      liters: 120,
      cost: 150000,
      odometer: v.odometro,
      driver: { id: demoUser.id, username: demoUser.username },
      invoiceUrl: null,
      createdAt: demoNowIso(),
    },
  ],
}));

import type { VehicleWithFuelHistory } from "./fuelApi";

export const demoFuelHistoryByVehicleId: Record<number, VehicleWithFuelHistory> = Object.fromEntries(
  demoFuelSummary.map((v) => [v.id, v as VehicleWithFuelHistory])
);

export const demoRoutesAssignments = {
  items: [
    {
      id: 201,
      truckId: 101,
      routeId: 301,
      driverId: demoUser.id,
      date: new Date().toISOString().slice(0, 10),
      status: "assigned",
      startTime: null,
      endTime: null,
      volumeLiters: 5000,
    },
  ],
  total: 1,
  page: 1,
  pageSize: 50,
};

// Rutas de transporte (mínimas para la vista de rutas)
export const demoTransportRoutes = [
  { id: 301, code: 'R-001', origin: 'Planta Norte', destination: 'Bodega Central', distanceKm: 120, frequency: 'Diaria', active: true, createdAt: demoNowIso(), updatedAt: demoNowIso() },
  { id: 302, code: 'R-002', origin: 'Planta Sur', destination: 'Sucursal 2', distanceKm: 85, frequency: 'Semanal', active: true, createdAt: demoNowIso(), updatedAt: demoNowIso() },
  { id: 303, code: 'R-003', origin: 'Bodega Central', destination: 'Cliente Z', distanceKm: 45, frequency: 'Eventual', active: false, createdAt: demoNowIso(), updatedAt: demoNowIso() },
];

export const demoWorkOrders = [
  {
    id: 401,
    vehiculoId: 102,
    tipo: "Preventivo",
    description: "Cambio filtros y revisión general",
    status: "Abierta",
    createdAt: demoNowIso(),
  },
];

export const demoWorkshopOverview = {
  workOrders: {
    items: demoWorkOrders,
    total: demoWorkOrders.length,
    page: 1,
    pageSize: 10,
  },
  vehicles: {
    items: demoVehicles,
    total: demoVehicles.length,
    page: 1,
    pageSize: 10,
  },
  users: {
    items: [demoUser],
    total: 1,
    page: 1,
    pageSize: 10,
  },
  mechanics: {
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
  },
};

export const demoTickets = {
  items: [
    {
      id: 501,
      title: "Solicito acceso a módulo de KPIs",
      description: "No veo el tab de KPIs",
      category: "Acceso",
      priority: "medium",
      status: "open",
      createdAt: demoNowIso(),
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const demoCleaning = {
  items: [
    {
      id: 601,
      date: demoNowIso(),
      area: "Bodegas",
      responsibleStaff: "Equipo A",
      tasks: ["Barrido", "Desinfección"],
      issues: [],
      timeSpent: 120,
      status: "COMPLETED",
      observations: "Sin novedades",
      createdAt: demoNowIso(),
      updatedAt: demoNowIso(),
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const demoIncidents = {
  items: [
    {
      id: 701,
      title: "Retraso por tráfico",
      description: "Obras en la ruta principal",
      area: "Transporte",
      type: "TRAFFIC_DELAY",
      severity: "LOW",
      status: "REPORTED",
      location: { latitude: -33.45, longitude: -70.66, address: "Av. Demo 123" },
      photos: [],
      reportedById: demoUser.id,
      reportedAt: demoNowIso(),
      updatedAt: demoNowIso(),
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const demoCivilWorks = {
  items: [
    {
      id: 801,
      name: "Canalización Perimetral",
      status: "IN_PROGRESS",
      location: "Sector 5",
      createdAt: demoNowIso(),
      updatedAt: demoNowIso(),
    },
  ],
  total: 1,
  page: 1,
  pageSize: 20,
};

export const demoUsersList = {
  items: [demoUser],
  total: 1,
  page: 1,
  pageSize: 200,
};
