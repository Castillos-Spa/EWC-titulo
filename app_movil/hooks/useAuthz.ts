import { useAuthStore } from '@/app/stores/authStore';

export function useAuthz() {
  const user = useAuthStore(state => state.user);
  const roles = user?.roles ?? [];
  const perms = user?.permissions ?? [];
  const areas = user?.areaIds ?? [];

  const hasRole = (r: string) => roles.includes(r);
  const hasAnyRole = (...rs: string[]) => rs.some(hasRole);
  const hasPerm = (p: string) => perms.includes(p);
  const hasArea = (a: string) => areas.includes(a);

  // Admin es un rol real; Transporte/Aseo/Obras/IT son áreas (del backend)
  const canRoutes = hasAnyRole('Admin') || hasArea('Transporte') || hasPerm('VIEW_ROUTES') || hasPerm('MANAGE_ROUTES');
  const canCleaning = hasAnyRole('Admin') || hasArea('Aseo') || hasPerm('VIEW_CLEANING_REPORTS') || hasPerm('MANAGE_CLEANING_REPORTS');
  const canCivilWorks = hasAnyRole('Admin') || hasArea('Obras') || hasPerm('VIEW_CIVIL_WORKS') || hasPerm('MANAGE_CIVIL_WORKS');
  const canIT = hasAnyRole('Admin') || hasArea('IT') || hasPerm('VIEW_TICKETS') || hasPerm('MANAGE_TICKETS');
  const canKanban = true; // Visible para todos
  const canFuel = hasAnyRole('Admin', 'Transporte', 'Driver') || hasPerm('VIEW_FLEET') || hasPerm('MANAGE_FLEET');
  const canMaintenance = hasAnyRole('Admin', 'Transporte') || hasPerm('VIEW_MAINTENANCE') || hasPerm('MANAGE_MAINTENANCE');
  const canIncidents = true; // Visible para todos
  const canTickets = hasAnyRole('Admin', 'IT') || hasPerm('VIEW_TICKETS') || hasPerm('MANAGE_TICKETS');

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
    canIT,
    canKanban,
    canFuel,
    canIncidents,
    canTickets,
    canMaintenance,
  };
}
