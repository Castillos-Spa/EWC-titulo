import { useAuthStore } from '@/stores/authStore';

export function useAuthz() {
  const user = useAuthStore(state => state.user);
  const roles = user?.roles ?? [];
  const perms = user?.permissions ?? [];
  const areas = user?.areaIds ?? [];

  const hasRole = (r: string) => roles.includes(r);
  const hasAnyRole = (...rs: string[]) => rs.some(hasRole);
  const hasPerm = (p: string) => perms.includes(p);
  const hasArea = (a: string) => areas.includes(a);

  // Alinear con Sidebar web: Admin o área correspondiente. Tickets/Incidentes visibles para todos.
  const canRoutes = hasAnyRole('Admin') || hasArea('Transporte');
  const canCleaning = hasAnyRole('Admin') || hasArea('Aseo');
  const canCivilWorks = hasAnyRole('Admin') || hasArea('Obras');
  const canMaintenance = hasAnyRole('Admin') || hasArea('Taller');
  const canFuel = hasAnyRole('Admin') || hasArea('Transporte');
  const canTickets = true; // En web, Tickets siempre visibles
  const canIncidents = true; // En web, Incidentes siempre visibles
  const canKanban = true; // Mantener visible

  return {
    roles,
    perms,
    areas,
    hasRole,
    hasAnyRole,
    hasPerm,
    hasArea,
    canRoutes,
    canCleaning,
    canCivilWorks,
    canKanban,
    canFuel,
    canIncidents,
    canTickets,
    canMaintenance,
  };
}
