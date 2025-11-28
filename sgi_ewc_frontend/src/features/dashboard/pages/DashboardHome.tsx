import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { AlertTriangle, Clock, Leaf, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { fetchDashboardOverview, DashboardModuleKey } from '../../../utils/dashboardApi';
import type { OrdenTrabajo } from '../../../types/OrdenTrabajo';
import type { Ticket as TicketType } from '../../../types/Ticket';
import type { Aseo } from '../../../types/Aseo';
import type { CivilWork } from '../../../types/CivilWork';
import type { Incident } from '../../../types/Incident';
import { toAppNotification } from '../../../utils/notificationApi';
import type { ModuleAlert, ModuleDefinition, ModuleHighlight, ModuleKey, TrendTone } from '../types';
import type { ChartTheme } from '../components/Charts';
import { moduleBlueprints } from '../config/moduleBlueprints';
import {
  addDays,
  buildPrioritizedAlerts,
  buildTransportSeries,
  buildMaintenanceSeries,
  buildTicketsSeries,
  buildCivilTop,
  computeCleaningCompliance,
  buildTimelineSeries,
  buildGeneralSeries,
  computeCivilWorksModule,
  computeCleaningModule,
  computeGeneralFromSummaries,
  computeMaintenanceModule,
  computeTicketsModule,
  computeTransportModule,
  lastNDays,
  RealModuleData,
  startOfWeekMonday,
  
} from '../utils/dashboard';


const trendPillStyles: Record<TrendTone, string> = {
  up: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  down: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  neutral: 'bg-gray-200 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300'
};

const priorityTone: Record<ModuleAlert['priority'], string> = {
  Urgente: 'bg-red-200 text-red-800 dark:bg-red-900/70 dark:text-red-200',
  Crítica: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200',
  Alta: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  Media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  Baja: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
};

// Nota: el orden visual se maneja con prioWeight en tiempo de cómputo del pool

const QuickMetricTone = {
  positive: 'border-green-500',
  warning: 'border-amber-500',
  negative: 'border-red-500',
  neutral: 'border-gray-200 dark:border-gray-700'
} as const;

interface QuickMetric {
  key: string;
  label: string;
  value: string;
  helper: string;
  tone: keyof typeof QuickMetricTone;
  progress?: number;
}

const getCompletionTone = (completion: number): QuickMetric['tone'] => {
  if (completion >= 0.9) return 'positive';
  if (completion >= 0.75) return 'neutral';
  return 'negative';
};

const getCompletionHelper = (completion: number): string => {
  return completion >= 0.9 ? 'Excelente adopción' : 'Revisa tareas sensibles';
};

const getBacklogTone = (backlog: number): QuickMetric['tone'] => {
  if (backlog > 6) return 'negative';
  if (backlog > 0) return 'warning';
  return 'positive';
};

const useIsDarkMode = () => {
  const getDark = () => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  };

  const [isDark, setIsDark] = useState(getDark);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
      return undefined;
    }

    const observer = new MutationObserver(() => setIsDark(getDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);



  return isDark;
};


const buildChartTheme = (isDark: boolean): ChartTheme => {
  if (isDark) {
    return {
      axisColor: '#e2e8f0',
      gridColor: 'rgba(148, 163, 184, 0.25)',
      tooltipBg: '#0f172a',
      tooltipBorder: '#1e293b',
      tooltipText: '#f1f5f9',
      areaStroke: '#60a5fa',
      areaStart: '#3b82f6',
      areaEnd: '#1e3a8a',
      linePrimary: '#60a5fa',
      lineSecondary: '#34d399',
      lineAlert: '#f97316',
      linePositive: '#22c55e',
      barPrimary: '#38bdf8',
      barSecondary: '#34d399',
      barTertiary: '#2dd4bf',
      radialPrimary: '#22c55e',
      radialTrack: '#1f2937',
      civilPalette: ['#38bdf8', '#22d3ee', '#34d399', '#4ade80']
    };
  }

  return {
    axisColor: '#1f2937',
    gridColor: 'rgba(148, 163, 184, 0.35)',
    tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0',
    tooltipText: '#1f2937',
    areaStroke: '#2563eb',
    areaStart: '#2563eb',
    areaEnd: '#2563eb',
    linePrimary: '#2563eb',
    lineSecondary: '#10b981',
    lineAlert: '#f97316',
    linePositive: '#22c55e',
    barPrimary: '#52525b',
    barSecondary: '#22c55e',
    barTertiary: '#0ea5e9',
    radialPrimary: '#16a34a',
    radialTrack: '#d1d5db',
    civilPalette: ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4']
  };
};

// moduleBlueprints se movió a ../config/moduleBlueprints

const timelineTemplate = [
  { label: 'Lun', workload: 44, alerts: 3 },
  { label: 'Mar', workload: 52, alerts: 4 },
  { label: 'Mie', workload: 60, alerts: 3 },
  { label: 'Jue', workload: 57, alerts: 5 },
  { label: 'Vie', workload: 63, alerts: 4 },
  { label: 'Sab', workload: 34, alerts: 2 },
  { label: 'Dom', workload: 28, alerts: 1 }
];

const normalizeArea = (area: string | undefined) => (area || '').trim().toLowerCase();

// Predicados reutilizables para reducir anidación
const isTransportAreaTicket = (t: TicketType) => Array.isArray(t.recipientArea) && t.recipientArea.some(a => (a || '').toLowerCase().includes('transporte'));
const isDelayIncident = (i: Incident) => ((i.type || '').toString().toLowerCase().includes('traffic') || (i.type || '').toString().toLowerCase().includes('accident'));

// Helpers: acceso y módulos habilitados (definidos a nivel de módulo para evitar dependencias en hooks)
const computeAccessAreas = (usr: ReturnType<typeof useAuth>['user']): Set<string> => {
  const areas = new Set<string>();
  for (const area of usr?.areas ?? []) areas.add(normalizeArea(area));
  for (const assignment of usr?.roleAssignments ?? []) if (assignment.area) areas.add(normalizeArea(assignment.area));
  if (usr?.isAdmin || usr?.roles?.includes('Admin')) {
    for (const area of ['transporte', 'taller', 'aseo', 'obras', 'it']) areas.add(area);
  }
  return areas;
};

const getEnabledModuleKeys = (areaAccessSet: Set<string>): Set<ModuleKey> => {
  const keys = new Set<ModuleKey>();
  for (const m of Object.values(moduleBlueprints)) {
    if (m.areaKey === '*' || areaAccessSet.has(normalizeArea(m.areaKey))) {
      keys.add(m.key);
    }
  }
  return keys;
};

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const isDarkMode = useIsDarkMode();
  const chartTheme = useMemo(() => buildChartTheme(isDarkMode), [isDarkMode]);

  // Datos reales agregados por módulo
  const [realStats, setRealStats] = useState<Partial<Record<ModuleKey, RealModuleData>>>({});
  const [usersCount, setUsersCount] = useState<number | null>(null);
  // Series y datos derivados para gráficas y alertas
  const [transportSeries, setTransportSeries] = useState<Array<{ day: string; viajes: number; retrasos: number }>>([]);
  const [maintenanceSeries, setMaintenanceSeries] = useState<Array<{ label: string; programado: number; completado: number }>>([]);
  const [ticketsSeries, setTicketsSeries] = useState<Array<{ label: string; abiertos: number; resueltos: number }>>([]);
  const [civilSeries, setCivilSeries] = useState<Array<{ proyecto: string; progreso: number }>>([]);
  const [cleaningCompliance, setCleaningCompliance] = useState<number>(0);
  const [timelineSeries, setTimelineSeries] = useState<Array<{ label: string; workload: number; alerts: number }>>([]);
  const [generalSeries, setGeneralSeries] = useState<Array<{ month: string; engagement: number; satisfaction: number }>>([]);
  const [prioritizedAll, setPrioritizedAll] = useState<ModuleAlert[]>([]);
  const [prioritizedCritical, setPrioritizedCritical] = useState<ModuleAlert[]>([]);
  const [onlyCritical, setOnlyCritical] = useState<boolean>(() => {
    if (typeof globalThis !== 'undefined') {
      const stored = globalThis.window?.localStorage.getItem('dashboard_alerts_critical') ?? null;
      if (stored === 'all') return false;
    }
    return true;
  });
  // Persistir preferencia del selector de alertas priorizadas
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      globalThis.window?.localStorage.setItem('dashboard_alerts_critical', onlyCritical ? 'critical' : 'all');
    }
  }, [onlyCritical]);
  // Ventanas configurables
  const [transportDays, setTransportDays] = useState<7 | 14>(7);
  const [timelineDays, setTimelineDays] = useState<7 | 14>(7);
  const [maintenanceWeeks, setMaintenanceWeeks] = useState<4 | 8 | 12>(4);
  const [ticketWeeks, setTicketWeeks] = useState<6 | 8 | 12>(6);
  // Datasets crudos para recomputar series
  const [rawTickets, setRawTickets] = useState<TicketType[]>([]);
  const [rawOts, setRawOts] = useState<OrdenTrabajo[]>([]);
  const [rawAseos, setRawAseos] = useState<Aseo[]>([]);
  const [rawCivil, setRawCivil] = useState<Array<Partial<CivilWork>>>([]);
  const [rawIncidents, setRawIncidents] = useState<Incident[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Determinar módulos habilitados para este usuario y limitar fetch
        const access = computeAccessAreas(user);
        const enabledKeys = getEnabledModuleKeys(access);
        const needTransport = enabledKeys.has('transport');
        const needMaintenance = enabledKeys.has('maintenance');
        const needCleaning = enabledKeys.has('cleaning');
        const needCivil = enabledKeys.has('civilWorks');
        const needTickets = enabledKeys.has('tickets') || needTransport; // transporte usa tickets para series
        const needIncidents = needTransport; // retrasos transporte y timeline por módulos habilitados

        const modulesToFetch = new Set<DashboardModuleKey>(['users']);
        if (needTransport) modulesToFetch.add('transport');
        if (needMaintenance) modulesToFetch.add('maintenance');
        if (needTickets) modulesToFetch.add('tickets');
        if (needCleaning) modulesToFetch.add('cleaning');
        if (needCivil) modulesToFetch.add('civilWorks');
        if (needIncidents) modulesToFetch.add('incidents');
        if (enabledKeys.has('tickets')) modulesToFetch.add('notifications');

        const overview = await fetchDashboardOverview({
          modules: Array.from(modulesToFetch),
          vehiclesPageSize: needTransport ? 200 : undefined,
          driversPageSize: needTransport ? 200 : undefined,
          workOrdersPageSize: needMaintenance ? 200 : undefined,
          ticketsPageSize: needTickets ? 200 : undefined,
          cleaningPageSize: needCleaning ? 200 : undefined,
          civilWorksPageSize: needCivil ? 200 : undefined,
          incidentsPageSize: needIncidents ? 200 : undefined,
          notificationsPageSize: enabledKeys.has('tickets') ? 50 : undefined,
          usersPageSize: 200,
        });

        const vehicles = overview.transport?.vehicles?.items ?? [];
        const drivers = overview.transport?.drivers?.items ?? [];
        const ots = overview.maintenance?.workOrders?.items ?? [];
        const tickets = overview.tickets?.items ?? [];
        const aseos = overview.cleaning?.items ?? [];
        const civil = overview.civilWorks ?? { items: [] as Partial<CivilWork>[], total: 0, page: 1, pageSize: 0 };
        const incidents = overview.incidents?.items ?? [];
        const notificationsRaw = overview.notifications?.items ?? [];
        const notifications = notificationsRaw.map(toAppNotification);
  const users = overview.users?.items ?? [];
  const usersTotal = overview.users?.total ?? (Array.isArray(users) ? users.length : null);

        if (cancelled) return;

    // Transporte (flota)
    const transport = computeTransportModule(vehicles, drivers.length);

  // Mantenimiento (OT)
  const maintenance = computeMaintenanceModule(ots);

  // Aseo (cleaning)
  const cleaning = computeCleaningModule(aseos);

    // Obras Civiles
    const cwItems = civil.items ?? [];
    const civilWorks = computeCivilWorksModule(cwItems);

  // Tickets
  const ticketsData = computeTicketsModule(tickets);

        // General (de momento lo agregamos al consolidado mediante agregación en runtime)

        // General (visión general) a partir de agregados reales
        const generalReal = computeGeneralFromSummaries([
          transport, maintenance, cleaning, civilWorks, ticketsData
        ], Array.isArray(users) ? users.length : 0);

        const next: Partial<Record<ModuleKey, RealModuleData>> = {
          general: generalReal,
          transport,
          maintenance,
          cleaning,
          civilWorks,
          tickets: ticketsData,
        };
        setRealStats(next);
  setUsersCount(usersTotal);

        // --------- Series reales y alertas ---------
        // Helpers de fechas
        const today = new Date();
        const startOfWeek = startOfWeekMonday;

  // Transporte: 7 días
  const days7 = lastNDays(7);
  const ticketsTransporte = tickets.filter(isTransportAreaTicket);
  const incidentsDelay = incidents.filter(isDelayIncident);
  setTransportSeries(buildTransportSeries(days7, ticketsTransporte, incidentsDelay));

        // Mantenimiento: últimas 4 semanas (W-3..W0)
        const thisWeekStart = startOfWeek(today);
        const weekStarts = [3,2,1,0].map(off => addDays(thisWeekStart, -7*off));
        const weekRanges = weekStarts.map(ws => ({ label: `W-${Math.round((+thisWeekStart - +ws)/ (7*24*3600*1000))}`, start: ws, end: addDays(ws, 7) }));
  const otsCompletadas = ots.filter(o => o.estado === 'completado');
  setMaintenanceSeries(buildMaintenanceSeries(weekRanges, ots, otsCompletadas));

        // Tickets: últimas 6 semanas
        const weekStarts6 = [5,4,3,2,1,0].map(off => addDays(thisWeekStart, -7*off));
        const weekRanges6 = weekStarts6.map((ws, idx) => ({ label: `W-${5-idx}`, start: ws, end: addDays(ws,7) }));
  const ticketsResueltos = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado');
  setTicketsSeries(buildTicketsSeries(weekRanges6, tickets, ticketsResueltos));

        // Civil works: top 4 por progreso
        setCivilSeries(buildCivilTop(cwItems, 4));

        // Cleaning compliance (últimos 30 días)
  const days30Start = addDays(today, -30);
  setCleaningCompliance(computeCleaningCompliance(aseos, days30Start));

    // Timeline consolidada: últimos 7 días
    setTimelineSeries(buildTimelineSeries(days7, { tickets, ots, aseos, incidents }));

        // Serie de Visión General (semanal -> proxy de engagement y satisfacción)
        const nWeeks = 6;
        const weekStartsGen = Array.from({ length: nWeeks }, (_, i) => addDays(thisWeekStart, -7 * (nWeeks - 1 - i)));
        const weekRangesGen = weekStartsGen.map((ws, idx) => ({ label: `W-${(nWeeks - 1) - idx}`, start: ws, end: addDays(ws, 7) }));
        setGeneralSeries(buildGeneralSeries(weekRangesGen, { tickets, ots, aseos, incidents }));

        // Alertas priorizadas reales (top 5, solo Urgente/Crítica/Alta)
        const { all: poolAll, critical: poolCritical } = buildPrioritizedAlerts({
          tickets, ots, incidents, civil: cwItems, aseos, notifications
        });
        setPrioritizedAll(poolAll);
        setPrioritizedCritical(poolCritical);
        // Reflejar también las alertas priorizadas en el módulo General (usamos críticas)
        setRealStats(prev => ({
          ...prev,
          general: {
            ...(prev.general ?? { highlights: [], summary: { activeItems: 0, alerts: 0, completion: 0, backlog: 0 } }),
            alerts: poolCritical.slice(0, 5)
          }
        }));

  // Guardamos datasets crudos para recomputaciones por rango
  setRawTickets(tickets);
  setRawOts(ots);
  setRawAseos(aseos);
  setRawCivil(cwItems);
  setRawIncidents(incidents);
      } catch (e) {
        // silencioso: si algo falla, dejamos valores por defecto
        console.debug('dashboard data fetch error', e);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [user]);

  // Recomputar series al cambiar ventanas o datasets crudos
  useEffect(() => {
    const hasData = rawTickets.length || rawOts.length || rawAseos.length || rawCivil.length || rawIncidents.length;
    if (!hasData) return;
    const today = new Date();

    // Transporte
    const daysT = lastNDays(transportDays);
  const ticketsTransporte = rawTickets.filter(isTransportAreaTicket);
  const incidentsDelay = rawIncidents.filter(isDelayIncident);
    setTransportSeries(buildTransportSeries(daysT, ticketsTransporte, incidentsDelay));

    // Mantenimiento
    const thisWeekStart = startOfWeekMonday(today);
    const weekStarts = Array.from({ length: maintenanceWeeks }).map((_, idx, arr) => addDays(thisWeekStart, -7 * (arr.length - 1 - idx)));
    const weekRanges = weekStarts.map(ws => ({ label: `W-${Math.round((+thisWeekStart - +ws)/ (7*24*3600*1000))}`, start: ws, end: addDays(ws, 7) }));
    const otsCompletadas = rawOts.filter(o => o.estado === 'completado');
    setMaintenanceSeries(buildMaintenanceSeries(weekRanges, rawOts, otsCompletadas));

    // Tickets
    const weekStartsTk = Array.from({ length: ticketWeeks }).map((_, idx, arr) => addDays(thisWeekStart, -7 * (arr.length - 1 - idx)));
    const weekRangesTk = weekStartsTk.map((ws, idx, arr) => ({ label: `W-${(arr.length - 1) - idx}`, start: ws, end: addDays(ws,7) }));
    const ticketsResueltos = rawTickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado');
    setTicketsSeries(buildTicketsSeries(weekRangesTk, rawTickets, ticketsResueltos));

    // Civil top 4
    setCivilSeries(buildCivilTop(rawCivil, 4));

    // Cumplimiento Aseo 30 días
    const d30 = addDays(today, -30);
  setCleaningCompliance(computeCleaningCompliance(rawAseos, d30));

    // Timeline
    const daysTimeline = lastNDays(timelineDays);
  setTimelineSeries(buildTimelineSeries(daysTimeline, { tickets: rawTickets, ots: rawOts, aseos: rawAseos, incidents: rawIncidents }));
  }, [rawTickets, rawOts, rawAseos, rawCivil, rawIncidents, transportDays, maintenanceWeeks, ticketWeeks, timelineDays]);

  const areaAccess = useMemo(() => {
    const areas = new Set<string>();
    for (const area of user?.areas ?? []) {
      areas.add(normalizeArea(area));
    }

    for (const assignment of user?.roleAssignments ?? []) {
      if (assignment.area) {
        areas.add(normalizeArea(assignment.area));
      }
    }

    if (user?.isAdmin || user?.roles?.includes('Admin')) {
      for (const area of ['transporte', 'taller', 'aseo', 'obras', 'it']) {
        areas.add(area);
      }
    }
    return areas;
  }, [user]);

  const modulesToRender: ModuleDefinition[] = useMemo(() => {
    return Object.values(moduleBlueprints).filter(module => {
      if (module.areaKey === '*') return true;
      return areaAccess.has(normalizeArea(module.areaKey));
    });
  }, [areaAccess]);

  const specializedModules: ModuleDefinition[] = useMemo(
    () => modulesToRender.filter(module => module.areaKey !== '*'),
    [modulesToRender]
  );

  const aggregatedSummary = useMemo(() => {
    if (specializedModules.length === 0) {
      return moduleBlueprints.general.summary;
    }
    return specializedModules.reduce(
      (acc, module) => ({
        activeItems: acc.activeItems + module.summary.activeItems,
        alerts: acc.alerts + module.summary.alerts,
        completion: acc.completion + module.summary.completion,
        backlog: acc.backlog + module.summary.backlog
      }),
      { activeItems: 0, alerts: 0, completion: 0, backlog: 0 }
    );
  }, [specializedModules]);

  // Reemplazo con datos reales cuando existan
  const realAggregate = useMemo(() => {
    const keys = modulesToRender.filter(m => m.areaKey !== '*').map(m => m.key);
    let sumActive = 0, sumAlerts = 0, sumCompletion = 0, sumBacklog = 0, count = 0;
    for (const k of keys) {
      const s = realStats[k]?.summary;
      if (s) { sumActive += s.activeItems; sumAlerts += s.alerts; sumCompletion += s.completion; sumBacklog += s.backlog; count++; }
    }
    return { sumActive, sumAlerts, sumCompletion, sumBacklog, count };
  }, [realStats, modulesToRender]);

  const avgCompletion = useMemo(() => {
    if (realAggregate.count) return realAggregate.sumCompletion / realAggregate.count;
    if (!specializedModules.length) return moduleBlueprints.general.summary.completion;
    return aggregatedSummary.completion / specializedModules.length;
  }, [realAggregate, aggregatedSummary, specializedModules.length]);

  const timelineData = useMemo(() => {
    if (timelineSeries.length) return timelineSeries;
    const scale = 0.7 + specializedModules.length * 0.25;
    return timelineTemplate.map(item => ({
      label: item.label,
      workload: Math.round(item.workload * scale),
      alerts: Math.max(1, Math.round(item.alerts * Math.max(scale * 0.6, 0.4)))
    }));
  }, [specializedModules.length, timelineSeries]);

  const prioritizedAlerts = useMemo((): Array<ModuleAlert & { module: string }> => {
    const base = (onlyCritical ? prioritizedCritical : prioritizedAll).slice(0, 5);
    // Mostrar la lista aunque esté vacía, pero si no hay alertas críticas y se selecciona "todas", mostrar top 5 de todas las prioridades si existen
    if (!onlyCritical && base.length === 0 && prioritizedAll.length > 0) {
      return prioritizedAll.slice(0, 5).map(a => ({ ...a, module: a.owner }));
    }
    return base.map(a => ({ ...a, module: a.owner }));
  }, [onlyCritical, prioritizedAll, prioritizedCritical]);

  const quickMetrics: QuickMetric[] = useMemo(() => {
    const moduleCount = specializedModules.length;
    const hasReal = realAggregate.count > 0;
    let alerts = 0;
    if (hasReal) {
      alerts = realAggregate.sumAlerts;
    } else if (specializedModules.length) {
      alerts = aggregatedSummary.alerts;
    } else {
      alerts = moduleBlueprints.general.summary.alerts;
    }
    let backlog = 0;
    if (hasReal) {
      backlog = realAggregate.sumBacklog;
    } else if (specializedModules.length) {
      backlog = aggregatedSummary.backlog;
    } else {
      backlog = moduleBlueprints.general.summary.backlog;
    }
    const completionTone = getCompletionTone(avgCompletion);
    const completionHelper = getCompletionHelper(avgCompletion);
    const backlogTone = getBacklogTone(backlog);
    const backlogHelper = backlog > 0 ? 'Requiere reasignación' : 'Nada pendiente';
    return [
      {
        key: 'modules',
        label: 'Módulos habilitados',
        value: moduleCount.toString(),
        helper: moduleCount ? 'Paneles especializados activos' : 'Sin módulos especiales asignados',
        tone: moduleCount ? 'positive' : 'neutral'
      },
      {
        key: 'alerts',
        label: 'Alertas abiertas',
        value: alerts.toString(),
        helper: alerts ? 'Prioriza seguimiento hoy' : 'Sin pendientes críticos',
        tone: alerts ? 'warning' : 'positive'
      },
      {
        key: 'completion',
        label: 'Cumplimiento promedio',
        value: `${Math.round(avgCompletion * 100)}%`,
        helper: completionHelper,
        tone: completionTone,
        progress: avgCompletion
      },
      {
        key: 'backlog',
        label: 'Backlog crítico',
        value: backlog.toString(),
        helper: backlogHelper,
        tone: backlogTone
      }
    ];
  }, [aggregatedSummary, avgCompletion, specializedModules.length, realAggregate]);

  const moduleBadges = useMemo(
    () => specializedModules.map(module => module.label),
    [specializedModules]
  );
  const greetingMessage = useMemo(() => {
    if (moduleBadges.length === 0) {
      return 'Configura accesos para habilitar paneles especializados';
    }
    const descriptor = moduleBadges.length > 1 ? 'los módulos' : 'el módulo';
    return `Gestiona hoy ${descriptor} ${moduleBadges.join(', ')}`;
  }, [moduleBadges]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-8 text-white shadow-lg">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/70">Panel principal</p>
            <h2 className="text-3xl font-semibold tracking-tight">Hola, {user?.username || 'usuario'}</h2>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              {greetingMessage}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right text-sm">
            <div>
              <p className="text-white/70">Colaboradores conectados</p>
              <p className="text-2xl font-semibold">{usersCount ?? (moduleBlueprints.general.summary.activeItems + specializedModules.length * 6)}</p>
            </div>
            <div>
              <p className="text-white/70">Alertas activas</p>
              <p className="text-2xl font-semibold">{prioritizedAlerts.length || (realAggregate.count ? realAggregate.sumAlerts : aggregatedSummary.alerts)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickMetrics.map(metric => (
          <div
            key={metric.key}
            className={`rounded-xl border bg-white p-5 shadow-sm transition dark:border-gray-800 dark:bg-gray-900 ${QuickMetricTone[metric.tone]}`}
          >
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{metric.value}</p>
            {typeof metric.progress === 'number' ? (
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800" aria-hidden />
                <div
                  className="-mt-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ width: `${Math.min(100, Math.max(0, Math.round((metric.progress || 0) * 100)))}%` }}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{metric.helper}</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{metric.helper}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Actividad operativa semanal</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Carga de trabajo consolidada y alertas emergentes</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                value={timelineDays}
                onChange={(e) => setTimelineDays(Number(e.target.value) as 7 | 14)}
              >
                <option value={7}>7 días</option>
                <option value={14}>14 días</option>
              </select>
              <ShieldCheck className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="timelineWorkload" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartTheme.areaStart} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={chartTheme.areaEnd} stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  stroke={chartTheme.axisColor}
                  tick={{ fill: chartTheme.axisColor }}
                  tickLine={false}
                />
                <YAxis
                  stroke={chartTheme.axisColor}
                  tick={{ fill: chartTheme.axisColor }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTheme.tooltipBg,
                    borderColor: chartTheme.tooltipBorder,
                    borderRadius: 12,
                    color: chartTheme.tooltipText
                  }}
                  itemStyle={{ color: chartTheme.tooltipText }}
                  labelStyle={{ color: chartTheme.tooltipText }}
                />
                <Area type="monotone" dataKey="workload" stroke={chartTheme.areaStroke} fill="url(#timelineWorkload)" strokeWidth={2} />
                <Line type="monotone" dataKey="alerts" stroke={chartTheme.lineAlert} strokeWidth={2} dot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Alertas priorizadas</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ordenadas por criticidad y vencimiento</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                value={onlyCritical ? 'critical' : 'all'}
                onChange={(e) => setOnlyCritical(e.target.value === 'critical')}
              >
                <option value="critical">Solo críticas</option>
                <option value="all">Todas</option>
              </select>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {prioritizedAlerts.length ? (
              prioritizedAlerts.map(alert => (
                <div key={alert.id} className="rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{alert.label}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityTone[alert.priority]}`}>
                      {alert.priority}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{alert.module}</span>
                    <span>{alert.owner}</span>
                    <span>{alert.eta}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Sin alertas críticas asignadas
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {modulesToRender.map((module: ModuleDefinition) => {
          const Icon = module.icon;
          const mergedHighlights: ModuleHighlight[] = realStats[module.key]?.highlights ?? module.highlights;
          const mergedSummary = realStats[module.key]?.summary ?? module.summary;
          const mergedAlerts: ModuleAlert[] = realStats[module.key]?.alerts ?? module.alerts;
          return (
            <div
              key={module.key}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl bg-gradient-to-br ${module.gradientFrom} ${module.gradientTo} p-3 text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{module.label}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{module.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    {Math.round(mergedSummary.completion * 100)}% cumplimiento
                  </span>
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {mergedSummary.activeItems} tareas vivas
                  </span>
                  {module.key === 'transport' && (
                    <select
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      value={transportDays}
                      onChange={(e) => setTransportDays(Number(e.target.value) as 7 | 14)}
                    >
                      <option value={7}>7 días</option>
                      <option value={14}>14 días</option>
                    </select>
                  )}
                  {module.key === 'maintenance' && (
                    <select
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      value={maintenanceWeeks}
                      onChange={(e) => setMaintenanceWeeks(Number(e.target.value) as 4 | 8 | 12)}
                    >
                      <option value={4}>4 semanas</option>
                      <option value={8}>8 semanas</option>
                      <option value={12}>12 semanas</option>
                    </select>
                  )}
                  {module.key === 'tickets' && (
                    <select
                      className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                      value={ticketWeeks}
                      onChange={(e) => setTicketWeeks(Number(e.target.value) as 6 | 8 | 12)}
                    >
                      <option value={6}>6 semanas</option>
                      <option value={8}>8 semanas</option>
                      <option value={12}>12 semanas</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
                <div className="space-y-4">
                  {mergedHighlights.map((item: ModuleHighlight) => (
                    <div key={`${module.key}-${item.label}`} className="flex items-start justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                        <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-gray-100">{item.value}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${trendPillStyles[item.trendTone]}`}>
                        {item.trend}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="h-56 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  {(() => {
                    let chartData: unknown = undefined;
                    switch (module.key) {
                        case 'general':
                          chartData = generalSeries;
                          break;
                      case 'transport':
                        chartData = transportSeries;
                        break;
                      case 'maintenance':
                        chartData = maintenanceSeries;
                        break;
                      case 'tickets':
                        chartData = ticketsSeries;
                        break;
                      case 'civilWorks':
                        chartData = civilSeries;
                        break;
                      case 'cleaning':
                        chartData = { compliance: cleaningCompliance };
                        break;
                      default:
                        chartData = undefined;
                    }
                    return <module.ChartComponent chartTheme={chartTheme} data={chartData} />;
                  })()}
                </div>
              </div>

              {mergedAlerts.length > 0 && (
                <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Alertas del módulo</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {mergedAlerts.slice(0, 3).map((alert: ModuleAlert) => (
                      <li key={alert.id} className="flex items-center justify-between">
                        <span>{alert.label}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityTone[alert.priority]}`}>
                          {alert.priority}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {module.footerActions.map((action: string) => (
                  <button
                    key={action}
                    className="rounded-full border border-blue-100 px-3 py-1 text-sm text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:border-blue-400 dark:hover:bg-blue-500/10"
                    type="button"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardHome;
