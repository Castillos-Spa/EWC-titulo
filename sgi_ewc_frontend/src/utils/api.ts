//
const DEMO_MODE: boolean = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";
const DEMO_API_URL: string | undefined = import.meta.env.VITE_DEMO_API_URL as string | undefined;
const API_BASE = (DEMO_MODE && DEMO_API_URL) ? DEMO_API_URL : (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1");

let isRefreshing = false;
type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

let failedQueue: PendingRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  for (const pending of failedQueue) {
    if (error) {
      pending.reject(error);
      continue;
    }
    if (token) {
      pending.resolve(token);
    }
  }
  failedQueue = [];
};

const handleLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
  // Disparamos un evento global para que la UI reaccione (AuthContext lo escucha).
  globalThis.dispatchEvent?.(new Event("session-expired"));
};

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const err: ApiError = new Error(data?.message || response.statusText);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return data;
};

async function apiFetch(path: string, options?: RequestInit) {
  // Modo demo interno (sin backend demo). Si DEMO_MODE y no hay DEMO_API_URL, o si está activo por runtime (localStorage), interceptamos aquí.
  const runtimeDemo = (() => {
    try {
      return globalThis?.localStorage?.getItem("demoMode") === "true";
    } catch {
      return false;
    }
  })();

  // Permitir forzar demo desde el login añadiendo ?demo=1 o header X-Demo-Login
  const isForcedDemoLogin = (() => {
    const p = typeof path === 'string' ? path : '';
    const clean = p.startsWith('/') ? p : `/${p}`;
    const hasQueryDemo = /\bdemo=1\b/.test(clean);
    const hasHeaderDemo = !!(options?.headers && (options.headers as Record<string, string>)["X-Demo-Login"]);
    const isLoginPath = clean.replace(/\?.*$/, '') === '/auth/login';
    return isLoginPath && (hasQueryDemo || hasHeaderDemo);
  })();

  if ((DEMO_MODE && !DEMO_API_URL) || runtimeDemo || isForcedDemoLogin) {
    return demoHandle(path, options);
  }
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = options ? { ...options, headers } : { headers };
  let res = await fetch(url, init);

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      handleLogout();
      throw new Error("Session expired. No refresh token found.");
    }

    if (isRefreshing) {
      // Si ya se está refrescando, encolamos la petición para reintentarla después.
      return new Promise<Response>((resolve, reject) => {
        failedQueue.push({
          resolve: (newAccessToken) => {
            headers["Authorization"] = `Bearer ${newAccessToken}`;
            resolve(fetch(url, { ...init, headers }));
          },
          reject,
        });
      }).then(parseJsonResponse);
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) throw new Error("Session expired");

      const { access_token: newAccessToken, user: refreshedUser } =
        await refreshRes.json();
      if (!newAccessToken) throw new Error("Session expired");
      localStorage.setItem("authToken", newAccessToken);
      if (refreshedUser) {
        localStorage.setItem("userData", JSON.stringify(refreshedUser));
        globalThis.dispatchEvent?.(
          new CustomEvent("session-refreshed", { detail: refreshedUser })
        );
      }
      headers["Authorization"] = `Bearer ${newAccessToken}`;
      processQueue(null, newAccessToken); // Procesamos la cola de peticiones pendientes.
      res = await fetch(url, { ...init, headers }); // Reintentamos la petición original.
    } catch (error) {
      processQueue(error as Error, null);
      handleLogout();
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return parseJsonResponse(res);
}

export default apiFetch;

type ApiError = Error & {
  status?: number;
  body?: unknown;
};

// --- Implementación de modo demo (frontend-only) ---
import {
  demoUser,
  demoNotifications,
  demoRoutesAssignments,
  demoTransportRoutes,
  demoWorkshopOverview,
  demoFuelSummary,
  demoFuelHistoryByVehicleId,
  demoTickets,
  demoCleaning,
  demoIncidents,
  demoCivilWorks,
  demoUsersList,
} from "./demoData";

function stripQuery(p: string): string {
  const i = p.indexOf("?");
  return i >= 0 ? p.slice(0, i) : p;
}

async function demoHandle(path: string, options?: RequestInit): Promise<unknown> {
  const method = (options?.method || "GET").toUpperCase();
  const cleanPath = stripQuery(path.startsWith("/") ? path : `/${path}`);

  // Auth
  if (cleanPath === "/auth/login" && method === "POST") {
    // Cualquier credencial funciona en demo
    let emailFromBody: string | undefined;
    try {
      if (options?.body && typeof options.body === 'string') {
        const parsed = JSON.parse(options.body);
        if (typeof parsed?.email === 'string') emailFromBody = parsed.email;
      }
    } catch {
      // ignore
    }
    const normalizedEmail = emailFromBody && /@/.test(emailFromBody)
      ? emailFromBody
      : demoUser.email;
    const username = normalizedEmail.split('@')[0] || demoUser.username;
    const user = { ...demoUser, email: normalizedEmail, username };
    const tokens = {
      access_token: "demo-access-token",
      refresh_token: "demo-refresh-token",
      user,
    };
    // Side effects mínimos para integrarse con el AuthContext
    try {
      localStorage.setItem("demoMode", "true");
      localStorage.setItem("authToken", tokens.access_token);
      localStorage.setItem("refreshToken", tokens.refresh_token);
      localStorage.setItem("userData", JSON.stringify(tokens.user));
      // Notificar que hay sesión disponible
      globalThis.dispatchEvent?.(
        new CustomEvent("session-refreshed", { detail: tokens.user })
      );
    } catch {
      // ignore demo localStorage errors (e.g., private mode)
    }
    return tokens;
  }
  if (cleanPath === "/auth/profile" && method === "GET") {
    return demoUser;
  }
  if (cleanPath === "/auth/logout") {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    } catch {
      // ignore demo localStorage errors (e.g., private mode)
    }
    return { message: "Cierre de sesión (demo)" };
  }

  // Dashboard overview
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
          items: [],
          total: 0,
          page: 1,
          pageSize: 10,
        },
      },
      tickets: demoTickets,
      cleaning: demoCleaning,
      civilWorks: demoCivilWorks,
      incidents: demoIncidents,
      notifications: demoNotifications,
      users: demoUsersList,
    };
  }

  // Notificaciones
  if (cleanPath === "/notification" && method === "GET") {
    return demoNotifications;
  }
  if (cleanPath === "/notification" && method === "POST") {
    // Crear notificación simulada devolviendo RawNotification
    let payload: any = {};
    try { if (typeof options?.body === 'string') payload = JSON.parse(options.body); } catch {}
    const nextId = Math.floor(Math.random() * 100000) + 1000;
    const now = new Date().toISOString();
    const target = payload?.target ?? { scope: 'global' };
    const areas = target?.scope === 'areas' ? (target.areas ?? []) : [];
    const roles = target?.scope === 'roles' ? (target.roles ?? []) : [];
    const created = {
      id: nextId,
      title: payload?.title ?? 'Aviso',
      message: payload?.message ?? '',
      priority: payload?.priority ?? 'normal',
      createdAt: now,
      scheduledAt: payload?.scheduledAt ?? null,
      pinned: false,
      areas,
      roles,
      createdBy: { username: (demoUser?.username ?? 'system') },
      readBy: [],
      type: 'GENERAL',
    };
    return created;
  }
  if (cleanPath.startsWith("/notification/") && method === "PATCH") {
    // Marcar como leída, fijar o editar; devolver RawNotification coherente
    const idStr = cleanPath.split("/").pop() || "0";
    const notifId = Number(idStr);
    let patch: any = {};
    try { if (typeof options?.body === 'string') patch = JSON.parse(options.body); } catch {}
    // Buscar base en demoNotifications
    const baseItems = Array.isArray((demoNotifications as any).items) ? (demoNotifications as any).items : [];
    const base = baseItems.find((x: any) => Number(x.id) === notifId) || baseItems[0] || {
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
    // Aplicar cambios
    const updated = { ...base } as any;
    if (typeof patch.title === 'string') updated.title = patch.title;
    if (typeof patch.message === 'string') updated.message = patch.message;
    if (typeof patch.priority === 'string') updated.priority = patch.priority;
    if (typeof patch.pinned === 'boolean') updated.pinned = patch.pinned;
    if (patch.read === true) {
      try {
        const rawUser = globalThis.localStorage?.getItem('userData');
        const u = rawUser ? JSON.parse(rawUser) : null;
        const userId = (u?.id ?? demoUser?.id ?? 0) as number;
        const readEntry = { userId, notificationId: notifId, read: true };
        const arr = Array.isArray(updated.readBy) ? updated.readBy : [];
        if (!arr.some((r: any) => Number(r.userId) === userId)) arr.push(readEntry);
        updated.readBy = arr;
      } catch { /* noop */ }
    }
    return updated;
  }

  // Rutas
  if (cleanPath === "/routes/assignments" && method === "GET") {
    return demoRoutesAssignments;
  }
  if (cleanPath === "/routes" && method === "GET") {
    return demoTransportRoutes;
  }
  if (cleanPath.startsWith("/routes/") && method === "GET") {
    const idStr = cleanPath.split("/").pop() || "0";
    const rId = Number(idStr);
    const r = demoTransportRoutes.find(x => x.id === rId);
    if (!r) return { statusCode: 404, message: "Not found (demo)" };
    return r;
  }

  // Taller
  if (cleanPath === "/workshop/overview" && method === "GET") {
    return demoWorkshopOverview;
  }
  if (cleanPath === "/workshop/work-orders" && method === "GET") {
    return demoWorkshopOverview.workOrders ?? { items: [], total: 0, page: 1, pageSize: 10 };
  }
  if (cleanPath.startsWith("/workshop/work-orders/") && method === "PATCH") {
    // close o status update: devolvemos eco básico
    const idStr = cleanPath.split("/").pop() || "0";
    const otId = Number(idStr);
    return { id: otId, ok: true };
  }
  if (cleanPath === "/workshop/work-orders" && method === "POST") {
    // crear OT
    const raw = options?.body;
    let payload: Record<string, unknown> = {};
    if (typeof raw === 'string') { try { payload = JSON.parse(raw); } catch { payload = {}; } }
    return { id: Math.floor(Math.random() * 10000) + 1000, ...payload, status: "Abierta", createdAt: new Date().toISOString() };
  }

  // Combustible
  if (cleanPath === "/fuel/summary" && method === "GET") {
    return demoFuelSummary;
  }
  if (cleanPath.startsWith("/fuel/history/") && method === "GET") {
    const idStr = cleanPath.split("/").pop() || "0";
    const vehId = Number(idStr);
    return demoFuelHistoryByVehicleId[vehId] ?? null;
  }

  // Tickets
  if (cleanPath === "/tickets" && method === "GET") {
    return demoTickets;
  }
  if (cleanPath.startsWith("/tickets/") && method === "GET") {
    const idStr = cleanPath.split("/").pop() || "0";
    const tId = Number(idStr);
    const arr = Array.isArray((demoTickets as any).items) ? (demoTickets as any).items : [];
    const t = arr.find((x: any) => Number(x.id) === tId);
    if (!t) return { statusCode: 404, message: "Not found (demo)" };
    return t;
  }

  // Aseo
  if (cleanPath === "/cleaning" && method === "GET") {
    return demoCleaning;
  }

  // Incidentes
  if (cleanPath === "/incident" && method === "GET") {
    return demoIncidents;
  }

  // Obras civiles
  if (cleanPath === "/civil-work" && method === "GET") {
    return demoCivilWorks;
  }

  // Usuarios
  if (cleanPath.startsWith("/users") && method === "GET") {
    return demoUsersList;
  }

  // Vehículos (lista básica) y detalle por id simple
  if (cleanPath === "/vehicles" && method === "GET") {
    return { items: demoFuelSummary.map(v => ({
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
    })), total: demoFuelSummary.length, page: 1, pageSize: 50 };
  }
  if (cleanPath.startsWith("/vehicles/") && method === "GET") {
    const idStr = cleanPath.split("/").pop() || "0";
    const vehId = Number(idStr);
    const v = demoFuelSummary.find(x => x.id === vehId);
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

  // Operaciones mutativas: no-op con eco del body
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const raw = options?.body;
    let body: unknown = undefined;
    if (typeof raw === 'string') {
      try { body = JSON.parse(raw); } catch { body = raw; }
    } else if (raw === undefined) {
      body = {};
    } else {
      body = raw;
    }
    return { ok: true, path: cleanPath, method, echo: body };
  }

  // Fallback: colecciones vacías
  return { items: [], total: 0, page: 1, pageSize: 20 };
}
