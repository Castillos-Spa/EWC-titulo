// Utilidades compartidas para series/fechas en Dashboard

export type DateInput = string | number | Date | undefined;

export const dayNames = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'] as const;

export const toDate = (s?: DateInput) => (s ? new Date(s) : null);

export const sameDay = (d: Date, ref: Date) =>
  d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();

export const lastNDays = (n: number, today = new Date()) =>
  Array.from({ length: n }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (n - 1 - i));
    return d;
  });

export const startOfWeekMonday = (d: Date) => {
  const x = new Date(d);
  const day = x.getDay();
  const delta = (day + 6) % 7; // Lunes inicio
  x.setDate(x.getDate() - delta);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const dateInRange = (d: Date, start: Date, end: Date) => d >= start && d < end;

export const countSameDay = <T,>(arr: T[], getDate: (it: T) => DateInput, ref: Date) =>
  arr.reduce((acc, it) => {
    const d = toDate(getDate(it));
    return acc + (d && sameDay(d, ref) ? 1 : 0);
  }, 0);

export const countInRange = <T,>(arr: T[], getDate: (it: T) => DateInput, start: Date, end: Date) =>
  arr.reduce((acc, it) => {
    const d = toDate(getDate(it));
    return acc + (d && dateInRange(d, start, end) ? 1 : 0);
  }, 0);

export type MappedPriority = 'Alta' | 'Media' | 'Baja';
export const mapNotificationPriority = (p?: string): MappedPriority => {
  const v = (p || '').toLowerCase();
  if (v === 'high' || v === 'urgent' || v === 'critical') return 'Alta';
  if (v === 'normal' || v === 'medium') return 'Media';
  return 'Baja';
};

// Tipos y cálculos de KPIs por módulo
import type { ModuleAlert, ModuleHighlight } from '../types';

export type RealSummary = { activeItems: number; alerts: number; completion: number; backlog: number };
export type RealModuleData = { highlights: ModuleHighlight[]; summary: RealSummary; alerts?: ModuleAlert[] };

export const computeTransportModule = (
  vehicles: Array<{ estado?: string }>,
  driversCount: number
): RealModuleData => {
  const totalVeh = vehicles.length;
  const vDisp = vehicles.filter(v => v.estado === 'disponible').length;
  const vUso = vehicles.filter(v => v.estado === 'en_uso').length;
  const vMant = vehicles.filter(v => v.estado === 'en_mantenimiento').length;
  const dispPct = totalVeh ? Math.round(((vDisp + vUso) / totalVeh) * 100) : 0;
  const dispTone: 'up' | 'down' | 'neutral' = dispPct >= 85 ? 'up' : dispPct < 70 ? 'down' : 'neutral';
  return {
    highlights: [
      { label: 'Vehículos', value: String(totalVeh), trend: `${vUso} en uso`, trendTone: 'neutral' },
      { label: 'Disponibilidad de flota', value: `${dispPct}%`, trend: `${vMant} en taller`, trendTone: dispTone },
      { label: 'Conductores activos', value: String(driversCount), trend: '', trendTone: 'neutral' },
    ],
    summary: { activeItems: vUso + vMant, alerts: vMant, completion: totalVeh ? (vDisp + vUso) / totalVeh : 0, backlog: vMant },
  };
};

export const computeMaintenanceModule = (
  ots: Array<{ estado?: string }>
): RealModuleData => {
  const totalOT = ots.length;
  const otComp = ots.filter(o => o.estado === 'completado').length;
  const otProg = ots.filter(o => o.estado === 'en_progreso').length;
  const otPendRev = ots.filter(o => o.estado === 'pendiente_revision').length;
  const otAbiertas = totalOT - otComp;
  return {
    highlights: [
      { label: 'OT completadas', value: String(otComp), trend: `${otAbiertas} abiertas`, trendTone: otAbiertas ? 'neutral' : 'up' },
      { label: 'En progreso', value: String(otProg), trend: '', trendTone: 'neutral' },
      { label: 'Pend. revisión', value: String(otPendRev), trend: '', trendTone: 'neutral' },
    ],
    summary: { activeItems: otAbiertas, alerts: otPendRev + otProg, completion: totalOT ? otComp / totalOT : 0, backlog: otAbiertas },
  };
};

export const computeCleaningModule = (
  aseos: Array<{ area?: string; issues?: unknown[]; status?: string }>
): RealModuleData => {
  const uniqueAreas = new Set(aseos.map(a => a.area || '').filter(Boolean)).size;
  const aseoIssues = aseos.filter(a => (a.issues?.length ?? 0) > 0 && a.status !== 'COMPLETED').length;
  const aseoCompleted = aseos.filter(a => a.status === 'COMPLETED').length;
  const totalAseo = aseos.length;
  return {
    highlights: [
      { label: 'Sectores cubiertos', value: String(uniqueAreas), trend: `${totalAseo} reportes`, trendTone: 'neutral' },
      { label: 'Hallazgos abiertos', value: String(aseoIssues), trend: '', trendTone: aseoIssues ? 'down' : 'up' },
      { label: 'Cumplimiento', value: `${totalAseo ? Math.round((aseoCompleted / totalAseo) * 100) : 0}%`, trend: '', trendTone: 'neutral' },
    ],
    summary: { activeItems: totalAseo - aseoCompleted, alerts: aseoIssues, completion: totalAseo ? aseoCompleted / totalAseo : 0, backlog: aseos.filter(a => a.status === 'PENDING').length },
  };
};

export const computeCivilWorksModule = (
  items: Array<{ status?: string; issues?: unknown[]; progress?: number }>
): RealModuleData => {
  const cwTotal = items.length;
  const cwActive = items.filter(i => i.status && i.status !== 'COMPLETED').length;
  const cwIssues = items.reduce((acc, i) => acc + ((i.issues as unknown[] | undefined)?.length ?? 0), 0);
  const cwAvgProgress = cwTotal ? (items.reduce((acc, i) => acc + (i.progress || 0), 0) / cwTotal) : 0;
  return {
    highlights: [
      { label: 'Proyectos activos', value: String(cwActive), trend: `Total ${cwTotal}`, trendTone: 'neutral' },
      { label: 'Avance promedio', value: `${Math.round(cwAvgProgress)}%`, trend: '', trendTone: 'neutral' },
      { label: 'Riesgos críticos', value: String(cwIssues), trend: '', trendTone: cwIssues ? 'down' : 'up' },
    ],
    summary: { activeItems: cwActive, alerts: cwIssues, completion: cwAvgProgress / 100, backlog: items.filter(i => i.status === 'PENDING').length },
  };
};

export const computeTicketsModule = (
  tickets: Array<{ status?: string; priority?: string }>
): RealModuleData => {
  const totalTk = tickets.length;
  const openTk = tickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado').length;
  const resolvedTk = totalTk - openTk;
  const highPrioOpen = tickets.filter(t => (t.priority === 'Alta' || t.priority === 'Urgente') && (t.status !== 'Resuelto' && t.status !== 'Cerrado')).length;
  return {
    highlights: [
      { label: 'Tickets abiertos', value: String(openTk), trend: `${resolvedTk} resueltos`, trendTone: openTk ? 'neutral' : 'up' },
      { label: 'Resueltos/Cerrados', value: `${totalTk ? Math.round((resolvedTk / totalTk) * 100) : 0}%`, trend: '', trendTone: 'neutral' },
      { label: 'Prioridad alta', value: String(highPrioOpen), trend: '', trendTone: highPrioOpen ? 'down' : 'up' },
    ],
    summary: { activeItems: openTk, alerts: highPrioOpen, completion: totalTk ? resolvedTk / totalTk : 0, backlog: openTk },
  };
};

export const computeGeneralFromSummaries = (
  modules: RealModuleData[],
  usersCount: number
): RealModuleData => {
  const sum = modules.reduce((acc, m) => {
    acc.active += m.summary.activeItems;
    acc.alerts += m.summary.alerts;
    acc.completion += m.summary.completion;
    acc.backlog += m.summary.backlog;
    acc.count += 1;
    return acc;
  }, { active: 0, alerts: 0, completion: 0, backlog: 0, count: 0 });
  const compAvg = sum.count ? sum.completion / sum.count : 0;
  return {
    highlights: [
      { label: 'Colaboradores conectados', value: String(usersCount), trend: '', trendTone: 'neutral' },
      { label: 'Cumplimiento promedio', value: `${Math.round(compAvg * 100)}%`, trend: '', trendTone: 'neutral' },
      { label: 'Alertas activas', value: String(sum.alerts), trend: '', trendTone: sum.alerts ? 'down' : 'up' }
    ],
    summary: { activeItems: sum.active, alerts: sum.alerts, completion: compAvg, backlog: sum.backlog },
    alerts: []
  };
};

export const buildPrioritizedAlerts = (
  args: {
    tickets: Array<{ id?: string | number; title?: string; priority?: string; status?: string; recipientArea?: (string | undefined)[]; createdAt?: unknown; updatedAt?: unknown }>;
    ots: Array<{ id?: string | number; estado?: string; createdAt?: unknown; updatedAt?: unknown }>;
    incidents: Array<{ id?: string | number; title?: string; severity?: string; area?: string; reportedAt?: unknown }>;
    civil: Array<{ id?: string | number; project?: string; location?: string; issues?: unknown[] }>;
    aseos: Array<{ id?: string | number; area?: string; issues?: unknown[]; status?: string; date?: unknown }>;
    notifications: Array<{ id?: string | number; title: string; priority?: string; status?: string; read?: boolean }>;
  }
): { all: ModuleAlert[]; critical: ModuleAlert[] } => {
  const prioWeight = { Urgente: 5, Crítica: 4, Alta: 3, Media: 2, Baja: 1 } as const;
  const alertsTk: ModuleAlert[] = args.tickets
    .filter(t => t.status !== 'Resuelto' && t.status !== 'Cerrado' && (t.priority === 'Alta' || t.priority === 'Urgente'))
    .slice(0, 50)
    .map(t => ({ id: `tk-${t.id}`, label: t.title || `Ticket #${t.id}`, priority: (t.priority === 'Urgente' ? 'Urgente' : 'Alta'), owner: (t.recipientArea?.[0] ?? 'IT'), eta: '—' }));
  const alertsOt: ModuleAlert[] = args.ots
    .filter(o => o.estado === 'pendiente_revision' || o.estado === 'en_progreso')
    .slice(0, 50)
    .map(o => ({ id: `ot-${o.id}`, label: `OT #${o.id} ${o.estado}`, priority: o.estado === 'pendiente_revision' ? 'Alta' : 'Media', owner: 'Taller', eta: '—' }));
  const alertsInc: ModuleAlert[] = args.incidents
    .filter(i => { const sev = (i.severity || '').toString().toLowerCase(); return sev.includes('critical') || sev.includes('high'); })
    .slice(0, 50)
    .map(i => { const sev = (i.severity || '').toString().toLowerCase(); return ({ id: `inc-${i.id}`, label: i.title || `Incidente #${i.id}`, priority: sev.includes('critical') ? 'Crítica' : 'Alta', owner: String(i.area || 'Operaciones'), eta: '—' }); });
  const alertsCw: ModuleAlert[] = args.civil
    .filter(i => ((i.issues as unknown[] | undefined)?.length ?? 0) > 0)
    .slice(0, 50)
    .map((i, idx) => ({ id: `cw-${i.id ?? idx}`, label: `Obra ${String(i.project ?? i.location ?? i.id)}`, priority: ((i.issues as unknown[] | undefined)?.length ?? 0) > 3 ? 'Alta' : 'Media', owner: 'Obras', eta: '—' }));
  const alertsAseo: ModuleAlert[] = args.aseos
    .filter(a => ((a.issues as unknown[] | undefined)?.length ?? 0) > 0 && a.status !== 'COMPLETED')
    .slice(0, 50)
    .map((a, idx) => ({ id: `aseo-${a.id ?? idx}`, label: `Hallazgos en ${a.area}`, priority: 'Media', owner: 'Aseo', eta: '—' }));
  const alertsNotif: ModuleAlert[] = args.notifications
    .filter(n => n.status === 'sent' && n.read !== true)
    .slice(0, 100)
    .map(n => ({ id: `ntf-${n.id}`, label: n.title, priority: mapNotificationPriority(n.priority), owner: 'Notificaciones', eta: '—' }));
  const all = [...alertsTk, ...alertsOt, ...alertsInc, ...alertsCw, ...alertsAseo, ...alertsNotif]
    .sort((a,b) => prioWeight[b.priority] - prioWeight[a.priority]);
  const critical = all.filter(a => a.priority === 'Urgente' || a.priority === 'Crítica' || a.priority === 'Alta');
  return { all, critical };
};

// Builders de series y derivados
export type WeekRange = { label: string; start: Date; end: Date };

export const buildTransportSeries = (
  days: Date[],
  ticketsTransporte: Array<{ createdAt?: unknown }>,
  incidentsDelay: Array<{ reportedAt?: unknown }>
) => days.map(ref => ({
  day: dayNames[ref.getDay()],
  viajes: countSameDay(ticketsTransporte, t => t.createdAt as DateInput, ref),
  retrasos: countSameDay(incidentsDelay, i => i.reportedAt as DateInput, ref)
}));

export const buildMaintenanceSeries = (
  ranges: WeekRange[],
  ots: Array<{ createdAt?: unknown }>,
  otsCompletadas: Array<{ updatedAt?: unknown }>
) => ranges.map(({ label, start, end }) => ({
  label,
  programado: countInRange(ots, o => o.createdAt as DateInput, start, end),
  completado: countInRange(otsCompletadas, o => o.updatedAt as DateInput, start, end)
}));

export const buildTicketsSeries = (
  ranges: WeekRange[],
  tickets: Array<{ createdAt?: unknown }>,
  ticketsResueltos: Array<{ updatedAt?: unknown }>
) => ranges.map(({ label, start, end }) => ({
  label,
  abiertos: countInRange(tickets, t => t.createdAt as DateInput, start, end),
  resueltos: countInRange(ticketsResueltos, t => t.updatedAt as DateInput, start, end)
}));

export const buildCivilTop = (
  items: Array<{ id?: string | number; project?: string; location?: string; progress?: number }>,
  n = 4
) => [...items].sort((a,b) => (b.progress ?? 0) - (a.progress ?? 0)).slice(0, n)
  .map(i => ({ proyecto: String(i.project ?? i.location ?? `#${i.id}`), progreso: Math.round(i.progress ?? 0) }));

export const computeCleaningCompliance = (
  aseos: Array<{ date?: unknown; status?: string }>,
  since: Date
) => {
  const recent = aseos.filter(a => { const d = toDate(a.date as DateInput); return d && d >= since; });
  const total = recent.length;
  const done = recent.filter(a => a.status === 'COMPLETED').length;
  return total ? Math.round((done/total)*100) : 0;
};

export const buildTimelineSeries = (
  days: Date[],
  deps: {
    tickets: Array<{ createdAt?: unknown; priority?: string }>;
    ots: Array<{ createdAt?: unknown; updatedAt?: unknown; estado?: string }>;
    aseos: Array<{ date?: unknown; issues?: unknown[] }>;
    incidents: Array<{ reportedAt?: unknown; severity?: string }>;
  }
) => days.map(ref => {
  const incSeveros = deps.incidents.filter(i => { const sev = (i.severity || '').toString().toLowerCase(); return sev.includes('critical') || sev.includes('high'); });
  const otsPendRev = deps.ots.filter(o => o.estado === 'pendiente_revision');
  const aseoConIssues = deps.aseos.filter(a => (Array.isArray(a.issues) ? a.issues.length : 0) > 0);
  const ticketsAlta = deps.tickets.filter(t => t.priority === 'Alta' || t.priority === 'Urgente');
  return {
    label: dayNames[ref.getDay()],
    workload: (
      countSameDay(deps.tickets, t => t.createdAt as DateInput, ref) +
      countSameDay(deps.ots, o => o.createdAt as DateInput, ref) +
      countSameDay(deps.aseos, a => a.date as DateInput, ref) +
      countSameDay(deps.incidents, i => i.reportedAt as DateInput, ref)
    ),
    alerts: (
      countSameDay(ticketsAlta, t => t.createdAt as DateInput, ref) +
      countSameDay(incSeveros, i => i.reportedAt as DateInput, ref) +
      countSameDay(otsPendRev, o => o.updatedAt as DateInput, ref) +
      countSameDay(aseoConIssues, a => a.date as DateInput, ref)
    )
  };
});

export const buildGeneralSeries = (
  ranges: WeekRange[],
  deps: {
    tickets: Array<{ createdAt?: unknown; updatedAt?: unknown }>;
    ots: Array<{ createdAt?: unknown; updatedAt?: unknown }>;
    aseos: Array<{ date?: unknown }>;
    incidents: Array<{ reportedAt?: unknown }>;
  }
) => {
  const ticketsResueltos = deps.tickets; // usamos updatedAt
  const otsCompletadas = deps.ots; // usamos updatedAt
  const rawWeekly = ranges.map(({ label, start, end }) => {
    const tNew = countInRange(deps.tickets, t => t.createdAt as DateInput, start, end);
    const otNew = countInRange(deps.ots, o => o.createdAt as DateInput, start, end);
    const aNew = countInRange(deps.aseos, a => a.date as DateInput, start, end);
    const iNew = countInRange(deps.incidents, i => i.reportedAt as DateInput, start, end);
    const resolved = countInRange(ticketsResueltos, t => t.updatedAt as DateInput, start, end) + countInRange(otsCompletadas, o => o.updatedAt as DateInput, start, end);
    const total = tNew + otNew + aNew + iNew;
    return { label, total, resolved };
  });
  const maxTotal = Math.max(1, ...rawWeekly.map(w => w.total));
  return rawWeekly.map(w => ({ month: w.label, engagement: Math.round((w.total / maxTotal) * 100), satisfaction: Math.round((w.total ? (w.resolved / w.total) : 1) * 100) }));
};
