import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Layout/Sidebar';
import Header from '../../components/Layout/Header';
import ChangePasswordModal from '../../components/ChangePasswordModal';
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

  // Tema (light/dark/system) y listeners globales
  useEffect(() => {
    const mm: MediaQueryList | null = globalThis.matchMedia ? globalThis.matchMedia('(prefers-color-scheme: dark)') : null;
    const applyTheme = () => {
      const t = localStorage.getItem('theme');
      const prefersDark = mm?.matches ?? false;
      let dark = prefersDark;
      if (t) {
        if (t === 'system') dark = prefersDark;
        else if (t === 'dark') dark = true;
        else dark = false;
      }
      document.documentElement.classList.toggle('dark', dark);
    };
    applyTheme();
    const handler = () => applyTheme();
    mm?.addEventListener?.('change', handler);
    return () => mm?.removeEventListener?.('change', handler);
  }, []);

  useEffect(() => {
    const handleForceLogout = () => logout();
    globalThis.addEventListener?.('force-logout', handleForceLogout);
    return () => globalThis.removeEventListener?.('force-logout', handleForceLogout);
  }, [logout]);

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

  useEffect(() => {
  document.documentElement.dataset.uiDensity = uiDensity;
    const root = document.documentElement;
    const spacing = uiDensity === 'compact' ? '1rem' : '1.5rem';
    const controlPadding = uiDensity === 'compact' ? '0.6rem 0.9rem' : '0.75rem 1.15rem';
    const radius = uiDensity === 'compact' ? '0.9rem' : '1.2rem';
    root.style.setProperty('--app-spacing', spacing);
    root.style.setProperty('--app-control-padding', controlPadding);
    root.style.setProperty('--app-card-radius', radius);
  }, [uiDensity]);

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
          onSubmit={async () => {
            // Enrutamiento: el flujo de cambio de contraseña puede seguir igual que antes
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
}
