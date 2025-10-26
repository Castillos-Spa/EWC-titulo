import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';
import { changePassword as apiChangePassword } from '../../utils/userApi';
import { useAuth } from '../../contexts/AuthContext';

type UiDensity = 'comfortable' | 'compact';

const titleMap: Record<string, string> = {
  '/': 'Dashboard',
  '/rutas': 'Gestión de Rutas',
  '/flota': 'Fleet Registry',
  '/combustible': 'Consumo de Combustible',
  '/mantenimiento': 'Maintenance Management',
  '/aseo': 'Cleaning Reports',
  '/obras-civiles': 'Civil Works Reports',
  '/incidentes': 'Incidentes',
  '/notificaciones': 'Notificaciones',
  '/tickets': 'Ticket System',
  '/usuarios': 'User Management',
  '/perfil': 'Mi Perfil',
  '/ajustes': 'Configuración',
  '/truck-assignments': 'Asignación de Camiones',
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [uiDensity, setUiDensity] = useState<UiDensity>(() => {
    const stored = localStorage.getItem('uiDensity');
    return stored === 'compact' ? 'compact' : 'comfortable';
  });

  // Tema ahora se aplica vía PreferencesInitializer.

  useEffect(() => {
    const handleForceLogout = () => logout();
    globalThis.addEventListener?.('force-logout', handleForceLogout);
    return () => globalThis.removeEventListener?.('force-logout', handleForceLogout);
  }, [logout]);

  // Escala tipográfica se aplica vía PreferencesInitializer global.

  useEffect(() => {
    const stored = localStorage.getItem('uiDensity');
    if (stored === 'compact' || stored === 'comfortable') {
      setUiDensity(stored);
    }
    const handleDensityChange = (event: Event) => {
      const custom = event as CustomEvent<UiDensity>;
      const detail = custom.detail;
      if (detail === 'compact' || detail === 'comfortable') {
        setUiDensity(detail);
      }
    };
    globalThis.addEventListener?.('ui-density-change', handleDensityChange as EventListener);
    return () => globalThis.removeEventListener?.('ui-density-change', handleDensityChange as EventListener);
  }, []);

  // Las variables CSS de densidad también se aplican vía PreferencesInitializer; aquí sólo mantenemos el estado para UI.

  // mustChangePassword
  useEffect(() => {
    setShowChangePassword(!!user?.mustChangePassword);
  }, [user?.mustChangePassword]);

  // Recordar última página
  const pathname = location.pathname;
  useEffect(() => {
    const remember = localStorage.getItem('rememberLastPage') === 'true';
    if (remember) localStorage.setItem('lastPage', pathname);
  }, [pathname]);

  const currentTitle = useMemo(() => titleMap[pathname] || 'Dashboard', [pathname]);

  // Sidebar necesita un id para active state; mapeamos paths a ids actuales
  const currentPageId = useMemo(() => {
    const map: Record<string, string> = {
      '/': 'dashboard',
      '/rutas': 'transport-routes',
      '/flota': 'fleet-registry',
      '/combustible': 'fuel-by-fleet',
      '/mantenimiento': 'maintenance',
      '/aseo': 'cleaning-reports',
      '/obras-civiles': 'civil-works',
      '/incidentes': 'incidents',
      '/notificaciones': 'notifications',
      '/tickets': 'tickets',
      '/usuarios': 'user-management',
      '/perfil': 'profile',
      '/ajustes': 'settings',
      '/truck-assignments': 'truck-assignments',
    };
    return map[pathname] || 'dashboard';
  }, [pathname]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      <Sidebar
        currentPage={currentPageId}
        onPageChange={(id) => {
          const to: Record<string, string> = {
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
          navigate(to[id] || '/');
        }}
        uiDensity={uiDensity}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          title={currentTitle}
          onProfileClick={() => navigate('/perfil')}
          onSettingsClick={() => navigate('/ajustes')}
          uiDensity={uiDensity}
        />
        <main
          className={`flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 ${
            uiDensity === 'compact' ? 'p-4' : 'p-6'
          }`}
        >
          <Outlet />
        </main>
      </div>

      {showChangePassword && (
        <ChangePasswordModal
          onSubmit={async (currentPassword, newPassword) => {
            if (!user) throw new Error('No hay usuario autenticado.');
            await apiChangePassword(user.id, currentPassword, newPassword);
            // Éxito: el modal mostrará la pantalla de éxito y luego onCancel hará logout.
          }}
          onCancel={async () => {
            await logout();
            setShowChangePassword(false);
          }}
        />
      )}
    </div>
  );
}
