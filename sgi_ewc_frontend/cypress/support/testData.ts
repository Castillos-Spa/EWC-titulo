import type { DashboardOverviewResponse } from "../../src/utils/dashboardApi";
import type { RawNotification } from "../../src/types/Notification";
import type { User } from "../../src/types/User";
import type { Ticket } from "../../src/types/Ticket";
import { TicketPriority, TicketStatus } from "../../src/types/Ticket";
import type { OrdenTrabajo } from "../../src/types/OrdenTrabajo";
import type { Aseo } from "../../src/types/Aseo";
import type { CivilWork } from "../../src/types/CivilWork";
import type { Incident } from "../../src/types/Incident";

const ISO_NOW = "2024-05-01T08:00:00.000Z";

export const stubAdminUser: User = {
  id: 1,
  username: "demo.admin",
  email: "demo.admin@example.com",
  areas: ["Transporte", "Taller"],
  roles: ["Admin"],
  roleAssignments: [
    {
      area: "Transporte",
      role: "Supervisor",
      specialty: null,
      additionalPermissions: ["tickets:manage"],
      isActive: true,
    },
  ],
  rolesByArea: {
    Transporte: {
      role: "Supervisor",
      specialty: null,
      permissions: ["tickets:manage", "routes:view"],
    },
  },
  isAdmin: true,
  active: true,
  lastLogin: ISO_NOW,
  createdAt: ISO_NOW,
  updatedAt: ISO_NOW,
  mustChangePassword: false,
};

const dashboardVehicles: DashboardOverviewResponse["transport"] = {
  vehicles: {
    items: [
      {
        id: 11,
        patente: "AAA-10",
        capacidad: 12,
        odometro: 12800,
        marca: "Volvo",
        modelo: "FH",
        estado: "disponible",
        codigo: "TR-001",
        tipo: "Truck",
        createdAt: ISO_NOW,
        updatedAt: ISO_NOW,
        areaAsignada: "Transporte",
        conductorId: 50,
        lastMaintenanceDate: new Date(ISO_NOW),
      },
      {
        id: 12,
        patente: "BBB-20",
        capacidad: 10,
        odometro: 18200,
        marca: "Scania",
        modelo: "R500",
        estado: "en_uso",
        codigo: "TR-002",
        tipo: "Truck",
        createdAt: ISO_NOW,
        updatedAt: ISO_NOW,
        areaAsignada: "Transporte",
        conductorId: 51,
        lastMaintenanceDate: new Date(ISO_NOW),
      },
      {
        id: 13,
        patente: "CCC-30",
        capacidad: 8,
        odometro: 9900,
        marca: "Mercedes",
        modelo: "Actros",
        estado: "en_mantenimiento",
        codigo: "TR-003",
        tipo: "Truck",
        createdAt: ISO_NOW,
        updatedAt: ISO_NOW,
        areaAsignada: "Transporte",
        conductorId: 52,
        lastMaintenanceDate: new Date(ISO_NOW),
      },
    ],
    total: 3,
    page: 1,
    pageSize: 50,
  },
  drivers: {
    items: [stubAdminUser],
    total: 1,
    page: 1,
    pageSize: 50,
  },
};

const dashboardWorkOrders: OrdenTrabajo[] = [
  {
    id: 200,
    tipo: "Correctivo",
    estado: "en_progreso",
    vehiculoId: 11,
    description: "Cambio de frenos",
    scheduledDate: ISO_NOW,
    estimatedCost: 1200,
    observations: "Prioridad alta",
    responsableId: 90,
    repuestos: ["Pastillas", "Discos"],
    tareas: ["Desmontar", "Reemplazar"],
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
  {
    id: 201,
    tipo: "Preventivo",
    estado: "completado",
    vehiculoId: 12,
    description: "Mantención general",
    scheduledDate: ISO_NOW,
    estimatedCost: 600,
    observations: "",
    responsableId: 91,
    repuestos: ["Filtros"],
    tareas: ["Inspeccionar"],
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
];

const cleaningReports: Aseo[] = [
  {
    id: "CL-1",
    date: ISO_NOW,
    area: "Planta norte",
    tasks: ["Barrido", "Desinfección"],
    responsibleStaff: "Equipo A",
    timeSpent: 75,
    issues: [],
    status: "COMPLETED",
    observations: "Sin novedades",
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
  {
    id: "CL-2",
    date: ISO_NOW,
    area: "Hangar central",
    tasks: ["Lavado"],
    responsibleStaff: "Equipo B",
    timeSpent: 45,
    issues: ["Charcos en zona 3"],
    status: "PENDING",
    observations: "Requiere supervisión",
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
  },
];

const civilWorks: CivilWork[] = [
  {
    id: 301,
    project: "Ampliación de bodega",
    location: "Sector industrial",
    startDate: ISO_NOW,
    estimatedEndDate: ISO_NOW,
    actualEndDate: null,
    workType: "CONSTRUCTION",
    tasks: [
      { name: "Movimiento de tierra", completed: true },
      { name: "Estructura metálica", completed: false },
    ],
    progress: 65,
    status: "IN_PROGRESS",
    observations: "Coordinación con proveedores",
    issues: ["Retraso en materiales"],
    photos: [],
    createdById: 1,
    responsibleStaffUsernames: ["arq.jdiaz"],
    materialsUsed: ["Acero", "Hormigón"],
  },
  {
    id: 302,
    project: "Reparación de vialidad",
    location: "Patio de maniobras",
    startDate: ISO_NOW,
    estimatedEndDate: ISO_NOW,
    actualEndDate: ISO_NOW,
    workType: "REPAIR",
    tasks: [{ name: "Compactación", completed: true }],
    progress: 100,
    status: "COMPLETED",
    observations: "",
    issues: [],
    photos: [],
    createdById: 1,
    responsibleStaffUsernames: ["ing.rvera"],
    materialsUsed: ["Asfalto"],
  },
];

const incidentList: Incident[] = [
  {
    id: "INC-1",
    area: "Transporte",
    type: "traffic_delay",
    severity: "critical",
    title: "Retraso por congestión",
    description: "Ruta bloqueada por accidente",
    location: {
      latitude: -33.45,
      longitude: -70.66,
      address: "Autopista Central",
    },
    photos: [],
    reportedBy: "operador.lmendez",
    reportedById: 300,
    reportedAt: ISO_NOW,
    status: "reported",
    syncStatus: "synced",
    routeId: "R-12",
    vehicleId: "TR-002",
    estimatedResolutionTime: ISO_NOW,
    actualResolutionTime: undefined,
    supervisorNotes: "Coordinar desvío",
    reviewedAt: null,
    reviewedById: null,
    updatedAt: ISO_NOW,
  },
];

const rawNotifications: RawNotification[] = [
  {
    id: 701,
    title: "Alerta de combustible",
    message: "Nivel de combustible bajo en flota norte",
    priority: "high",
    createdAt: ISO_NOW,
    scheduledAt: null,
    pinned: false,
    areas: ["Transporte"],
    roles: [],
    createdBy: { username: "coordinador.ops" },
    readBy: [],
    type: "alert",
  },
];

const ticketItems: Ticket[] = [
  {
    id: 9001,
    title: "Corte de VPN afecta despacho",
    description: "La cuadrilla de transporte no puede acceder a sistemas",
    status: TicketStatus.Pendiente,
    priority: TicketPriority.Urgente,
    category: "IT",
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
    createdBy: { id: 40, username: "it.admin" },
    assignedTo: null,
    recipientArea: ["Transporte"],
    recipientRole: ["Supervisor"],
    assignedUserConfirmation: null,
    requestingUserConfirmation: null,
    tags: ["vpn", "incidente"],
  },
  {
    id: 9002,
    title: "Actualización de software de logística",
    description: "Solicitud para nueva versión",
    status: TicketStatus.Resuelto,
    priority: TicketPriority.Media,
    category: "IT",
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
    createdBy: { id: 41, username: "logistica.pm" },
    assignedTo: { id: 56, username: "it.analista" },
    recipientArea: ["IT"],
    recipientRole: ["Especialista"],
    assignedUserConfirmation: true,
    requestingUserConfirmation: true,
    tags: ["software"],
  },
];

const dashboardUsers: User[] = [
  stubAdminUser,
  {
    id: 2,
    username: "operations.lead",
    email: "operations.lead@example.com",
    areas: ["Operaciones"],
    roles: ["Supervisor"],
    roleAssignments: [
      {
        area: "Operaciones",
        role: "Supervisor",
        specialty: null,
        additionalPermissions: ["dashboard:view"],
        isActive: true,
      },
    ],
    rolesByArea: {
      Operaciones: {
        role: "Supervisor",
        specialty: null,
        permissions: ["dashboard:view"],
      },
    },
    isAdmin: false,
    active: true,
    lastLogin: ISO_NOW,
    createdAt: ISO_NOW,
    updatedAt: ISO_NOW,
    mustChangePassword: false,
  },
];

export const dashboardOverviewPayload: DashboardOverviewResponse = {
  transport: dashboardVehicles,
  maintenance: {
    workOrders: {
      items: dashboardWorkOrders,
      total: dashboardWorkOrders.length,
      page: 1,
      pageSize: 50,
    },
  },
  tickets: {
    items: ticketItems,
    total: ticketItems.length,
    page: 1,
    pageSize: 50,
  },
  cleaning: {
    items: cleaningReports,
    total: cleaningReports.length,
    page: 1,
    pageSize: 50,
  },
  civilWorks: {
    items: civilWorks,
    total: civilWorks.length,
    page: 1,
    pageSize: 50,
  },
  incidents: {
    items: incidentList,
    total: incidentList.length,
    page: 1,
    pageSize: 50,
  },
  notifications: {
    items: rawNotifications,
    total: rawNotifications.length,
    page: 1,
    pageSize: 50,
  },
  users: {
    items: dashboardUsers,
    total: dashboardUsers.length,
    page: 1,
    pageSize: 50,
  },
};

export const notificationsFixture: RawNotification[] = rawNotifications;
export const ticketsFixture: Ticket[] = ticketItems;
export const usersFixture: User[] = dashboardUsers;
