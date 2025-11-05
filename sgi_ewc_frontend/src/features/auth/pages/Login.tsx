import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Lock, User, AlertCircle, ShieldCheck, Headset, Sun, Moon } from 'lucide-react';
import { getPreferredRoute } from '../../../app/navigation/navigationUtils';

type ThemeVariant = 'light' | 'dark';

const getInitialTheme = (): ThemeVariant => {
  if (!globalThis?.document) return 'dark';
  const stored = globalThis.localStorage?.getItem('theme');
  if (stored === 'dark' || stored === 'light') return stored;
  const prefersDark = globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return prefersDark ? 'dark' : 'light';
};

const themeStyles: Record<ThemeVariant, Record<string, string>> = {
  dark: {
    root: 'relative flex min-h-screen flex-col bg-slate-950 text-white',
    haloTop: 'bg-blue-500/20 blur-3xl',
    haloBottom: 'bg-indigo-500/25 blur-[120px]',
    overlay: 'bg-gradient-to-br from-blue-600/40 via-indigo-700/20 to-slate-950',
    toggleButton: 'inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur transition hover:border-white/30 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/60',
    heroBadge: 'inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-100/80 backdrop-blur',
    heroText: 'text-base text-blue-100/80',
    heroChip: 'flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-blue-100/70',
    card: 'w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/10 px-8 py-10 text-white shadow-2xl backdrop-blur-xl lg:px-10',
    cardIcon: 'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white',
    cardSubtitle: 'text-sm text-blue-100/80',
    label: 'block text-sm font-medium text-blue-100/90',
    input: 'w-full rounded-full border border-white/20 bg-white/10 py-3 pl-12 pr-4 text-sm text-white placeholder-white/70 shadow-inner focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/60',
    inputIcon: 'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-100/70',
    error: 'flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100',
    submit: 'flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] hover:from-sky-300 hover:via-indigo-400 hover:to-purple-400 focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-white/10 disabled:cursor-not-allowed disabled:opacity-60',
    footer: 'border-t border-white/10 pt-6 text-sm text-blue-100/80',
    supportChip: 'flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium uppercase tracking-wide',
    supportLink: 'text-sm font-medium text-white transition hover:text-white/80',
  },
  light: {
    root: 'relative flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-indigo-100 text-slate-900',
    haloTop: 'bg-sky-200/80 blur-3xl',
    haloBottom: 'bg-indigo-200/70 blur-[140px]',
    overlay: 'bg-gradient-to-br from-white/90 via-blue-100/80 to-indigo-100/60',
    toggleButton: 'inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur transition hover:border-blue-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200',
    heroBadge: 'inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-blue-700',
    heroText: 'text-base text-slate-600',
    heroChip: 'flex items-center gap-2 rounded-full bg-blue-100 px-4 py-1.5 text-sm text-slate-700',
    card: 'w-full max-w-md space-y-8 rounded-3xl border border-blue-100 bg-white px-8 py-10 text-slate-900 shadow-xl lg:px-10',
    cardIcon: 'inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600',
    cardSubtitle: 'text-sm text-slate-500',
    label: 'block text-sm font-medium text-slate-700',
    input: 'w-full rounded-full border border-blue-200 bg-white py-3 pl-12 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200',
    inputIcon: 'pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500/80',
    error: 'flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600',
    submit: 'flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-lg shadow-indigo-200/60 transition hover:scale-[1.01] hover:from-sky-300 hover:via-indigo-300 hover:to-purple-300 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60',
    footer: 'border-t border-blue-100 pt-6 text-sm text-slate-500',
    supportChip: 'flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-blue-700',
    supportLink: 'text-sm font-medium text-blue-600 transition hover:text-blue-500',
  },
};

const Login: React.FC = () => {
  const DEMO_MODE = (() => {
    const byEnv = String(import.meta.env.VITE_DEMO_MODE || 'false').toLowerCase() === 'true';
    try { return byEnv || globalThis?.localStorage?.getItem('demoMode') === 'true'; } catch { return byEnv; }
  })();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<ThemeVariant>(() => getInitialTheme());
  const { login, isLoading, user } = useAuth();
  const navigate = useNavigate();


  useEffect(() => {
    if (user) {
      navigate(getPreferredRoute(user), { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(email, password);
    if (success) {
      // Recalcular con el usuario ya autenticado
      const next = getPreferredRoute(user);
      navigate(next, { replace: true });
    } else {
      setError('Credenciales inválidas');
    }
  };

  const handleDemo = async () => {
    setError('');
    const isValidEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
    if (!isValidEmail) {
      setError('Ingresa un correo válido para continuar con la demo');
      return;
    }
    try {
      // Activa modo demo en runtime y solicita login normal (será interceptado)
      try {
        globalThis.localStorage?.setItem('demoMode', 'true');
        globalThis.localStorage?.setItem('autoStartTour', 'true');
      } catch {}
      const success = await login(email, 'demo');
      if (success) {
        // Calcular ruta preferida con datos del usuario en localStorage si Auth aún no se actualiza
        let next = '/';
        try {
          const raw = globalThis.localStorage?.getItem('userData');
          if (raw) {
            const u = JSON.parse(raw);
            next = getPreferredRoute(u);
          }
        } catch {}
        navigate(next, { replace: true });
      } else {
        setError('No se pudo iniciar la demo');
      }
    } catch (err) {
      console.error('Demo login error', err);
      setError('No se pudo iniciar la demo');
    }
  };

  useEffect(() => {
    if (!globalThis?.document) return;
    const root = globalThis.document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      globalThis.localStorage?.setItem('theme', theme);
    } catch (err) {
      console.warn('No se pudo persistir el tema', err);
    }
  }, [theme]);

  const styles = themeStyles[theme];

  return (
    <div className={styles.root}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -left-1/4 top-[-10%] h-[60vh] w-[60vh] rounded-full ${styles.haloTop}`} />
        <div className={`absolute bottom-[-15%] right-[-10%] h-[65vh] w-[65vh] rounded-full ${styles.haloBottom}`} />
        <div className={`absolute inset-0 ${styles.overlay}`} />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <div className="flex items-center justify-end gap-3 px-6 py-6">
          <button
            type="button"
            onClick={() => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))}
            className={styles.toggleButton}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            data-cy="theme-toggle"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
        </div>

        <div className="flex flex-col flex-1 lg:flex-row">
          <section className="flex min-h-[280px] flex-1 items-center justify-center px-8 py-12">
            <div className="max-w-xl space-y-6 text-center lg:text-left">
              <span className={styles.heroBadge}>
                <ShieldCheck className="w-4 h-4" /> Seguridad corporativa
              </span>
              <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                Plataforma Integral de Gestión Operacional
              </h1>
              <p className={styles.heroText}>
                Administra activos, rutas, incidentes y equipos en un dashboard centralizado. Mantén el control con acceso autorizado y supervisión en tiempo real.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
                <div className={styles.heroChip}>
                  <span className="flex w-2 h-2 rounded-full bg-emerald-400" /> Disponibilidad 99.9%
                </div>
                <div className={styles.heroChip}>
                  <span className="flex w-2 h-2 rounded-full bg-sky-400" /> Monitoreo 24/7
                </div>
                <div className={styles.heroChip}>
                  <span className="flex w-2 h-2 rounded-full bg-violet-400" /> Acceso seguro
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center justify-center flex-1 w-full max-w-xl px-6 py-10 lg:px-12 lg:py-16">
            <div className={styles.card}>
              {DEMO_MODE && (
                <div className="mb-4 rounded-2xl border border-amber-300/40 bg-amber-100/70 px-4 py-3 text-sm text-amber-900">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <strong className="block">Modo demo activo</strong>
                      <p>
                        Puedes ingresar con cualquier correo y contraseña. Las acciones de creación/edición se simulan y no persisten.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-3 text-center lg:text-left">
                <div className={styles.cardIcon}>
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Inicia sesión</h2>
                  <p className={styles.cardSubtitle}>Utiliza tus credenciales corporativas para continuar</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6" data-cy="login-form">
                <div className="space-y-2">
                  <label htmlFor="email" className={styles.label}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <User className={styles.inputIcon} />
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={styles.input}
                      placeholder="nombre@empresa.com"
                      autoComplete="username"
                      data-cy="login-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className={styles.label}>
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className={styles.inputIcon} />
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={styles.input}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      data-cy="login-password"
                    />
                  </div>
                </div>

                {error && (
                  <div className={styles.error} data-cy="login-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={styles.submit}
                  data-cy="login-submit"
                >
                  {isLoading ? 'Validando...' : 'Acceder'}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleDemo}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-300/60 bg-amber-100/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-amber-900 shadow-sm hover:bg-amber-200/80"
                    data-cy="login-demo"
                  >
                    Probar demo
                  </button>
                </div>
              </form>

              <div className={styles.footer}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className={styles.supportChip}>
                    <Headset className="w-4 h-4" /> Soporte 24/7
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className={styles.supportLink}
                    data-cy="forgot-password-link"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
