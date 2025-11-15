import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TourContext, TourContextValue, TourStep, TourStateShape } from './tourContextStore';

const LS_KEY = 'demoTourState';
const isDemoActive = () => {
  const byEnv = String(import.meta.env.VITE_DEMO_MODE || 'false').toLowerCase() === 'true';
  try {
    return byEnv || localStorage.getItem('demoMode') === 'true';
  } catch (e) {
    console.warn('Tour demo: no se pudo leer demoMode desde localStorage', e);
    return byEnv;
  }
};

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const steps: TourStep[] = useMemo(() => ([
    { path: '/', title: 'Dashboard', description: 'Vista general: métricas clave, alertas y accesos rápidos para decidir prioridades.', target: '[data-tour="dashboard"]' },
    { path: '/rutas', title: 'Rutas', description: 'Planifica y asigna recorridos diarios; visualiza estado y pendientes.', target: '[data-tour="rutas"]' },
    { path: '/flota', title: 'Flota', description: 'Estado técnico, disponibilidad y próximos mantenimientos de cada vehículo.', target: '[data-tour="flota"]' },
    { path: '/combustible', title: 'Combustible', description: 'Registra cargas y analiza consumo, costos y eficiencia de la flota.', target: '[data-tour="combustible"]' },
    { path: '/mantenimiento', title: 'Mantenimiento', description: 'Control de órdenes: avance, costos estimados y cierre con verificación.', target: '[data-tour="mantenimiento"]' },
    { path: '/inventario', title: 'Inventario Taller', description: 'Control de stock de repuestos, consumibles y materiales del taller.', target: '[data-tour="inventario"]' },
    { path: '/inventario-it/dashboard', title: 'Inventario IT', description: 'Visibilidad de activos tecnológicos: equipos, licencias y estados de ciclo de vida.', target: '[data-tour="inventario-it"]' },
    { path: '/obras-civiles', title: 'Obras Civiles', description: 'Monitorea proyectos: progreso, hitos, materiales y riesgos asociados.', target: '[data-tour="obras-civiles"]' },
    { path: '/aseo', title: 'Aseo', description: 'Registro de jornadas de limpieza, tareas cumplidas y hallazgos relevantes.', target: '[data-tour="aseo"]' },
    { path: '/incidentes', title: 'Incidentes', description: 'Reporta eventos operativos y sigue su tratamiento hasta la resolución.', target: '[data-tour="incidentes"]' },
    { path: '/notificaciones', title: 'Notificaciones', description: 'Publica avisos segmentados por rol o área y fija los críticos.', target: '[data-tour="notificaciones"]' },
    { path: '/tickets', title: 'Tickets', description: 'Solicitudes internas: priorización, asignación y confirmaciones de cierre.', target: '[data-tour="tickets"]' },
    { path: '/usuarios', title: 'Usuarios', description: 'Administra cuentas, roles y especialidades habilitadas para operar.', target: '[data-tour="usuarios"]' },
    { path: '/ajustes', title: 'Configuración', description: 'Configura idioma, tema y opciones avanzadas del entorno de trabajo.', target: '[data-tour="ajustes"]' },
  ]), []);

  const [state, setState] = useState<TourStateShape>(() => ({ active: false, index: 0, completed: false }));

  // Load persisted state
  useEffect(() => {
    if (!isDemoActive()) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TourStateShape;
        // If tour was active previously, we allow resume via start button
        setState(parsed);
      }
    } catch (e) {
      console.warn('Tour demo: estado inválido en localStorage', e);
    }
  }, []);

  // Persist state when changes
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Tour demo: no se pudo persistir estado', e);
    }
  }, [state]);

  const startTour = useCallback(() => {
    setState({ active: true, index: 0, completed: false });
  }, []);

  const stopTour = useCallback(() => {
    setState((s: TourStateShape) => ({
      ...s,
      active: false,
      completed: s.index >= steps.length - 1 ? true : s.completed,
    }));
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setState((s: TourStateShape) => ({ ...s, index: Math.max(s.index - 1, 0) }));
  }, []);

  const restartTour = useCallback(() => {
    setState({ active: true, index: 0, completed: false });
  }, []);

  const resumeTour = useCallback(() => {
    setState((s: TourStateShape) => ({ ...s, active: true }));
  }, []);

  // Navigate on step change
  useEffect(() => {
    if (!state.active) return;

    const target = steps[state.index];
    if (!target) return;

    const currentPath = location.pathname;

    // Si el paso apunta al módulo de Inventario IT, permitir navegar entre sus subrutas
    const isITInventoryModule = target.path.startsWith('/inventario-it/');
    const isWithinITInventory = currentPath.startsWith('/inventario-it/');

    if (isITInventoryModule && isWithinITInventory) return;

    if (currentPath !== target.path) navigate(target.path);
  }, [state.active, state.index, steps, navigate, location.pathname]);

  // Global event compatibility
  useEffect(() => {
    const onStart = () => startTour();
    const onResume = () => resumeTour();
    const onReset = () => restartTour();
    globalThis.addEventListener?.('demo:startTour', onStart as EventListener);
    globalThis.addEventListener?.('demo:resumeTour', onResume as EventListener);
    globalThis.addEventListener?.('demo:resetTour', onReset as EventListener);
    return () => {
      globalThis.removeEventListener?.('demo:startTour', onStart as EventListener);
      globalThis.removeEventListener?.('demo:resumeTour', onResume as EventListener);
      globalThis.removeEventListener?.('demo:resetTour', onReset as EventListener);
    };
  }, [startTour, resumeTour, restartTour]);

  // Auto-start from login flag
  useEffect(() => {
    if (!isDemoActive()) return;
    try {
      const auto = localStorage.getItem('autoStartTour') === 'true';
      if (auto) {
        localStorage.removeItem('autoStartTour');
        setTimeout(() => startTour(), 120);
      }
    } catch (e) {
      console.warn('Tour demo: no se pudo leer autoStartTour', e);
    }
  }, [startTour]);

  const value: TourContextValue = useMemo(() => ({
    steps,
    active: state.active,
    index: state.index,
    completed: state.completed,
    startTour,
    stopTour,
    nextStep: () => {
      setState((s: TourStateShape) => {
        const next = Math.min(s.index + 1, steps.length - 1);
        const willComplete = next === steps.length - 1;
        return { active: !willComplete, index: next, completed: willComplete ? true : s.completed };
      });
    },
    prevStep,
    restartTour,
    resumeTour,
  }), [steps, state.active, state.index, state.completed, startTour, stopTour, prevStep, restartTour, resumeTour]);

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
};
