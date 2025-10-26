import type { User, Role } from '../../types/User';

// IDs usados en Sidebar y en el router
export type RouteId =
  | 'dashboard'
  | 'transport-routes'
  | 'fleet-registry'
  | 'fuel-by-fleet'
  | 'maintenance'
  | 'cleaning-reports'
  | 'civil-works'
  | 'incidents'
  | 'notifications'
  | 'tickets'
  | 'user-management'
  | 'profile'
  | 'settings'
  | 'truck-assignments';

export const routeIdToPath: Record<RouteId, string> = {
  'dashboard': '/',
  'transport-routes': '/rutas',
  'fleet-registry': '/flota',
  'fuel-by-fleet': '/combustible',
  'maintenance': '/mantenimiento',
  'cleaning-reports': '/aseo',
  'civil-works': '/obras-civiles',
  'incidents': '/incidentes',
  'notifications': '/notificaciones',
  'tickets': '/tickets',
  'user-management': '/usuarios',
  'profile': '/perfil',
  'settings': '/ajustes',
  'truck-assignments': '/truck-assignments',
};

// Claves que guarda Settings como página de inicio
export type DefaultHomeKey = 'dashboard' | 'tickets' | 'notifications' | 'maintenance' | 'trip-reports';

export const defaultHomeToRouteId: Record<DefaultHomeKey, RouteId> = {
  dashboard: 'dashboard',
  tickets: 'tickets',
  notifications: 'notifications',
  maintenance: 'maintenance',
  'trip-reports': 'transport-routes',
};

// Opciones recomendadas para 'Página de inicio' (alineadas al Sidebar)
export const defaultHomeCandidates: RouteId[] = [
  'dashboard',
  'tickets',
  'notifications',
  'transport-routes',
  'fleet-registry',
  'fuel-by-fleet',
  'truck-assignments',
  'maintenance',
  'cleaning-reports',
  'civil-works',
  'incidents',
  'user-management',
];

// Claves de traducción para mostrar etiquetas consistentes con el Sidebar
export const routeIdToLabelKey: Record<RouteId, string> = {
  'dashboard': 'nav.dashboard',
  'transport-routes': 'nav.routes',
  'fleet-registry': 'nav.fleetRegistry',
  'fuel-by-fleet': 'nav.fuel',
  'maintenance': 'nav.maintenance',
  'cleaning-reports': 'nav.cleaningReports',
  'civil-works': 'nav.civilWorks',
  'incidents': 'nav.incidents',
  'notifications': 'nav.notifications',
  'tickets': 'nav.tickets',
  'truck-assignments': 'nav.assignments',
  'user-management': 'nav.userManagement',
  'profile': 'perfil', // no se usa en Sidebar
  'settings': 'ajustes', // no se usa en Sidebar
};

// Backward-compat: aceptar valores antiguos ('dashboard', 'trip-reports', etc.) o nuevos (routeId)
export function getDefaultHomeRouteIdFromStorage(): RouteId {
  const raw = localStorage.getItem('defaultHomePage') || 'dashboard';
  if ((Object.keys(routeIdToPath) as RouteId[]).includes(raw as RouteId)) {
    return raw as RouteId;
  }
  const mapped = defaultHomeToRouteId[raw as DefaultHomeKey] || 'dashboard';
  return mapped;
}

// Reglas simples de acceso por rol. Ajusta según tu modelo de seguridad real.
const allowAll: Role[] = ['Admin', 'Jefe', 'Supervisor', 'Especialista', 'Trabajador', 'Lector'];
const powerRoles: Role[] = ['Admin', 'Jefe'];
const opsRoles: Role[] = ['Admin', 'Jefe', 'Supervisor', 'Especialista'];

export const routeAccess: Record<RouteId, Role[]> = {
  'dashboard': allowAll,
  'notifications': allowAll,
  'tickets': allowAll,
  'profile': allowAll,
  'settings': allowAll,
  'transport-routes': opsRoles,
  'maintenance': opsRoles,
  'fleet-registry': opsRoles,
  'fuel-by-fleet': opsRoles,
  'cleaning-reports': opsRoles,
  'civil-works': opsRoles,
  'incidents': opsRoles,
  'truck-assignments': opsRoles,
  'user-management': powerRoles,
};

export function isRouteAllowedByUser(routeId: RouteId, user: User | null): boolean {
  if (!user) return false;
  const required = routeAccess[routeId] || allowAll;
  return user.isAdmin || user.roles.some(r => required.includes(r));
}

export function getPreferredRoute(user: User | null): string {
  try {
    // Prioridad 1: recordar última página (si no es login/forgot-password y el usuario tiene acceso)
    const remember = localStorage.getItem('rememberLastPage') === 'true';
    const lastPage = localStorage.getItem('lastPage');
    if (remember && lastPage && lastPage.startsWith('/') && !['/login', '/forgot-password'].includes(lastPage)) {
      // Intentar mapear lastPage a un RouteId para validar acceso; si no se reconoce, usar tal cual.
      const entry = Object.entries(routeIdToPath).find(([, p]) => p === lastPage) as [RouteId, string] | undefined;
      if (!entry || isRouteAllowedByUser(entry[0], user)) {
        return lastPage;
      }
    }

  // Prioridad 2: defaultHomePage (admite formato antiguo o routeId actual)
  const routeId = getDefaultHomeRouteIdFromStorage();
    if (isRouteAllowedByUser(routeId, user)) return routeIdToPath[routeId];

    // Fallbacks: primera ruta permitida o dashboard
    const firstAllowed = (Object.keys(routeIdToPath) as RouteId[]).find(rid => isRouteAllowedByUser(rid, user));
    return firstAllowed ? routeIdToPath[firstAllowed] : '/';
  } catch {
    return '/';
  }
}
