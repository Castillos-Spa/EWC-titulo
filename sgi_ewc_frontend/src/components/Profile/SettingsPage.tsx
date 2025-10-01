import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import ChangePasswordModal from '../ChangePasswordModal';
import { changePassword as apiChangePassword } from '../../utils/userApi';
import { 
  Settings as SettingsIcon,
  User as UserIcon,
  Shield,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  Info,
  ChevronRight,
  Lock,
  LogOut
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem('notificationsEnabled');
    return v ? v === 'true' : true;
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const v = localStorage.getItem('theme');
    return v === 'dark';
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', String(notificationsEnabled));
  }, [notificationsEnabled]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const roleLabel = useMemo(() => user?.roles?.join(', ') || 'Usuario', [user]);
  const areaLabel = useMemo(() => user?.areas?.join(', ') || 'General', [user]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <SettingsIcon className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuración</h1>
        </div>
      </div>

      {/* Perfil */}
      <div className="p-5 bg-white rounded-xl shadow dark:bg-gray-900 dark:border dark:border-gray-800">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30">
            <UserIcon className="w-7 h-7 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-lg font-semibold text-gray-900 truncate dark:text-gray-100">{user?.username}</p>
              {user?.email && <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/40 dark:text-blue-300">{user.email}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/40 dark:text-blue-300">{roleLabel}</span>
              <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full dark:bg-green-900/40 dark:text-green-300">{areaLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seguridad */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Seguridad</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          <button className="flex items-center w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60">
            <div className="flex items-center flex-1 space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Cambiar contraseña</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza tu contraseña de acceso</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <div className="px-4 pb-4">
            <button
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg"
              onClick={() => setShowChangePassword(true)}
            >
              Abrir cambio de contraseña
            </button>
          </div>

          <button className="flex items-center w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60" onClick={() => setShowPrivacy(true)}>
            <div className="flex items-center flex-1 space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Privacidad y seguridad</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configuración de privacidad y datos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </section>

      {/* Aplicación */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Aplicación</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Notificaciones</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{notificationsEnabled ? 'Habilitadas' : 'Deshabilitadas'}</p>
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer" htmlFor="notifications-toggle">
              <span className="sr-only">Alternar notificaciones</span>
              <input id="notifications-toggle" aria-label="Alternar notificaciones" type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={e => setNotificationsEnabled(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Moon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Tema</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{darkMode ? 'Oscuro' : 'Claro'}</p>
              </div>
            </div>
            <label className="inline-flex items-center cursor-pointer" htmlFor="theme-toggle">
              <span className="sr-only">Alternar tema oscuro</span>
              <input id="theme-toggle" aria-label="Alternar tema oscuro" type="checkbox" className="sr-only peer" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Idioma</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'es' ? 'Español' : 'English'}</p>
              </div>
            </div>
            <select
              className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={language}
              onChange={e => setLanguage(e.target.value as 'en' | 'es')}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </section>

      {/* Soporte */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Soporte</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          <button className="flex items-center w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60" onClick={() => setShowSupport(true)}>
            <div className="flex items-center flex-1 space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <HelpCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Ayuda y soporte</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">FAQ, contacto y reportes</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button className="flex items-center w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60" onClick={() => setShowAbout(true)}>
            <div className="flex items-center flex-1 space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Acerca de</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Versión 1.0.0 • Build 2025.01.001</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </section>

      {/* Logout */}
      <div className="flex justify-end">
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center px-4 py-2 space-x-2 font-semibold text-red-600 bg-white border-2 border-red-600 rounded-lg shadow hover:bg-red-50 dark:bg-gray-900 dark:border-red-700 dark:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      {/* Modales */}
      {showChangePassword && (
        <ChangePasswordModal
          onSubmit={async (currentPassword: string, newPassword: string) => {
            await apiChangePassword(user!.id, currentPassword, newPassword);
            await logout();
            setShowChangePassword(false);
          }}
          onCancel={() => setShowChangePassword(false)}
        />
      )}

      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow dark:bg-gray-900 dark:border dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Acerca de Field Operations</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Hub Corporativo Web • Empresas Wilson Castillo</p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Versión: 1.0.0 — Build: 2025.01.001</p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">© 2025 Empresas Wilson Castillo. Todos los derechos reservados.</p>
            <div className="flex justify-end mt-6">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg" onClick={() => setShowAbout(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow dark:bg-gray-900 dark:border dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ayuda y Soporte</h3>
            <div className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p className="font-semibold">Preguntas Frecuentes</p>
              <ul className="pl-5 list-disc">
                <li>¿Cómo reporto un incidente? Ir a Incidentes y presionar “Nuevo”.</li>
                <li>¿Modo offline? La app sincroniza al reconectar.</li>
                <li>¿Cambiar contraseña? En Configuración → Seguridad.</li>
              </ul>
              <p className="mt-3 font-semibold">Contacto Soporte</p>
              <p>📧 soporte@wilsoncastillo.com — 📞 +54 11 1234-5678</p>
              <p>Horario: Lunes a Viernes 8:00 - 18:00</p>
            </div>
            <div className="flex justify-end mt-6">
              <button className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg" onClick={() => setShowSupport(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg p-6 bg-white rounded-xl shadow dark:bg-gray-900 dark:border dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Privacidad y Seguridad</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Empresas Wilson Castillo protege tu privacidad según normativas vigentes.</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg"
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  setShowPrivacy(false);
                  // Nota: el cierre de sesión no es automático al limpiar; el usuario puede seguir navegando si el contexto aún mantiene estado.
                }}
              >
                Limpiar datos locales
              </button>
              <button
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg"
                onClick={() => window.open('about:blank', '_blank')}
              >
                Ver política de privacidad
              </button>
              <button className="px-4 py-2 text-sm font-semibold bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-100" onClick={() => setShowPrivacy(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md p-6 bg-white rounded-xl shadow dark:bg-gray-900 dark:border dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Cerrar Sesión</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">¿Estás seguro de que quieres cerrar sesión?</p>
            <div className="flex justify-end gap-3 mt-6">
              <button className="px-4 py-2 text-sm font-semibold bg-gray-100 rounded-lg dark:bg-gray-800 dark:text-gray-100" onClick={() => setConfirmLogout(false)}>Cancelar</button>
              <button className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg" onClick={async () => { await logout(); setConfirmLogout(false); }}>Cerrar sesión</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
