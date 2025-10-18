import React, { lazy, Suspense, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';

// Lazy pages from current locations
const DashboardHome = lazy(() => import('../components/Dashboard/DashboardHome'));
const FleetPage = lazy(() => import('../features/fleet/pages/FleetPage'));
const MaintenanceManagement = lazy(() => import('../components/WaterTransport/MaintenanceManagement'));
const FuelByFleet = lazy(() => import('../features/fuel/pages/FuelPage'));
const RoutesPage = lazy(() => import('../features/transport-routes/pages/RoutesPage'));
const TruckAssignmentPage = lazy(() => import('../features/truck-assignments/pages/TruckAssignmentPage'));
const EnhancedTicketSystem = lazy(() => import('../features/tickets/pages/TicketsPage'));
const CleaningReports = lazy(() => import('../features/cleaning/pages/CleaningPage'));
const CivilWorks = lazy(() => import('../features/civil-works/pages/CivilWorksPage'));
const Incidents = lazy(() => import('../features/incidents/pages/IncidentsPage'));
const NotificationsCenter = lazy(() => import('../features/notifications/pages/NotificationsPage'));
const UserManagement = lazy(() => import('../components/Admin/UserManagement'));
const UserProfile = lazy(() => import('../components/Profile/UserProfile'));
const SettingsPage = lazy(() => import('../components/Profile/SettingsPage'));
const Login = lazy(() => import('../components/Login'));

function RequireAuth({ children }: Readonly<{ children: React.ReactElement }>) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="p-8">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function AppRouter() {
  const router = useMemo(() => createBrowserRouter([
    {
      path: '/login',
      element: (
        <Suspense fallback={<div className="p-8">Cargando…</div>}>
          <Login />
        </Suspense>
      ),
    },
    {
      path: '/',
      element: (
        <RequireAuth>
          <MainLayout />
        </RequireAuth>
      ),
      children: [
        { index: true, element: <Suspense fallback={<div className="p-8">Cargando…</div>}><DashboardHome /></Suspense> },
  { path: 'rutas', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><RoutesPage /></Suspense> },
  { path: 'flota', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><FleetPage /></Suspense> },
        { path: 'combustible', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><FuelByFleet /></Suspense> },
        { path: 'mantenimiento', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><MaintenanceManagement /></Suspense> },
        { path: 'aseo', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><CleaningReports /></Suspense> },
        { path: 'obras-civiles', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><CivilWorks /></Suspense> },
        { path: 'incidentes', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><Incidents /></Suspense> },
        { path: 'notificaciones', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><NotificationsCenter /></Suspense> },
        { path: 'tickets', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><EnhancedTicketSystem /></Suspense> },
        { path: 'usuarios', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><UserManagement /></Suspense> },
        { path: 'perfil', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><UserProfile /></Suspense> },
        { path: 'ajustes', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><SettingsPage /></Suspense> },
        { path: 'truck-assignments', element: <Suspense fallback={<div className="p-8">Cargando…</div>}><TruckAssignmentPage /></Suspense> },
      ],
    },
  ]), []);

  return <RouterProvider router={router} />;
}
