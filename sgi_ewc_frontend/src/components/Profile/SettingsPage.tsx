import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Settings as SettingsIcon,
  User as UserIcon,
  Shield,
  Moon,
  Globe,
  HelpCircle,
  Info,
  ChevronRight,
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  type ThemeMode = 'light' | 'dark' | 'system';
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const v = localStorage.getItem('theme');
    return v === 'dark';
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const v = localStorage.getItem('theme');
    if (v === 'dark') return 'dark';
    if (v === 'light') return 'light';
    return 'system';
  });
  const [showAbout, setShowAbout] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  type UiDensity = 'comfortable' | 'compact';
  type FontScale = 'sm' | 'md' | 'lg';
  type DateFormat = 'DMY' | 'MDY';

  // Preferencias nuevas (no duplicadas con Perfil/Notificaciones)
  const [uiDensity, setUiDensity] = useState<UiDensity>(() => {
    const v = localStorage.getItem('uiDensity');
    return (v === 'comfortable' || v === 'compact') ? v : 'comfortable';
  });
  const [fontScale, setFontScale] = useState<FontScale>(() => {
    const v = localStorage.getItem('fontScale');
    return (v === 'sm' || v === 'md' || v === 'lg') ? v : 'md';
  });
  const [defaultHomePage, setDefaultHomePage] = useState<string>(() => localStorage.getItem('defaultHomePage') || 'dashboard');
  const [rememberLastPage, setRememberLastPage] = useState<boolean>(() => localStorage.getItem('rememberLastPage') === 'true');
  const [timeFormat24h, setTimeFormat24h] = useState<boolean>(() => localStorage.getItem('timeFormat24h') !== 'false');
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => {
    const v = localStorage.getItem('dateFormat');
    return (v === 'DMY' || v === 'MDY') ? v : 'DMY';
  });
  const [showShortcutHints, setShowShortcutHints] = useState<boolean>(() => localStorage.getItem('showShortcutHints') !== 'false');

  // Persistencia
  useEffect(() => { localStorage.setItem('uiDensity', uiDensity); }, [uiDensity]);
  useEffect(() => { localStorage.setItem('fontScale', fontScale); }, [fontScale]);
  useEffect(() => { localStorage.setItem('defaultHomePage', defaultHomePage); }, [defaultHomePage]);
  useEffect(() => { localStorage.setItem('rememberLastPage', String(rememberLastPage)); }, [rememberLastPage]);
  useEffect(() => { localStorage.setItem('timeFormat24h', String(timeFormat24h)); }, [timeFormat24h]);
  useEffect(() => { localStorage.setItem('dateFormat', dateFormat); }, [dateFormat]);
  useEffect(() => { localStorage.setItem('showShortcutHints', String(showShortcutHints)); }, [showShortcutHints]);

  // Sincroniza selección de themeMode con el DOM y localStorage
  useEffect(() => {
    localStorage.setItem('theme', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (themeMode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system: el efecto en App.tsx decidirá según matchMedia
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', prefersDark);
    }
    // Ajusta también el booleano para el texto auxiliar actual
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, [themeMode]);

  // Aplicar escala tipográfica básica
  useEffect(() => {
    const root = document.documentElement;
    let size = '15px';
    if (fontScale === 'sm') {
      size = '14px';
    } else if (fontScale === 'lg') {
      size = '16.5px';
    }
    root.style.fontSize = size;
  }, [fontScale]);

  const roleLabel = useMemo(() => user?.roles?.join(', ') || 'Usuario', [user]);
  const areaLabel = useMemo(() => user?.areas?.join(', ') || 'General', [user]);

  return (
  <div className="space-y-6">
      {/* Header */}
  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
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

      {/* Privacidad (sin duplicar cambio de contraseña) */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Privacidad</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          <button className="flex items-center w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/60" onClick={() => setShowPrivacy(true)}>
            <div className="flex items-center flex-1 space-x-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900 dark:text-gray-100">Privacidad y datos</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Limpieza de datos locales y política</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </section>

      {/* Apariencia */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Apariencia</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          {/* Tema */}
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
            <select
              className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={themeMode}
              onChange={e => setThemeMode(e.target.value as ThemeMode)}
            >
              <option value="light">Claro</option>
              <option value="dark">Oscuro</option>
              <option value="system">Sistema</option>
            </select>
          </div>

          {/* Densidad de interfaz */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Densidad de interfaz</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ajusta el espacio entre elementos</p>
            </div>
            <select
              className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={uiDensity}
              onChange={e => setUiDensity(e.target.value as 'comfortable' | 'compact')}
            >
              <option value="comfortable">Cómoda</option>
              <option value="compact">Compacta</option>
            </select>
          </div>

          {/* Tamaño de fuente */}
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Tamaño de fuente</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Escala global del texto</p>
            </div>
            <select
              className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={fontScale}
              onChange={e => setFontScale(e.target.value as 'sm' | 'md' | 'lg')}
            >
              <option value="sm">Pequeño</option>
              <option value="md">Medio</option>
              <option value="lg">Grande</option>
            </select>
          </div>
        </div>
      </section>

      {/* Inicio y navegación */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Inicio</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Página de inicio</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">A dónde ir al iniciar sesión</p>
            </div>
            <select
              className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={defaultHomePage}
              onChange={e => setDefaultHomePage(e.target.value)}
            >
              <option value="dashboard">Dashboard</option>
              <option value="tickets">Tickets</option>
              <option value="notifications">Notificaciones</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="trip-reports">Reportes de Viaje</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Recordar última vista</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Abre la última página usada</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <span className="sr-only">Recordar última vista</span>
              <input type="checkbox" className="sr-only peer" checked={rememberLastPage} onChange={e => setRememberLastPage(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </section>

      {/* Internacionalización */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Internacionalización</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
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

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Formato de fecha</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Cómo mostrar fechas</p>
            </div>
            <select
              className="px-3 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              value={dateFormat}
              onChange={e => setDateFormat(e.target.value as 'DMY' | 'MDY')}
            >
              <option value="DMY">DD/MM/AAAA</option>
              <option value="MDY">MM/DD/YYYY</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Formato de hora</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Reloj de 24 horas</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <span className="sr-only">Formato 24 horas</span>
              <input type="checkbox" className="sr-only peer" checked={timeFormat24h} onChange={e => setTimeFormat24h(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
          </div>
        </div>
      </section>

      {/* Productividad */}
      <section>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-gray-600 uppercase dark:text-gray-300">Productividad</h2>
        <div className="overflow-hidden bg-white rounded-xl shadow divide-y divide-gray-100 dark:bg-gray-900 dark:border dark:border-gray-800 dark:divide-gray-800">
          <div className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">Mostrar tips de atajos</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ayudas visuales sobre atajos del teclado</p>
            </div>
            <label className="inline-flex items-center cursor-pointer">
              <span className="sr-only">Mostrar tips de atajos</span>
              <input type="checkbox" className="sr-only peer" checked={showShortcutHints} onChange={e => setShowShortcutHints(e.target.checked)} />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:bg-blue-600 relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
            </label>
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

      {/* Nota: el cierre de sesión se realiza desde el menú del usuario en el Header para evitar duplicación */}

      {/* Modales */}
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
                <li>¿Cambiar contraseña? En Perfil → Seguridad.</li>
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
    </div>
  );
};

export default SettingsPage;
