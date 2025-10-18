import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import type { Languages } from '../../contexts/LanguageContext';

const LANGUAGE_NAMES: Record<Languages, string> = {
  es: 'Español',
  en: 'English',
  pt: 'Português',
};
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
  const { language, setLanguage, t } = useLanguage();

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

  const copy = useMemo(() => {
    if (language === 'en') {
      return {
        heroTag: 'Personal Panel',
        heroTitle: 'Settings',
        heroDescription: 'Tailor the workspace experience, adjust the visual style, and control how information is presented across the platform.',
        heroUserLabel: 'User',
        privacy: {
          title: 'Privacy',
          cardTitle: 'Privacy and data',
          cardDescription: 'Clear local data and review policies',
        },
        appearance: {
          title: 'Appearance',
          themeTitle: 'Theme',
          themeDescriptionDark: 'Dark',
          themeDescriptionLight: 'Light',
          themeOptions: {
            light: 'Light',
            dark: 'Dark',
            system: 'System',
          },
          densityTitle: 'Interface density',
          densityDescription: 'Control the spacing between controls',
          densityOptions: {
            comfortable: 'Comfortable',
            compact: 'Compact',
          },
          fontTitle: 'Font size',
          fontDescription: 'Global text scale',
          fontOptions: {
            sm: 'Small',
            md: 'Medium',
            lg: 'Large',
          },
        },
        start: {
          title: 'Start',
          defaultPageTitle: 'Home page',
          defaultPageDescription: 'Page that opens after signing in',
          rememberTitle: 'Remember last view',
          rememberDescription: 'Re-open the last page you used',
        },
        intl: {
          title: 'Internationalization',
          languageTitle: 'Language',
          languageDescription: LANGUAGE_NAMES[language],
          dateFormatTitle: 'Date format',
          dateFormatDescription: 'How dates are displayed',
          timeFormatTitle: 'Time format',
          timeFormatDescription: '24-hour clock',
        },
        productivity: {
          title: 'Productivity',
          shortcutsTitle: 'Show shortcut tips',
          shortcutsDescription: 'Visual hints about keyboard shortcuts',
        },
        support: {
          title: 'Support',
          helpTitle: 'Help and support',
          helpDescription: 'FAQ, contact and reports',
          aboutTitle: 'About',
          aboutDescription: 'Version 1.0.0 • Build 2025.01.001',
        },
        buttons: {
          close: 'Close',
        },
        labels: {
          defaultRole: 'User',
          defaultArea: 'General',
        },
        modals: {
          aboutTitle: 'About Field Operations',
          aboutSubtitle: 'Corporate Web Hub • Empresas Wilson Castillo',
          aboutBody: [
            'Version: 1.0.0 — Build: 2025.01.001',
            '© 2025 Empresas Wilson Castillo. All rights reserved.',
          ],
          supportTitle: 'Help and support',
          faqTitle: 'Frequently asked questions',
          faqEntries: [
            'How do I report an incident? Go to Incidents and press “New”.',
            'Does it work offline? The app syncs as soon as it reconnects.',
            'Need to change your password? Go to Profile → Security.',
          ],
          supportContactTitle: 'Support contact',
          supportContactEmail: '📧 soporte@wilsoncastillo.com — 📞 +54 11 1234-5678',
          supportContactSchedule: 'Hours: Monday to Friday 8:00 - 18:00',
          privacyTitle: 'Privacy and security',
          privacyDescription: 'Empresas Wilson Castillo protects your privacy according to current regulations.',
          privacyClear: 'Clear local data',
          privacyPolicy: 'View privacy policy',
        },
      };
    }

    if (language === 'pt') {
      return {
        heroTag: 'Painel Pessoal',
        heroTitle: 'Configurações',
        heroDescription: 'Personalize a experiência de trabalho, ajuste o estilo visual e controle como as informações são exibidas na plataforma.',
        heroUserLabel: 'Usuário',
        privacy: {
          title: 'Privacidade',
          cardTitle: 'Privacidade e dados',
          cardDescription: 'Limpeza de dados locais e políticas',
        },
        appearance: {
          title: 'Aparência',
          themeTitle: 'Tema',
          themeDescriptionDark: 'Escuro',
          themeDescriptionLight: 'Claro',
          themeOptions: {
            light: 'Claro',
            dark: 'Escuro',
            system: 'Sistema',
          },
          densityTitle: 'Densidade da interface',
          densityDescription: 'Ajuste o espaço entre os controles',
          densityOptions: {
            comfortable: 'Confortável',
            compact: 'Compacta',
          },
          fontTitle: 'Tamanho da fonte',
          fontDescription: 'Escala global do texto',
          fontOptions: {
            sm: 'Pequena',
            md: 'Média',
            lg: 'Grande',
          },
        },
        start: {
          title: 'Início',
          defaultPageTitle: 'Página inicial',
          defaultPageDescription: 'Seleção ao entrar no sistema',
          rememberTitle: 'Lembrar última visualização',
          rememberDescription: 'Abre a última página utilizada',
        },
        intl: {
          title: 'Internacionalização',
          languageTitle: 'Idioma',
          languageDescription: LANGUAGE_NAMES[language],
          dateFormatTitle: 'Formato de data',
          dateFormatDescription: 'Como exibir as datas',
          timeFormatTitle: 'Formato de hora',
          timeFormatDescription: 'Relógio de 24 horas',
        },
        productivity: {
          title: 'Produtividade',
          shortcutsTitle: 'Mostrar dicas de atalhos',
          shortcutsDescription: 'Sugestões visuais sobre atalhos de teclado',
        },
        support: {
          title: 'Suporte',
          helpTitle: 'Ajuda e suporte',
          helpDescription: 'FAQ, contato e relatórios',
          aboutTitle: 'Sobre',
          aboutDescription: 'Versão 1.0.0 • Build 2025.01.001',
        },
        buttons: {
          close: 'Fechar',
        },
        labels: {
          defaultRole: 'Usuário',
          defaultArea: 'Geral',
        },
        modals: {
          aboutTitle: 'Sobre o Field Operations',
          aboutSubtitle: 'Hub Corporativo Web • Empresas Wilson Castillo',
          aboutBody: [
            'Versão: 1.0.0 — Build: 2025.01.001',
            '© 2025 Empresas Wilson Castillo. Todos os direitos reservados.',
          ],
          supportTitle: 'Ajuda e suporte',
          faqTitle: 'Perguntas frequentes',
          faqEntries: [
            'Como reportar um incidente? Vá em Incidentes e pressione “Novo”.',
            'Funciona offline? O app sincroniza assim que reconectar.',
            'Precisa mudar a senha? Acesse Perfil → Segurança.',
          ],
          supportContactTitle: 'Contato de suporte',
          supportContactEmail: '📧 soporte@wilsoncastillo.com — 📞 +54 11 1234-5678',
          supportContactSchedule: 'Horário: Segunda a Sexta 8:00 - 18:00',
          privacyTitle: 'Privacidade e segurança',
          privacyDescription: 'Empresas Wilson Castillo protege sua privacidade conforme as normas vigentes.',
          privacyClear: 'Limpar dados locais',
          privacyPolicy: 'Ver política de privacidade',
        },
      };
    }

    return {
      heroTag: 'Panel Personal',
      heroTitle: 'Configuración',
      heroDescription: 'Personaliza la experiencia de trabajo, ajusta tu apariencia preferida y controla cómo se presenta la información en toda la plataforma.',
      heroUserLabel: 'Usuario',
      privacy: {
        title: 'Privacidad',
        cardTitle: 'Privacidad y datos',
        cardDescription: 'Limpieza de datos locales y política',
      },
      appearance: {
        title: 'Apariencia',
        themeTitle: 'Tema',
        themeDescriptionDark: 'Oscuro',
        themeDescriptionLight: 'Claro',
        themeOptions: {
          light: 'Claro',
          dark: 'Oscuro',
          system: 'Sistema',
        },
        densityTitle: 'Densidad de interfaz',
        densityDescription: 'Configura el espacio entre controles',
        densityOptions: {
          comfortable: 'Cómoda',
          compact: 'Compacta',
        },
        fontTitle: 'Tamaño de fuente',
        fontDescription: 'Escala global del texto',
        fontOptions: {
          sm: 'Pequeño',
          md: 'Medio',
          lg: 'Grande',
        },
      },
      start: {
        title: 'Inicio',
        defaultPageTitle: 'Página de inicio',
        defaultPageDescription: 'Selección al iniciar sesión',
        rememberTitle: 'Recordar última vista',
        rememberDescription: 'Abre la última página utilizada',
      },
      intl: {
        title: 'Internacionalización',
        languageTitle: 'Idioma',
        languageDescription: LANGUAGE_NAMES[language],
        dateFormatTitle: 'Formato de fecha',
        dateFormatDescription: 'Cómo mostrar fechas',
        timeFormatTitle: 'Formato de hora',
        timeFormatDescription: 'Reloj de 24 horas',
      },
      productivity: {
        title: 'Productividad',
        shortcutsTitle: 'Mostrar tips de atajos',
        shortcutsDescription: 'Ayudas visuales sobre atajos de teclado',
      },
      support: {
        title: 'Soporte',
        helpTitle: 'Ayuda y soporte',
        helpDescription: 'FAQ, contacto y reportes',
        aboutTitle: 'Acerca de',
        aboutDescription: 'Versión 1.0.0 • Build 2025.01.001',
      },
      buttons: {
        close: 'Cerrar',
      },
      labels: {
        defaultRole: 'Usuario',
        defaultArea: 'General',
      },
      modals: {
        aboutTitle: 'Acerca de Field Operations',
        aboutSubtitle: 'Hub Corporativo Web • Empresas Wilson Castillo',
        aboutBody: [
          'Versión: 1.0.0 — Build: 2025.01.001',
          '© 2025 Empresas Wilson Castillo. Todos los derechos reservados.',
        ],
        supportTitle: 'Ayuda y soporte',
        faqTitle: 'Preguntas frecuentes',
        faqEntries: [
          '¿Cómo reporto un incidente? Ir a Incidentes y presionar “Nuevo”.',
          '¿Modo offline? La app sincroniza al reconectar.',
          '¿Cambiar contraseña? En Perfil → Seguridad.',
        ],
        supportContactTitle: 'Contacto soporte',
        supportContactEmail: '📧 soporte@wilsoncastillo.com — 📞 +54 11 1234-5678',
        supportContactSchedule: 'Horario: Lunes a Viernes 8:00 - 18:00',
        privacyTitle: 'Privacidad y seguridad',
        privacyDescription: 'Empresas Wilson Castillo protege tu privacidad según normativas vigentes.',
        privacyClear: 'Limpiar datos locales',
        privacyPolicy: 'Ver política de privacidad',
      },
    };
  }, [language]);

  // Persistencia
  useEffect(() => {
    localStorage.setItem('uiDensity', uiDensity);
    globalThis.dispatchEvent?.(new CustomEvent('ui-density-change', { detail: uiDensity }));
  }, [uiDensity]);
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
  const prefersDark = typeof globalThis.matchMedia === 'function' && globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
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

  const roleLabel = useMemo(() => user?.roles?.join(', ') || copy.labels.defaultRole, [user, copy]);
  const areaLabel = useMemo(() => user?.areas?.join(', ') || copy.labels.defaultArea, [user, copy]);

  const cardBase = 'relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm transition-colors dark:border-white/10 dark:bg-white/5 dark:shadow-black/30';
  const listCardBase = `${cardBase} divide-y divide-slate-200/60 dark:divide-white/5 p-0`;
  const sectionTitleClass = 'mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-blue-200/70';
  const optionSelectClass = 'rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 transition-colors focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:ring-sky-500';
  const actionButtonClass = 'flex w-full items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-sky-50/60 dark:hover:bg-white/10';
  const iconContainerClass = 'flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-inner dark:bg-sky-500/20 dark:text-sky-200';
  const toggleTrackClass = 'relative flex h-7 w-12 items-center rounded-full bg-slate-200 transition-colors peer-checked:bg-sky-500 dark:bg-white/10';
  const toggleThumbClass = 'pointer-events-none absolute left-[3px] top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5 dark:bg-slate-950';
  const modalBackdropClass = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm';
  const modalCardClass = 'relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 p-6 text-slate-700 shadow-2xl shadow-slate-300/40 backdrop-blur dark:border-white/10 dark:bg-slate-900/90 dark:text-white';
  const primaryButtonClass = 'rounded-2xl border border-transparent bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-500';
  const ghostButtonClass = 'rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:bg-sky-50 dark:border-white/20 dark:bg-white/10 dark:text-white';
  const dangerButtonClass = 'rounded-2xl border border-transparent bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500';

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-100 via-white to-indigo-100 px-8 py-6 text-slate-700 shadow-xl shadow-slate-200/50 dark:border-white/10 dark:from-blue-950 dark:via-slate-950 dark:to-slate-900 dark:text-white">
        <div className="pointer-events-none absolute -left-24 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-sky-300/40 blur-3xl dark:bg-sky-500/30" />
        <div className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full bg-indigo-200/60 blur-3xl dark:bg-indigo-500/30" />
        <div className="relative flex flex-wrap items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.32em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100">{copy.heroTag}</span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{copy.heroTitle}</h1>
            <p className="text-sm text-slate-600 dark:text-blue-100/80">{copy.heroDescription}</p>
          </div>
          <div className="flex min-w-[260px] flex-1 items-center justify-between rounded-3xl border border-white/50 bg-white/80 px-6 py-5 text-slate-700 shadow-lg shadow-slate-200/40 backdrop-blur-md dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-black/40">
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{copy.heroUserLabel}</p>
              <div className="text-lg font-semibold text-slate-900 dark:text-white">{user?.username ?? '—'}</div>
              {user?.email && <span className="text-xs font-medium text-slate-500 dark:text-blue-200/80">{user.email}</span>}
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/80 to-indigo-500/80 text-white shadow-lg shadow-slate-400/40 dark:shadow-black/40">
              <SettingsIcon className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Perfil */}
      <div className={cardBase}>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-indigo-500/30 text-sky-700 dark:text-sky-200">
            <UserIcon className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-[240px] space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.username}</p>
              {user?.email && (
                <span className="rounded-full border border-sky-200 bg-sky-100/80 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200">{user.email}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full border border-sky-200 bg-sky-100/80 px-3 py-1 text-sky-700 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-200">{roleLabel}</span>
              <span className="rounded-full border border-emerald-200 bg-emerald-100/80 px-3 py-1 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200">{areaLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Privacidad (sin duplicar cambio de contraseña) */}
      <section>
        <p className={sectionTitleClass}>{copy.privacy.title}</p>
        <div className={listCardBase}>
          <button className={actionButtonClass} onClick={() => setShowPrivacy(true)}>
            <div className="flex flex-1 items-center gap-4">
              <div className={`${iconContainerClass} text-rose-600 dark:text-rose-200`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 dark:text-white">{copy.privacy.cardTitle}</p>
                <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.privacy.cardDescription}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-blue-200/70" />
          </button>
        </div>
      </section>

      {/* Apariencia */}
      <section>
        <p className={sectionTitleClass}>{copy.appearance.title}</p>
        <div className={listCardBase}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-start gap-4">
              <div className={iconContainerClass}>
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{copy.appearance.themeTitle}</p>
                <p className="text-sm text-slate-500 dark:text-blue-200/80">{darkMode ? copy.appearance.themeDescriptionDark : copy.appearance.themeDescriptionLight}</p>
              </div>
            </div>
            <select className={optionSelectClass} value={themeMode} onChange={e => setThemeMode(e.target.value as ThemeMode)}>
              <option value="light">{copy.appearance.themeOptions.light}</option>
              <option value="dark">{copy.appearance.themeOptions.dark}</option>
              <option value="system">{copy.appearance.themeOptions.system}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.appearance.densityTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.appearance.densityDescription}</p>
            </div>
            <select className={optionSelectClass} value={uiDensity} onChange={e => setUiDensity(e.target.value as 'comfortable' | 'compact')}>
              <option value="comfortable">{copy.appearance.densityOptions.comfortable}</option>
              <option value="compact">{copy.appearance.densityOptions.compact}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.appearance.fontTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.appearance.fontDescription}</p>
            </div>
            <select className={optionSelectClass} value={fontScale} onChange={e => setFontScale(e.target.value as 'sm' | 'md' | 'lg')}>
              <option value="sm">{copy.appearance.fontOptions.sm}</option>
              <option value="md">{copy.appearance.fontOptions.md}</option>
              <option value="lg">{copy.appearance.fontOptions.lg}</option>
            </select>
          </div>
        </div>
      </section>

      {/* Inicio y navegación */}
      <section>
        <p className={sectionTitleClass}>{copy.start.title}</p>
        <div className={listCardBase}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.start.defaultPageTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.start.defaultPageDescription}</p>
            </div>
            <select className={optionSelectClass} value={defaultHomePage} onChange={e => setDefaultHomePage(e.target.value)}>
              <option value="dashboard">{t('nav.dashboard')}</option>
              <option value="tickets">{t('nav.tickets')}</option>
              <option value="notifications">{t('nav.notifications')}</option>
              <option value="maintenance">{t('nav.maintenance')}</option>
              <option value="trip-reports">{t('nav.tripReports')}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.start.rememberTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.start.rememberDescription}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <span className="sr-only">{copy.start.rememberTitle}</span>
              <input type="checkbox" className="peer sr-only" checked={rememberLastPage} onChange={e => setRememberLastPage(e.target.checked)} />
              <div className={`${toggleTrackClass} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-500`}>
                <span className={toggleThumbClass} />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Internacionalización */}
      <section>
        <p className={sectionTitleClass}>{copy.intl.title}</p>
        <div className={listCardBase}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-start gap-4">
              <div className={`${iconContainerClass} text-indigo-600 dark:text-indigo-200`}>
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{copy.intl.languageTitle}</p>
                <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.intl.languageDescription}</p>
              </div>
            </div>
            <select className={optionSelectClass} value={language} onChange={e => setLanguage(e.target.value as Languages)}>
              <option value="es">{LANGUAGE_NAMES.es}</option>
              <option value="en">{LANGUAGE_NAMES.en}</option>
              <option value="pt">{LANGUAGE_NAMES.pt}</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.intl.dateFormatTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.intl.dateFormatDescription}</p>
            </div>
            <select className={optionSelectClass} value={dateFormat} onChange={e => setDateFormat(e.target.value as 'DMY' | 'MDY')}>
              <option value="DMY">DD/MM/AAAA</option>
              <option value="MDY">MM/DD/YYYY</option>
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.intl.timeFormatTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.intl.timeFormatDescription}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <span className="sr-only">{copy.intl.timeFormatTitle}</span>
              <input type="checkbox" className="peer sr-only" checked={timeFormat24h} onChange={e => setTimeFormat24h(e.target.checked)} />
              <div className={`${toggleTrackClass} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-500`}>
                <span className={toggleThumbClass} />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Productividad */}
      <section>
        <p className={sectionTitleClass}>{copy.productivity.title}</p>
        <div className={listCardBase}>
          <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{copy.productivity.shortcutsTitle}</p>
              <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.productivity.shortcutsDescription}</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <span className="sr-only">{copy.productivity.shortcutsTitle}</span>
              <input type="checkbox" className="peer sr-only" checked={showShortcutHints} onChange={e => setShowShortcutHints(e.target.checked)} />
              <div className={`${toggleTrackClass} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-300 dark:peer-focus:ring-sky-500`}>
                <span className={toggleThumbClass} />
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Soporte */}
      <section>
        <p className={sectionTitleClass}>{copy.support.title}</p>
        <div className={listCardBase}>
          <button className={actionButtonClass} onClick={() => setShowSupport(true)}>
            <div className="flex flex-1 items-center gap-4">
              <div className={iconContainerClass}>
                <HelpCircle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 dark:text-white">{copy.support.helpTitle}</p>
                <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.support.helpDescription}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-blue-200/70" />
          </button>

          <button className={actionButtonClass} onClick={() => setShowAbout(true)}>
            <div className="flex flex-1 items-center gap-4">
              <div className={`${iconContainerClass} text-indigo-600 dark:text-indigo-200`}>
                <Info className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 dark:text-white">{copy.support.aboutTitle}</p>
                <p className="text-sm text-slate-500 dark:text-blue-200/80">{copy.support.aboutDescription}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 dark:text-blue-200/70" />
          </button>
        </div>
      </section>

      {/* Nota: el cierre de sesión se realiza desde el menú del usuario en el Header para evitar duplicación */}

      {/* Modales */}
      {showAbout && (
        <div className={modalBackdropClass}>
          <div className={modalCardClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{copy.modals.aboutTitle}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">{copy.modals.aboutSubtitle}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
                <Info className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-blue-200/80">
              {copy.modals.aboutBody.map(line => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button className={ghostButtonClass} onClick={() => setShowAbout(false)}>{copy.buttons.close}</button>
            </div>
          </div>
        </div>
      )}

      {showSupport && (
        <div className={modalBackdropClass}>
          <div className={modalCardClass}>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{copy.modals.supportTitle}</h3>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
                <HelpCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-blue-200/80">
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">{copy.modals.faqTitle}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {copy.modals.faqEntries.map(entry => (
                    <li key={entry}>{entry}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-slate-800 dark:text-white">{copy.modals.supportContactTitle}</p>
                <p>{copy.modals.supportContactEmail}</p>
                <p>{copy.modals.supportContactSchedule}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className={ghostButtonClass} onClick={() => setShowSupport(false)}>{copy.buttons.close}</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className={modalBackdropClass}>
          <div className={modalCardClass}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{copy.modals.privacyTitle}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-blue-200/80">{copy.modals.privacyDescription}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200">
                <Shield className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-3">
              <button
                className={dangerButtonClass}
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  setShowPrivacy(false);
                }}
              >
                {copy.modals.privacyClear}
              </button>
              <button className={primaryButtonClass} onClick={() => window.open('about:blank', '_blank')}>
                {copy.modals.privacyPolicy}
              </button>
              <button className={ghostButtonClass} onClick={() => setShowPrivacy(false)}>{copy.buttons.close}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
