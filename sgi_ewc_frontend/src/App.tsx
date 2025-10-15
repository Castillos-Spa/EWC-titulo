import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardHome from './components/Dashboard/DashboardHome';
import TripReports from './components/WaterTransport/TripReports';
import FleetRegistry from './components/WaterTransport/FleetRegistry';
import MaintenanceManagement from './components/WaterTransport/MaintenanceManagement';
import FuelByFleet from './components/WaterTransport/FuelByFleet';
import RouteManagement from './components/WaterTransport/RouteManagement';
import RouteModulePage from './components/TransportRoutes/RouteModulePage';
import TruckAssignmentPage from './components/TruckAssignments/TruckAssignmentPage';
import EnhancedTicketSystem from './components/Tickets/EnhancedTicketSystem';
import CleaningReports from './components/GeneralServices/CleaningReports';
import CivilWorks from './components/GeneralServices/CivilWorks';
import Incidents from './components/GeneralServices/Incidents';
import NotificationsCenter from './components/Notifications/NotificationsCenter';
import UserManagement from './components/Admin/UserManagement';
import UserProfile from './components/Profile/UserProfile';
import SettingsPage from './components/Profile/SettingsPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import { changePassword as apiChangePassword } from './utils/userApi';

const AppContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const initializedRef = useRef(false);

  // Gestión global de tema (light/dark/system)
  useEffect(() => {
    const mm: MediaQueryList | null = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    const applyTheme = () => {
      const t = localStorage.getItem('theme');
      const prefersDark = mm?.matches ?? false;
      let dark = prefersDark;
      if (t) {
        if (t === 'system') {
          dark = prefersDark;
        } else if (t === 'dark') {
          dark = true;
        } else {
          dark = false;
        }
      }
      document.documentElement.classList.toggle('dark', dark);
    };
    applyTheme();
    const handler = () => applyTheme();
    mm?.addEventListener?.('change', handler);
    return () => {
      mm?.removeEventListener?.('change', handler);
    };
  }, []);

  useEffect(() => {
    // Debug visual para ver el valor de user y mustChangePassword
    console.log('Auth user:', user);
    setShowChangePassword(!!user?.mustChangePassword);
  }, [user]);

  // Navegación disparada desde el buscador global
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ page: string }>;
      const page = ce.detail?.page;
      if (!page) return;
      setCurrentPage(page);
      setShowProfile(false);
    };
    window.addEventListener('set-page', handler as EventListener);
    return () => window.removeEventListener('set-page', handler as EventListener);
  }, []);

  // Escucha el evento de logout forzado desde el interceptor de la API
  useEffect(() => {
    const handleForceLogout = () => {
      console.log("Force logout event received. Logging out...");
      logout();
    };

    window.addEventListener('force-logout', handleForceLogout);

    return () => {
      window.removeEventListener('force-logout', handleForceLogout);
    };
  }, [logout]);

  // Inicializa la página según preferencias guardadas
  useEffect(() => {
    if (!user || initializedRef.current) return;

    const allowedPages = new Set([
      'dashboard', 'trip-reports', 'route-management', 'fleet-registry', 'fuel-by-fleet',
      'maintenance', 'cleaning-reports', 'civil-works', 'incidents', 'notifications',
      'tickets', 'user-management', 'profile', 'settings'
    ]);

    const remember = localStorage.getItem('rememberLastPage') === 'true';
    const savedLast = localStorage.getItem('lastPage') || '';
    const prefHome = localStorage.getItem('defaultHomePage') || 'dashboard';

    let target = 'dashboard';
    if (remember && allowedPages.has(savedLast)) {
      target = savedLast;
    } else if (allowedPages.has(prefHome)) {
      target = prefHome;
    }

    setCurrentPage(target);
    initializedRef.current = true;
  }, [user]);

  // Guarda la última página si la preferencia está activa
  useEffect(() => {
    const remember = localStorage.getItem('rememberLastPage') === 'true';
    if (remember) {
      localStorage.setItem('lastPage', currentPage);
    }
  }, [currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Debug visual en pantalla para ver el valor de mustChangePassword
  if (user?.mustChangePassword) {
    console.log('El usuario debe cambiar la contraseña, se fuerza el modal.');
  }

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard': return 'Dashboard';
      case 'trip-reports': return 'Trip Reports';
      case 'route-management': return 'Gestión de Rutas';
  case 'transport-routes': return 'Rutas (Mock)';
      case 'fleet-registry': return 'Fleet Registry';
  case 'fuel-by-fleet': return 'Consumo de Combustible';
  case 'truck-assignments': return 'Asignación de Camiones';
      case 'maintenance': return 'Maintenance Management';
      case 'cleaning-reports': return 'Cleaning Reports';
      case 'civil-works': return 'Civil Works Reports';
      case 'incidents': return 'Incidentes';
  case 'notifications': return 'Notificaciones';
      case 'tickets': return 'Ticket System';
      case 'user-management': return 'User Management';
  case 'profile': return 'Mi Perfil';
  case 'settings': return 'Configuración';
      default: return 'Dashboard';
    }
  };

  const handleProfileClick = () => {
    setCurrentPage('profile');
    setShowProfile(true);
  };


  const renderPage = () => {
    if (showProfile || currentPage === 'profile') {
      return <UserProfile />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'trip-reports':
        return <TripReports />;
      case 'fleet-registry':
        return <FleetRegistry />;
      case 'fuel-by-fleet':
        return <FuelByFleet />;
      case 'maintenance':
        return <MaintenanceManagement />;
      case 'cleaning-reports':
        return <CleaningReports />;
      case 'civil-works':
        return <CivilWorks />;
      case 'incidents':
        return <Incidents />;
      case 'tickets':
        return <EnhancedTicketSystem />;
      case 'notifications':
        return <NotificationsCenter />;
      case 'user-management':
        return <UserManagement />;
      case 'route-management':
        // Página existente de gestión de rutas (legacy). Para el mock nuevo usar 'transport-routes'
        return <RouteManagement />;
      case 'transport-routes':
        return <RouteModulePage />;
      case 'truck-assignments':
        return <TruckAssignmentPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar currentPage={currentPage} 
      onPageChange={(page) => {
        setCurrentPage(page);
        setShowProfile(false);
      }} />
  <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title={getPageTitle(currentPage)}
          onProfileClick={handleProfileClick}
          onSettingsClick={() => {
            setCurrentPage('settings');
            setShowProfile(false);
          }}
        />
        
        <main className="flex-1 p-6 overflow-y-auto bg-gray-100 dark:bg-gray-950">
          {renderPage()}
        </main>
      </div>

      {showChangePassword && (
        <ChangePasswordModal
          onSubmit={async (currentPassword: string, newPassword: string) => {
            await apiChangePassword(user.id, currentPassword, newPassword);
            await logout();
            setShowChangePassword(false);
          }}
          onCancel={async () => {
            await logout();
            setShowChangePassword(false);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;