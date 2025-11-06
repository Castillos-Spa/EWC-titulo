// Lightweight mock server for frontend-only demo mode
// Splits handlers by domain to reduce complexity and improve maintainability

import {
  demoUser,
  demoNotifications,
  demoRoutesAssignments,
  demoWorkshopOverview,
  demoFuelSummary,
  demoFuelHistoryByVehicleId,
  demoTickets,
  demoCleaning,
  demoIncidents,
  demoCivilWorks,
  demoUsersList,
  demoTransportRoutes,
} from "../demoData";

function stripQuery(p: string): string {
  const i = p.indexOf("?");
  return i >= 0 ? p.slice(0, i) : p;
}

// --- Basic localStorage persistence helpers ---
const LS_KEYS = {
  notifications: "demo:notifications",
  workOrders: "demo:workOrders",
  tickets: "demo:tickets",
  routes: "demo:routes",
  civilWorks: "demo:civilWorks",
};

function loadPersisted<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback) && !Array.isArray(parsed) ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

function savePersisted<T>(key: string, value: T): void {
  try { globalThis.localStorage?.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// --- In-memory demo state ---
const state = {
  notifications: loadPersisted(
    LS_KEYS.notifications,
    (() => {
      const items = (demoNotifications as any)?.items ?? [];
      return items.map((n: any) => ({ ...n }));
    })()
  ),
  routes: loadPersisted(
    LS_KEYS.routes,
    demoTransportRoutes.map((r) => ({ ...r }))
  ),
  workOrders: loadPersisted(
    LS_KEYS.workOrders,
    ((demoWorkshopOverview as any)?.workOrders?.items ?? []).map((w: any) => ({ ...w }))
  ),
  tickets: loadPersisted(
    LS_KEYS.tickets,
    (((demoTickets as any)?.items) ?? []).map((t: any) => ({ ...t }))
  ),
  civilWorks: loadPersisted(
    LS_KEYS.civilWorks,
    (((demoCivilWorks as any)?.items) ?? []).map((c: any) => ({ ...c }))
  ),
};

// Helpers
const jsonBody = (options?: RequestInit): any => {
  if (!options?.body) return {};
  if (typeof options.body === "string") {
    try { return JSON.parse(options.body); } catch { return {}; }
  }
  return options.body as any;
};

// Handlers return undefined if they don't handle the request
type MaybePromise<T> = T | Promise<T>;
type Handler = (cleanPath: string, method: string, options?: RequestInit) => MaybePromise<any>;

// Auth
const handleAuthLogin = (cleanPath: string, method: string, options?: RequestInit) => {
  if (cleanPath !== "/auth/login" || method !== "POST") return undefined;
  let email: string | undefined;
  const body = jsonBody(options);
  if (typeof body?.email === 'string') email = body.email;
  const normalizedEmail = email && /@/.test(email) ? email : demoUser.email;
  // Demo: entregar un usuario con visión completa (admin) para mostrar todas las secciones
  const allAreas = [
    'IT','Transporte','Taller','Obras','Aseo','RRHH','Finanza','P_Riesgo'
  ];
  const user = {
    ...demoUser,
    email: normalizedEmail,
    username: normalizedEmail.split('@')[0],
    isAdmin: true,
    roles: ['Admin'],
    areas: allAreas,
    rolesByArea: allAreas.reduce((acc: any, area: string) => {
      acc[area] = { role: 'Admin', specialty: null, permissions: ['*'] };
      return acc;
    }, {} as Record<string, any>),
  } as any;
  try {
    localStorage.setItem("demoMode", "true");
    localStorage.setItem("authToken", "demo-access-token");
    localStorage.setItem("refreshToken", "demo-refresh-token");
    localStorage.setItem("userData", JSON.stringify(user));
    globalThis.dispatchEvent?.(new CustomEvent("session-refreshed", { detail: user }));
  } catch {}
  return { access_token: "demo-access-token", refresh_token: "demo-refresh-token", user };
};

const handleAuthProfile = (cleanPath: string, method: string) => {
  if (cleanPath !== "/auth/profile" || method !== "GET") return undefined;
  try {
    const raw = localStorage.getItem('userData');
    if (raw) return JSON.parse(raw);
  } catch {}
  // Fallback: perfil admin completo en demo
  const allAreas = [
    'IT','Transporte','Taller','Obras','Aseo','RRHH','Finanza','P_Riesgo'
  ];
  return {
    ...demoUser,
    isAdmin: true,
    roles: ['Admin'],
    areas: allAreas,
    rolesByArea: allAreas.reduce((acc: any, area: string) => {
      acc[area] = { role: 'Admin', specialty: null, permissions: ['*'] };
      return acc;
    }, {} as Record<string, any>),
  } as any;
};

const handleAuthLogout = (cleanPath: string) => {
  if (cleanPath !== "/auth/logout") return undefined;
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("demoMode");
    localStorage.removeItem("autoStartTour");
    // Clear persisted demo state
    localStorage.removeItem(LS_KEYS.notifications);
    localStorage.removeItem(LS_KEYS.workOrders);
    localStorage.removeItem(LS_KEYS.tickets);
    localStorage.removeItem(LS_KEYS.routes);
    localStorage.removeItem(LS_KEYS.civilWorks);
  } catch {}
  return { message: "Cierre de sesión (demo)" };
};

const authHandler: Handler = (cleanPath, method, options) =>
  handleAuthLogin(cleanPath, method, options) ??
  handleAuthProfile(cleanPath, method) ??
  handleAuthLogout(cleanPath);

// Dashboard
const dashboardHandler: Handler = (cleanPath, method) => {
  if (cleanPath.startsWith("/dashboard/overview") && method === "GET") {
    return {
      transport: {
        vehicles: {
          items: demoFuelSummary.map(v => ({
            id: v.id,
            patente: v.patente,
            capacidad: v.capacidad,
            odometro: v.odometro,
            marca: v.marca,
            modelo: v.modelo,
            estado: v.estado,
            codigo: v.codigo,
            tipo: v.tipo,
            createdAt: v.createdAt,
            updatedAt: v.updatedAt,
            areaAsignada: v.areaAsignada,
            conductorId: v.conductorId,
            lastMaintenanceDate: v.lastMaintenanceDate,
          })),
          total: demoFuelSummary.length,
          page: 1,
          pageSize: 10,
        },
        drivers: demoUsersList,
      },
      maintenance: {
        workOrders: {
          items: state.workOrders,
          total: state.workOrders.length,
          page: 1,
          pageSize: 10,
        },
      },
  tickets: demoTickets,
  cleaning: demoCleaning,
  civilWorks: { items: state.civilWorks, total: state.civilWorks.length, page: 1, pageSize: 50 },
      incidents: demoIncidents,
      notifications: { items: state.notifications, total: state.notifications.length, page: 1, pageSize: 20 },
      users: demoUsersList,
    };
  }
};

// Notifications
const notifGet = (cleanPath: string, method: string) => {
  if (cleanPath !== "/notification" || method !== "GET") return undefined;
  return { items: state.notifications, total: state.notifications.length, page: 1, pageSize: 20 };
};

const notifPost = (cleanPath: string, method: string, options?: RequestInit) => {
  if (cleanPath !== "/notification" || method !== "POST") return undefined;
  const body = jsonBody(options);
  const nextId = Math.floor(Math.random() * 100000) + 1000;
  const now = new Date().toISOString();
  const target = body?.target ?? { scope: 'global' };
  const areas = target?.scope === 'areas' ? (target.areas ?? []) : [];
  const roles = target?.scope === 'roles' ? (target.roles ?? []) : [];
  const created = {
    id: nextId,
    title: body?.title ?? 'Aviso',
    message: body?.message ?? '',
    priority: body?.priority ?? 'normal',
    createdAt: now,
    scheduledAt: body?.scheduledAt ?? null,
    pinned: false,
    areas,
    roles,
    createdBy: { username: (demoUser?.username ?? 'system') },
    readBy: [],
    type: 'GENERAL',
  };
  state.notifications = [created, ...state.notifications];
  savePersisted(LS_KEYS.notifications, state.notifications);
  return created;
};

function getCurrentUserId(): number {
  try {
    const rawUser = globalThis.localStorage?.getItem('userData');
    const u = rawUser ? JSON.parse(rawUser) : null;
    return Number(u?.id ?? demoUser?.id ?? 0) || 0;
  } catch {
    return Number(demoUser?.id ?? 0) || 0;
  }
}

function markAsRead(updated: any, notifId: number) {
  const userId = getCurrentUserId();
  const arr = Array.isArray(updated.readBy) ? updated.readBy : [];
  if (!arr.some((r: any) => Number(r.userId) === Number(userId))) {
    arr.push({ userId, notificationId: notifId, read: true });
  }
  updated.readBy = arr;
}

const notifPatch = (cleanPath: string, method: string, options?: RequestInit) => {
  if (!cleanPath.startsWith("/notification/") || method !== "PATCH") return undefined;
  const idStr = cleanPath.split("/").pop() || "0";
  const notifId = Number(idStr);
  const body = jsonBody(options);
  const idx = state.notifications.findIndex((n: any) => Number(n.id) === notifId);
  const base = idx >= 0 ? state.notifications[idx] : undefined;
  const defaults = {
    id: notifId,
    title: 'Aviso',
    message: '',
    priority: 'normal',
    createdAt: new Date().toISOString(),
    scheduledAt: null,
    pinned: false,
    areas: [],
    roles: [],
    createdBy: { username: 'system' },
    readBy: [],
    type: 'GENERAL',
  };
  let updated: any = base ? { ...base } : { ...defaults };
  if (typeof body.title === 'string') updated.title = body.title;
  if (typeof body.message === 'string') updated.message = body.message;
  if (typeof body.priority === 'string') updated.priority = body.priority;
  if (typeof body.pinned === 'boolean') updated.pinned = body.pinned;
  if (body.read === true) markAsRead(updated, notifId);
  if (idx >= 0) state.notifications[idx] = updated; else state.notifications.push(updated);
  savePersisted(LS_KEYS.notifications, state.notifications);
  return updated;
};

const notificationsHandler: Handler = (cleanPath, method, options) =>
  notifGet(cleanPath, method) ?? notifPost(cleanPath, method, options) ?? notifPatch(cleanPath, method, options);

// Routes
const routesHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/routes/assignments" && method === "GET") return demoRoutesAssignments;
  if (cleanPath === "/routes" && method === "GET") return state.routes;
  if (cleanPath.startsWith("/routes/") && method === "GET") {
    const id = Number(cleanPath.split("/").pop() || 0);
    return state.routes.find((r: any) => Number(r.id) === id) ?? { statusCode: 404, message: "Not found (demo)" };
  }
};

const routesMutationHandler: Handler = (cleanPath, method, options) => {
  if (cleanPath === "/routes" && method === "POST") {
    const body = jsonBody(options);
    const id = Math.floor(Math.random() * 10000) + 300;
    const now = new Date().toISOString();
    const created = {
      id,
      code: body?.code ?? `R-${id}`,
      origin: body?.origin ?? 'Origen',
      destination: body?.destination ?? 'Destino',
      distanceKm: Number(body?.distanceKm) || 0,
      frequency: body?.frequency ?? 'Diaria',
      active: typeof body?.active === 'boolean' ? body.active : true,
      createdAt: now,
      updatedAt: now,
    };
    state.routes = [created, ...state.routes];
    savePersisted(LS_KEYS.routes, state.routes);
    return created;
  }
  if (cleanPath.startsWith("/routes/") && method === "PATCH") {
    const id = Number(cleanPath.split("/").pop() || 0);
    const body = jsonBody(options);
    const idx = state.routes.findIndex((r: any) => Number(r.id) === id);
    if (idx >= 0) {
      state.routes[idx] = { ...state.routes[idx], ...body, updatedAt: new Date().toISOString() };
      savePersisted(LS_KEYS.routes, state.routes);
      return state.routes[idx];
    }
    return { id, ok: true };
  }
  if (cleanPath.startsWith("/routes/") && method === "DELETE") {
    const id = Number(cleanPath.split("/").pop() || 0);
    state.routes = state.routes.filter((r: any) => Number(r.id) !== id);
    savePersisted(LS_KEYS.routes, state.routes);
    return { id, deleted: true };
  }
};

// Workshop (handlers divididos por ruta para bajar complejidad)
const workshopOverviewHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/workshop/overview" && method === "GET") {
    return {
      ...demoWorkshopOverview,
      workOrders: {
        items: state.workOrders,
        total: state.workOrders.length,
        page: 1,
        pageSize: 10,
      },
    };
  }
};

const workOrdersListHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/workshop/work-orders" && method === "GET") {
    return { items: state.workOrders, total: state.workOrders.length, page: 1, pageSize: 50 };
  }
};

const workOrdersCreateHandler: Handler = (cleanPath, method, options) => {
  if (cleanPath === "/workshop/work-orders" && method === "POST") {
    const body = jsonBody(options);
    const newId = Math.floor(Math.random() * 10000) + 1000;
    const now = new Date().toISOString();
    const created = {
      id: newId,
      vehiculoId: Number(body?.vehiculoId) || 0,
      tipo: body?.tipo ?? 'Preventivo',
      description: body?.description ?? '',
      estado: 'abierta',
      repuestos: Array.isArray(body?.repuestos) ? body.repuestos : [],
      tareas: Array.isArray(body?.tareas) ? body.tareas : [],
      responsableId: typeof body?.responsableId === 'number' ? body.responsableId : null,
      scheduledDate: typeof body?.scheduledDate === 'string' ? body.scheduledDate : undefined,
      estimatedCost: typeof body?.estimatedCost === 'number' ? body.estimatedCost : undefined,
      observations: typeof body?.observations === 'string' ? body.observations : undefined,
      createdAt: now,
      updatedAt: now,
    };
    state.workOrders = [created, ...state.workOrders];
    savePersisted(LS_KEYS.workOrders, state.workOrders);
    return created;
  }
};

const workOrderStatusHandler: Handler = (cleanPath, method, options) => {
  if (cleanPath.startsWith("/workshop/work-orders/") && cleanPath.endsWith("/status") && method === "PATCH") {
    const id = Number(cleanPath.split("/").slice(-2)[0] || 0);
    const body = jsonBody(options);
    const idx = state.workOrders.findIndex((w: any) => Number(w.id) === id);
    const mapStatus = (s: string | undefined) => {
      if (!s) return 'abierta';
      const v = String(s).toLowerCase();
      if (v.includes('abier')) return 'abierta';
      if (v.includes('progre') || v.includes('proceso')) return 'en_progreso';
      if (v.includes('pend')) return 'pendiente_revision';
      if (v.includes('cerr') || v.includes('compl')) return 'completado';
      return 'abierta';
    };
    const nextEstado = mapStatus(body?.status);
    if (idx >= 0) {
      state.workOrders[idx] = { ...state.workOrders[idx], estado: nextEstado, updatedAt: new Date().toISOString() };
      savePersisted(LS_KEYS.workOrders, state.workOrders);
      return state.workOrders[idx];
    }
    return { id, estado: nextEstado };
  }
};

const workOrderUpdateHandler: Handler = (cleanPath, method, options) => {
  if (cleanPath.startsWith("/workshop/work-orders/") && method === "PATCH") {
    const id = Number(cleanPath.split("/").pop() || 0);
    const body = jsonBody(options);
    const idx = state.workOrders.findIndex((w: any) => Number(w.id) === id);
    if (idx >= 0) {
      state.workOrders[idx] = { ...state.workOrders[idx], ...body, updatedAt: new Date().toISOString() };
      savePersisted(LS_KEYS.workOrders, state.workOrders);
      return state.workOrders[idx];
    }
    return { id, ok: true };
  }
};

// Fuel
const fuelHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/fuel/summary" && method === "GET") return demoFuelSummary;
  if (cleanPath.startsWith("/fuel/history/") && method === "GET") {
    const vehId = Number(cleanPath.split("/").pop() || 0);
    return (demoFuelHistoryByVehicleId as any)[vehId] ?? null;
  }
};

// Tickets
const normalizeTicketStatus = (val: unknown): string => {
  const map: Record<string, string> = {
    pendiente: 'Pendiente',
    open: 'Pendiente',
    enprogreso: 'EnProgreso',
    in_progress: 'EnProgreso',
    resuelto: 'Resuelto',
    resolved: 'Resuelto',
    cerrado: 'Cerrado',
    closed: 'Cerrado',
  };
  const key = typeof val === 'string' ? val.toLowerCase() : '';
  return map[key] ?? 'Pendiente';
};

const normalizeTicketPriority = (val: unknown): string => {
  const map: Record<string, string> = {
    baja: 'Baja',
    low: 'Baja',
    media: 'Media',
    medium: 'Media',
    alta: 'Alta',
    high: 'Alta',
    urgente: 'Urgente',
    urgent: 'Urgente',
  };
  const key = typeof val === 'string' ? val.toLowerCase() : '';
  return map[key] ?? 'Media';
};
const ticketsHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/tickets" && method === "GET") return { items: state.tickets, total: state.tickets.length, page: 1, pageSize: 50 };
  if (cleanPath.startsWith("/tickets/") && method === "GET") {
    const id = Number(cleanPath.split("/").pop() || 0);
    return state.tickets.find((t: any) => Number(t.id) === id) ?? { statusCode: 404, message: "Not found (demo)" };
  }
};

const ticketsMutationHandler: Handler = (cleanPath, method, options) => {
  if (cleanPath === "/tickets" && method === "POST") {
    const body = jsonBody(options);
    const id = Math.floor(Math.random() * 10000) + 500;
    const now = new Date().toISOString();
    const normalizedStatus = normalizeTicketStatus(body?.status);
    const normalizedPriority = normalizeTicketPriority(body?.priority);
    const created = {
      id,
      title: body?.title ?? 'Nuevo ticket',
      description: body?.description ?? '',
      category: body?.category ?? 'General',
      priority: normalizedPriority,
      status: normalizedStatus,
      recipientArea: Array.isArray(body?.recipientArea) ? body.recipientArea : [],
      recipientRole: Array.isArray(body?.recipientRole) ? body.recipientRole : [],
      tags: Array.isArray(body?.tags) ? body.tags : [],
      createdAt: now,
      updatedAt: now,
      createdBy: body?.createdBy?.id && body?.createdBy?.username
        ? body.createdBy
        : { id: 999, username: 'demo' },
      assignedTo: body?.assignedTo ?? null,
      assignedUserConfirmation: null,
      requestingUserConfirmation: null,
    };
    state.tickets = [created, ...state.tickets];
    savePersisted(LS_KEYS.tickets, state.tickets);
    return created;
  }
  if (cleanPath.startsWith("/tickets/") && method === "PATCH") {
    const id = Number(cleanPath.split("/").pop() || 0);
    const body = jsonBody(options);
    const idx = state.tickets.findIndex((t: any) => Number(t.id) === id);
    if (idx >= 0) {
      state.tickets[idx] = { ...state.tickets[idx], ...body, updatedAt: new Date().toISOString() };
      savePersisted(LS_KEYS.tickets, state.tickets);
      return state.tickets[idx];
    }
    return { id, ok: true };
  }
  // (resto de mutaciones específicas pasan a otro handler)
};

const ticketsApprovalsHandler: Handler = (cleanPath, method) => {
  if (/^\/tickets\/\d+\/approvals\/.+/.test(cleanPath) && method === "PATCH") {
    const tid = Number(cleanPath.split("/")[2] || 0);
    const found = state.tickets.find((t: any) => Number(t.id) === tid);
    return found ?? { id: tid, ok: true };
  }
};

// Cleaning
const cleaningHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/cleaning" && method === "GET") return demoCleaning;
};

// Incidents
const incidentsHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/incident" && method === "GET") return demoIncidents;
};

// Civil works
const civilWorksHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/civil-work" && method === "GET") return { items: state.civilWorks, total: state.civilWorks.length, page: 1, pageSize: 50 };
  if (cleanPath.startsWith("/civil-work/") && method === "GET") {
    const id = Number(cleanPath.split("/").pop() || 0);
    return state.civilWorks.find((c: any) => Number(c.id) === id) ?? { statusCode: 404, message: "Not found (demo)" };
  }
};

// Helpers Civil Works
const cwProgress = (tasks?: any[]): number => {
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;
  const done = tasks.filter(t => !!t?.completed).length;
  return Math.round((done / tasks.length) * 100);
};
const cwStatusFromProgress = (progress: number, fallback: string = 'PENDING'): string => {
  if (progress >= 100) return 'COMPLETED';
  if (progress > 0) return 'IN_PROGRESS';
  return fallback;
};

const civilWorksCreateHandler: Handler = (cleanPath, method, options) => {
  if (cleanPath !== "/civil-work" || method !== "POST") return undefined;
  const body = jsonBody(options);
  const id = Math.floor(Math.random() * 100000) + 800;
  const progress = cwProgress(body?.tasks);
  const status = body?.status ?? cwStatusFromProgress(progress, 'PENDING');
  const created = {
    id,
    project: body?.project ?? 'Nueva obra',
    location: body?.location ?? 'Sin ubicación',
    startDate: body?.startDate ?? new Date().toISOString(),
    estimatedEndDate: body?.estimatedEndDate ?? new Date(Date.now() + 7*24*3600*1000).toISOString(),
    actualEndDate: body?.actualEndDate ?? null,
    workType: body?.workType ?? 'INSPECTION',
    tasks: Array.isArray(body?.tasks) ? body.tasks : [],
    progress,
    status,
    observations: body?.observations ?? '',
    issues: Array.isArray(body?.issues) ? body.issues : [],
    photos: Array.isArray(body?.photos) ? body.photos : [],
    createdById: body?.createdById ?? 999,
    responsibleStaffUsernames: Array.isArray(body?.responsibleStaffUsernames) ? body.responsibleStaffUsernames : [],
    materialsUsed: Array.isArray(body?.materialsUsed) ? body.materialsUsed : [],
  };
  state.civilWorks = [created, ...state.civilWorks];
  savePersisted(LS_KEYS.civilWorks, state.civilWorks);
  return created;
};

const civilWorksUpdateHandler: Handler = (cleanPath, method, options) => {
  if (!cleanPath.startsWith("/civil-work/") || method !== "PATCH") return undefined;
  const parts = cleanPath.split("/");
  if (parts.length >= 4 && parts[3] === 'tasks') return undefined; // delegado a tasks handler
  const id = Number(parts[2] || 0);
  const body = jsonBody(options);
  const idx = state.civilWorks.findIndex((c: any) => Number(c.id) === id);
  if (idx < 0) return { statusCode: 404, message: "Not found (demo)" };
  const patch = { ...body };
  if (Array.isArray(patch.tasks)) {
    const p = cwProgress(patch.tasks);
    patch.progress = p;
    patch.status = cwStatusFromProgress(p, state.civilWorks[idx].status || 'PENDING');
    if (patch.status === 'COMPLETED' && !state.civilWorks[idx].actualEndDate) patch.actualEndDate = new Date().toISOString();
  }
  state.civilWorks[idx] = { ...state.civilWorks[idx], ...patch };
  savePersisted(LS_KEYS.civilWorks, state.civilWorks);
  return state.civilWorks[idx];
};

const civilWorksTasksHandler: Handler = (cleanPath, method, options) => {
  if (!cleanPath.startsWith("/civil-work/") || method !== "PATCH") return undefined;
  const parts = cleanPath.split("/");
  if (!(parts.length >= 4 && parts[3] === 'tasks')) return undefined;
  const id = Number(parts[2] || 0);
  const body = jsonBody(options);
  const idx = state.civilWorks.findIndex((c: any) => Number(c.id) === id);
  if (idx < 0) return { statusCode: 404, message: "Not found (demo)" };
  const tasks = Array.isArray(body?.tasks) ? body.tasks : [];
  const p = cwProgress(tasks);
  const st = cwStatusFromProgress(p, state.civilWorks[idx].status || 'PENDING');
  const actualEndDate = st === 'COMPLETED' ? (state.civilWorks[idx].actualEndDate ?? new Date().toISOString()) : state.civilWorks[idx].actualEndDate ?? null;
  state.civilWorks[idx] = { ...state.civilWorks[idx], tasks, progress: p, status: st, actualEndDate };
  savePersisted(LS_KEYS.civilWorks, state.civilWorks);
  return state.civilWorks[idx];
};

const civilWorksDeleteHandler: Handler = (cleanPath, method) => {
  if (!cleanPath.startsWith("/civil-work/") || method !== "DELETE") return undefined;
  const id = Number(cleanPath.split("/").pop() || 0);
  const before = state.civilWorks.length;
  state.civilWorks = state.civilWorks.filter((c: any) => Number(c.id) !== id);
  savePersisted(LS_KEYS.civilWorks, state.civilWorks);
  return { id, ok: true, removed: before !== state.civilWorks.length };
};

// Users
const usersHandler: Handler = (cleanPath, method) => {
  if (cleanPath.startsWith("/users") && method === "GET") return demoUsersList;
};

// Vehicles
const vehiclesHandler: Handler = (cleanPath, method) => {
  if (cleanPath === "/vehicles" && method === "GET") {
    return {
      items: demoFuelSummary.map(v => ({
        id: v.id,
        patente: v.patente,
        capacidad: v.capacidad,
        odometro: v.odometro,
        marca: v.marca,
        modelo: v.modelo,
        estado: v.estado,
        codigo: v.codigo,
        tipo: v.tipo,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        areaAsignada: v.areaAsignada,
        conductorId: v.conductorId,
        lastMaintenanceDate: v.lastMaintenanceDate,
      })),
      total: demoFuelSummary.length,
      page: 1,
      pageSize: 50,
    };
  }
  if (cleanPath.startsWith("/vehicles/") && method === "GET") {
    const id = Number(cleanPath.split("/").pop() || 0);
    const v = demoFuelSummary.find(x => x.id === id);
    if (!v) return { statusCode: 404, message: "Not found (demo)" };
    return {
      id: v.id,
      patente: v.patente,
      capacidad: v.capacidad,
      odometro: v.odometro,
      marca: v.marca,
      modelo: v.modelo,
      estado: v.estado,
      codigo: v.codigo,
      tipo: v.tipo,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      areaAsignada: v.areaAsignada,
      conductorId: v.conductorId,
      lastMaintenanceDate: v.lastMaintenanceDate,
    };
  }
};

// Fallback handlers
const mutationEchoHandler: Handler = (cleanPath, method, options) => {
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const body = jsonBody(options);
    return { ok: true, path: cleanPath, method, echo: body ?? {} };
  }
};

const listFallbackHandler: Handler = (_cleanPath, method) => {
  if (method === "GET") return { items: [], total: 0, page: 1, pageSize: 20 };
};

const handlers: Handler[] = [
  authHandler,
  dashboardHandler,
  notificationsHandler,
  routesHandler,
  routesMutationHandler,
  workshopOverviewHandler,
  workOrdersListHandler,
  workOrdersCreateHandler,
  workOrderStatusHandler,
  workOrderUpdateHandler,
  fuelHandler,
  ticketsHandler,
  ticketsMutationHandler,
  ticketsApprovalsHandler,
  civilWorksHandler,
  civilWorksCreateHandler,
  civilWorksUpdateHandler,
  civilWorksTasksHandler,
  civilWorksDeleteHandler,
  cleaningHandler,
  incidentsHandler,
  civilWorksHandler,
  usersHandler,
  vehiclesHandler,
  mutationEchoHandler,
  listFallbackHandler,
];

export async function demoHandle(path: string, options?: RequestInit): Promise<unknown> {
  const method = (options?.method || "GET").toUpperCase();
  const cleanPath = stripQuery(path.startsWith("/") ? path : `/${path}`);
  // Demo utilities
  if (cleanPath === "/demo/reset" && method === "POST") {
    // Reset in-memory state to seed data and persist
    const seededNotifs = (() => {
      const items = (demoNotifications as any)?.items ?? [];
      return items.map((n: any) => ({ ...n }));
    })();
    const seededWorkOrders = ((demoWorkshopOverview as any)?.workOrders?.items ?? []).map((w: any) => ({ ...w }));
    const seededRoutes = demoTransportRoutes.map((r) => ({ ...r }));
    const seededTickets = (((demoTickets as any)?.items) ?? []).map((t: any) => ({ ...t }));
    const seededCivil = (((demoCivilWorks as any)?.items) ?? []).map((c: any) => ({ ...c }));
    state.notifications = seededNotifs;
    state.workOrders = seededWorkOrders;
    state.routes = seededRoutes;
    state.tickets = seededTickets;
    state.civilWorks = seededCivil;
    savePersisted(LS_KEYS.notifications, state.notifications);
    savePersisted(LS_KEYS.workOrders, state.workOrders);
    savePersisted(LS_KEYS.routes, state.routes);
    savePersisted(LS_KEYS.tickets, state.tickets);
    savePersisted(LS_KEYS.civilWorks, state.civilWorks);
    return { ok: true, notifications: state.notifications.length, workOrders: state.workOrders.length, routes: state.routes.length, tickets: state.tickets.length, civilWorks: state.civilWorks.length };
  }
  for (const h of handlers) {
    const res = await h(cleanPath, method, options);
    if (res !== undefined) return res;
  }
  return { items: [], total: 0, page: 1, pageSize: 20 };
}

export default demoHandle;
