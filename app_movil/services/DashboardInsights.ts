import { TicketApi, type BackendTicket } from './TicketApi';
import { OrdenTrabajoApi, type OrdenTrabajoDto } from './OrdenTrabajoApi';
import { CleaningApi, type CleaningRecord } from './CleaningApi';
import { CivilWorksApi, type CivilWorkSummary } from './CivilWorksApi';
import { VehiculoApi, type VehiculoDto } from './VehiculoApi';
import { IncidentApi, type Incident } from './IncidentApi';
import { UserApi } from './UserApi';
import {
  addDays,
  buildCivilTop,
  buildMaintenanceSeries,
  buildTicketsSeries,
  buildTimelineSeries,
  buildTransportSeries,
  computeCleaningCompliance,
  computeCleaningModule,
  computeCivilWorksModule,
  computeGeneralFromSummaries,
  computeMaintenanceModule,
  computeTicketsModule,
  computeTransportModule,
  isDelayIncident,
  isTransportAreaTicket,
  lastNDays,
  startOfWeekMonday,
  type ModuleKey,
  type RealModuleData,
} from '@/utils/dashboard';
import { SafeStorage } from './SafeStorage';

export type TimelinePoint = { label: string; workload: number; alerts: number };
export type TransportSeriesPoint = { day: string; viajes: number; retrasos: number };
export type MaintenanceSeriesPoint = { label: string; programado: number; completado: number };
export type TicketsSeriesPoint = { label: string; abiertos: number; resueltos: number };
export type CivilTopEntry = { proyecto: string; progreso: number };

export interface DashboardInsightData {
  modules: Partial<Record<ModuleKey, RealModuleData>>;
  timeline: TimelinePoint[];
  transportSeries: TransportSeriesPoint[];
  maintenanceSeries: MaintenanceSeriesPoint[];
  ticketsSeries: TicketsSeriesPoint[];
  civilTop: CivilTopEntry[];
  cleaningCompliance: number;
  alertSources: {
    tickets: BackendTicket[];
    ots: OrdenTrabajoDto[];
    incidents: Incident[];
    civil: CivilWorkSummary[];
    aseos: CleaningRecord[];
  };
}

const isFulfilled = <T,>(p: PromiseSettledResult<T>): p is PromiseFulfilledResult<T> => p.status === 'fulfilled';

const CACHE_KEY = 'dashboard_insights_cache_v1';

export async function loadCachedDashboardInsights(): Promise<DashboardInsightData | null> {
  try {
    const raw = await SafeStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.data) {
      return parsed.data as DashboardInsightData;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export async function getDashboardInsightsCacheInfo(): Promise<{ ts: number | null }> {
  try {
    const raw = await SafeStorage.getItem(CACHE_KEY);
    if (!raw) return { ts: null };
    const parsed = JSON.parse(raw);
    const ts = typeof parsed?.ts === 'number' ? parsed.ts : null;
    return { ts };
  } catch {
    return { ts: null };
  }
}

export async function saveDashboardInsightsCache(data: DashboardInsightData): Promise<void> {
  try {
    const payload = JSON.stringify({ v: 1, ts: Date.now(), data });
    await SafeStorage.setItem(CACHE_KEY, payload);
  } catch {
    // ignore
  }
}

export async function fetchDashboardInsights(): Promise<DashboardInsightData> {
  const [ticketsRes, otsRes, cleaningRes, civilRes, vehiclesRes, incidentsRes, usersRes] = await Promise.allSettled([
    TicketApi.getTickets(),
    OrdenTrabajoApi.list(),
    CleaningApi.list(1, 100),
    CivilWorksApi.list(1, 100),
    VehiculoApi.getVehiculos(),
    IncidentApi.list(1, 100),
    UserApi.list(),
  ]);

  const tickets: BackendTicket[] = isFulfilled(ticketsRes) ? ticketsRes.value ?? [] : [];
  const ots: OrdenTrabajoDto[] = isFulfilled(otsRes) ? otsRes.value ?? [] : [];
  const cleaningItems: CleaningRecord[] = (() => {
    if (!isFulfilled(cleaningRes)) return [];
    const payload = cleaningRes.value;
    if (!payload) return [];
    if (Array.isArray((payload as any).items)) return (payload as any).items as CleaningRecord[];
    return [];
  })();
  const civilItems: CivilWorkSummary[] = (() => {
    if (!isFulfilled(civilRes)) return [];
    const payload = civilRes.value;
    if (!payload) return [];
    if (Array.isArray((payload as any).items)) return (payload as any).items as CivilWorkSummary[];
    return [];
  })();
  const vehicles: VehiculoDto[] = isFulfilled(vehiclesRes) ? vehiclesRes.value ?? [] : [];
  const incidents: Incident[] = (() => {
    if (!isFulfilled(incidentsRes)) return [];
    const payload = incidentsRes.value;
    if (!payload) return [];
    if (Array.isArray((payload as any).items)) return (payload as any).items as Incident[];
    return [];
  })();
  const usersCount = (() => {
    if (!isFulfilled(usersRes)) return 0;
    const arr = usersRes.value;
    return Array.isArray(arr) ? arr.length : 0;
  })();

  const driversCount = (() => {
    const set = new Set<number>();
    for (const v of vehicles) {
      if (typeof v.conductorId === 'number') set.add(v.conductorId);
    }
    return set.size;
  })();

  const transportModule = computeTransportModule(vehicles, driversCount);
  const maintenanceModule = computeMaintenanceModule(ots);
  const cleaningModule = computeCleaningModule(cleaningItems);
  const civilModule = computeCivilWorksModule(civilItems);
  const ticketsModule = computeTicketsModule(tickets);
  const generalModule = computeGeneralFromSummaries(
    [transportModule, maintenanceModule, cleaningModule, civilModule, ticketsModule],
    usersCount,
  );

  const modules: Partial<Record<ModuleKey, RealModuleData>> = {
    general: generalModule,
    transport: transportModule,
    maintenance: maintenanceModule,
    cleaning: cleaningModule,
    civilWorks: civilModule,
    tickets: ticketsModule,
  };

  const today = new Date();
  const days7 = lastNDays(7, today);
  const transportSeries = buildTransportSeries(
    days7,
    tickets.filter(isTransportAreaTicket),
    incidents.filter(isDelayIncident),
  );

  const thisWeekStart = startOfWeekMonday(today);
  const maintenanceWeekStarts = [3, 2, 1, 0].map(offset => addDays(thisWeekStart, -7 * offset));
  const maintenanceRanges = maintenanceWeekStarts.map((ws, idx, arr) => ({
    label: `W-${(arr.length - 1) - idx}`,
    start: ws,
    end: addDays(ws, 7),
  }));
  const completedOts = ots.filter(o => o.estado === 'completado' || o.estado === 'Cerrada');
  const maintenanceSeries = buildMaintenanceSeries(maintenanceRanges, ots, completedOts);

  const ticketWeekStarts = [5, 4, 3, 2, 1, 0].map(offset => addDays(thisWeekStart, -7 * offset));
  const ticketRanges = ticketWeekStarts.map((ws, idx, arr) => ({
    label: `W-${(arr.length - 1) - idx}`,
    start: ws,
    end: addDays(ws, 7),
  }));
  const resolvedTickets = tickets.filter(t => t.status === 'Resuelto' || t.status === 'Cerrado');
  const ticketsSeries = buildTicketsSeries(ticketRanges, tickets, resolvedTickets);

  const timeline = buildTimelineSeries(days7, {
    tickets,
    ots,
    aseos: cleaningItems,
    incidents,
  });

  const cleaningCompliance = computeCleaningCompliance(cleaningItems, addDays(today, -30));
  const civilTop = buildCivilTop(civilItems, 4);

  const result: DashboardInsightData = {
    modules,
    timeline,
    transportSeries,
    maintenanceSeries,
    ticketsSeries,
    civilTop,
    cleaningCompliance,
    alertSources: {
      tickets,
      ots,
      incidents,
      civil: civilItems,
      aseos: cleaningItems,
    },
  };
  // persist cache (non-blocking)
  void saveDashboardInsightsCache(result);
  return result;
}
