import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ChangePasswordModal from '../../features/auth/components/ChangePasswordModal';
import { changePassword as apiChangePassword } from '../../utils/userApi';
import { useAuth } from '../../contexts/AuthContext';
import apiFetch from '../../utils/api';

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
  const [showDemoHelp, setShowDemoHelp] = useState(false);
  const [resettingDemo, setResettingDemo] = useState(false);
  const [uiDensity, setUiDensity] = useState<UiDensity>(() => {
    const stored = localStorage.getItem('uiDensity');
    return stored === 'compact' ? 'compact' : 'comfortable';
  });
  const DEMO_ACTIVE = useMemo(() => {
    const byEnv = String(import.meta.env.VITE_DEMO_MODE || 'false').toLowerCase() === 'true';
    try { return byEnv || globalThis?.localStorage?.getItem('demoMode') === 'true'; } catch { return byEnv; }
  }, []);

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

      {DEMO_ACTIVE && (
        <>
          {/* Badge flotante de modo demo */}
          <div className="fixed z-40 flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-900 border rounded-full shadow-sm bottom-4 left-4 border-amber-300/50 bg-amber-100/90 backdrop-blur">
            <span className="inline-flex w-2 h-2 rounded-full bg-amber-500" />
            <span>Modo demo activo</span>
            <button
              type="button"
              onClick={() => setShowDemoHelp(true)}
              className="px-2 py-0.5 text-xs border rounded-full border-amber-300/70 hover:bg-amber-200"
            >Ver ayuda</button>
            <button
              type="button"
              disabled={resettingDemo}
              onClick={async () => {
                try {
                  setResettingDemo(true);
                  await apiFetch('/demo/reset', { method: 'POST' });
                  // Refrescar UI para reflejar datos semilla
                  globalThis.location?.reload();
                } catch (e) {
                  console.warn('No se pudo restablecer el modo demo', e);
                  setResettingDemo(false);
                }
              }}
              className="px-2 py-0.5 text-xs border rounded-full border-amber-300/70 hover:bg-amber-200 disabled:opacity-60"
            >{resettingDemo ? 'Restableciendo…' : 'Restablecer datos'}</button>
            <button
              type="button"
              onClick={async () => {
                try {
                  localStorage.removeItem('demoMode');
                  localStorage.removeItem('autoStartTour');
                } catch {}
                await logout();
              }}
              className="px-2 py-0.5 text-xs border rounded-full border-amber-300/70 hover:bg-amber-200"
            >Salir del demo</button>
          </div>

          {/* Modal de ayuda */}
          {showDemoHelp && (
            <dialog open className="fixed inset-0 z-50 m-0 p-0 bg-transparent" aria-label="Ayuda del modo demo">
              <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDemoHelp(false)} aria-label="Cerrar" />
              <div className="absolute max-w-lg p-5 text-slate-800 border rounded-2xl shadow-2xl -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 bg-white dark:bg-slate-900 dark:text-white dark:border-white/10">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-blue-200/80">Modo demo</div>
                <h3 className="mb-1 text-lg font-semibold">Recorrido rápido</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-blue-200/80">
                  Estás explorando una versión demostrativa. Puedes navegar por los módulos, simular creaciones y cambios, pero no se guardan en un servidor real.
                </p>
                <ul className="mb-4 text-sm list-disc list-inside text-slate-600 dark:text-blue-200/80">
                  <li>El login acepta cualquier contraseña con un correo válido.</li>
                  <li>Algunas acciones de crear/editar muestran resultado simulado.</li>
                  <li>Puedes iniciar un tour guiado para conocer los módulos.</li>
                </ul>
                <div className="flex items-center justify-end gap-2">
                  <button type="button" onClick={() => setShowDemoHelp(false)} className="px-3 py-1.5 text-xs border rounded-full text-slate-700 hover:bg-slate-100 dark:text-white dark:border-white/10 dark:hover:bg-white/10">Cerrar</button>
                  <button type="button" onClick={() => { setShowDemoHelp(false); globalThis.dispatchEvent?.(new Event('demo:startTour')); }} className="px-3 py-1.5 text-xs font-semibold text-white rounded-full bg-sky-600 hover:bg-sky-500">Iniciar tour</button>
                </div>
              </div>
            </dialog>
          )}
        </>
      )}
    </div>
  );
}
