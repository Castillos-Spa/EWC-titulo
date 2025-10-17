import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  Leaf,
  LucideIcon,
  ShieldCheck,
  Sparkles,
  Ticket,
  Truck,
  Wrench
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

type ModuleKey = 'general' | 'transport' | 'maintenance' | 'cleaning' | 'civilWorks' | 'tickets';

type TrendTone = 'up' | 'down' | 'neutral';

interface ModuleHighlight {
  label: string;
  value: string;
  trend: string;
  trendTone: TrendTone;
}

interface ModuleAlert {
  id: string;
  label: string;
  priority: 'Alta' | 'Media' | 'Baja';
  owner: string;
  eta: string;
}

interface ModuleSummary {
  activeItems: number;
  alerts: number;
  completion: number;
  backlog: number;
}

interface ModuleDefinition {
  key: ModuleKey;
  areaKey: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  highlights: ModuleHighlight[];
  summary: ModuleSummary;
  alerts: ModuleAlert[];
  ChartComponent: React.FC<{ chartTheme: ChartTheme }>;
  footerActions: string[];
}

const trendPillStyles: Record<TrendTone, string> = {
  up: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  down: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  neutral: 'bg-gray-200 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300'
};

const priorityTone: Record<ModuleAlert['priority'], string> = {
  Alta: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-200',
  Media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200',
  Baja: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-200'
};

const priorityWeights: Record<ModuleAlert['priority'], number> = {
  Alta: 3,
  Media: 2,
  Baja: 1
};

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

interface ChartTheme {
  axisColor: string;
  gridColor: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  areaStroke: string;
  areaStart: string;
  areaEnd: string;
  linePrimary: string;
  lineSecondary: string;
  lineAlert: string;
  linePositive: string;
  barPrimary: string;
  barSecondary: string;
  barTertiary: string;
  radialPrimary: string;
  radialTrack: string;
  civilPalette: string[];
}

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

const GeneralHealthChart: React.FC<{ chartTheme: ChartTheme }> = ({ chartTheme }) => {
  const data = [
    { month: 'May', engagement: 58, satisfaction: 78 },
    { month: 'Jun', engagement: 64, satisfaction: 81 },
    { month: 'Jul', engagement: 69, satisfaction: 83 },
    { month: 'Ago', engagement: 72, satisfaction: 85 },
    { month: 'Sep', engagement: 76, satisfaction: 87 },
    { month: 'Oct', engagement: 81, satisfaction: 90 }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
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
          cursor={{ strokeDasharray: '4 4' }}
          contentStyle={{
            backgroundColor: chartTheme.tooltipBg,
            borderColor: chartTheme.tooltipBorder,
            borderRadius: 12,
            color: chartTheme.tooltipText
          }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
        <Line type="monotone" dataKey="engagement" stroke={chartTheme.linePrimary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="satisfaction" stroke={chartTheme.lineSecondary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const TransportPerformanceChart: React.FC<{ chartTheme: ChartTheme }> = ({ chartTheme }) => {
  const data = [
    { day: 'Lun', viajes: 22, retrasos: 3 },
    { day: 'Mar', viajes: 28, retrasos: 2 },
    { day: 'Mie', viajes: 35, retrasos: 1 },
    { day: 'Jue', viajes: 32, retrasos: 2 },
    { day: 'Vie', viajes: 30, retrasos: 1 },
    { day: 'Sab', viajes: 18, retrasos: 1 },
    { day: 'Dom', viajes: 14, retrasos: 0 }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="transportTrips" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartTheme.areaStart} stopOpacity={0.85} />
            <stop offset="95%" stopColor={chartTheme.areaEnd} stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
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
        <Area type="monotone" dataKey="viajes" stroke={chartTheme.areaStroke} fill="url(#transportTrips)" strokeWidth={2} />
        <Line type="monotone" dataKey="retrasos" stroke={chartTheme.lineAlert} strokeWidth={2} dot />
      </AreaChart>
    </ResponsiveContainer>
  );
};

const MaintenanceHealthChart: React.FC<{ chartTheme: ChartTheme }> = ({ chartTheme }) => {
  const data = [
    { mes: 'Jul', programado: 18, completado: 14 },
    { mes: 'Ago', programado: 22, completado: 19 },
    { mes: 'Sep', programado: 24, completado: 21 },
    { mes: 'Oct', programado: 26, completado: 24 }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="mes"
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
        <Bar dataKey="programado" fill={chartTheme.barPrimary} radius={[6, 6, 0, 0]} />
        <Bar dataKey="completado" fill={chartTheme.barSecondary} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const CleaningComplianceChart: React.FC<{ chartTheme: ChartTheme }> = ({ chartTheme }) => {
  const data = [
    { name: 'Cumplimiento', value: 92, fill: chartTheme.radialPrimary },
    { name: 'Meta', value: 100, fill: chartTheme.radialTrack }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="95%" barSize={16} data={data} startAngle={90} endAngle={-270}>
        <RadialBar background dataKey="value" cornerRadius={6} />
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
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

const CivilWorksProgressChart: React.FC<{ chartTheme: ChartTheme }> = ({ chartTheme }) => {
  const data = [
    { proyecto: 'Canalización', progreso: 78 },
    { proyecto: 'Estanques', progreso: 64 },
    { proyecto: 'Pavimentación', progreso: 56 },
    { proyecto: 'Saneamiento', progreso: 88 }
  ];

  const colors = chartTheme.civilPalette;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 100]}
          stroke={chartTheme.axisColor}
          tick={{ fill: chartTheme.axisColor }}
          tickLine={false}
        />
        <YAxis
          dataKey="proyecto"
          type="category"
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
        <Bar dataKey="progreso" radius={[0, 12, 12, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.proyecto} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const TicketFlowChart: React.FC<{ chartTheme: ChartTheme }> = ({ chartTheme }) => {
  const data = [
    { semana: 'W30', abiertos: 28, resueltos: 20 },
    { semana: 'W31', abiertos: 24, resueltos: 22 },
    { semana: 'W32', abiertos: 32, resueltos: 29 },
    { semana: 'W33', abiertos: 30, resueltos: 31 },
    { semana: 'W34', abiertos: 26, resueltos: 30 },
    { semana: 'W35', abiertos: 22, resueltos: 28 }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis
          dataKey="semana"
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
        <Line type="monotone" dataKey="abiertos" stroke={chartTheme.lineAlert} strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="resueltos" stroke={chartTheme.linePositive} strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};

const moduleBlueprints: Record<ModuleKey, ModuleDefinition> = {
  general: {
    key: 'general',
    areaKey: '*',
    label: 'Visión General',
    description: 'Actividad consolidada de la plataforma y adopción de usuarios.',
    icon: Activity,
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-blue-600',
    highlights: [
      { label: 'Colaboradores activos', value: '147', trend: '+8% vs. mes anterior', trendTone: 'up' },
      { label: 'Tiempo promedio de respuesta', value: '1.9 h', trend: '-12% última semana', trendTone: 'up' },
      { label: 'Documentos compartidos', value: '312', trend: '+34 nuevos', trendTone: 'neutral' }
    ],
    summary: { activeItems: 96, alerts: 3, completion: 0.87, backlog: 9 },
    alerts: [],
    ChartComponent: GeneralHealthChart,
    footerActions: ['Ver agenda de hoy', 'Revisar cumplimiento general']
  },
  transport: {
    key: 'transport',
    areaKey: 'Transporte',
    label: 'Operaciones de Transporte',
    description: 'Seguimiento de viajes, conductores y disponibilidad de flota.',
    icon: Truck,
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
    highlights: [
      { label: 'Viajes completados', value: '168', trend: '+18% semanal', trendTone: 'up' },
      { label: 'Disponibilidad de flota', value: '92%', trend: '-1.2% contra meta', trendTone: 'down' },
      { label: 'Conductores activos', value: '26', trend: '+3 nuevos turnos', trendTone: 'up' }
    ],
    summary: { activeItems: 58, alerts: 3, completion: 0.91, backlog: 5 },
    alerts: [
      { id: 'transport-1', label: 'Revisión preventiva flota pesada', priority: 'Alta', owner: 'Transporte', eta: '2 horas' },
      { id: 'transport-2', label: 'Actualizar planes de ruta nocturna', priority: 'Media', owner: 'Logística', eta: 'Hoy' },
      { id: 'transport-3', label: 'Licencia conductor por expirar', priority: 'Alta', owner: 'RRHH', eta: '5 días' }
    ],
    ChartComponent: TransportPerformanceChart,
    footerActions: ['Ver itinerario de viajes', 'Asignar conductores', 'Solicitar apoyo taller']
  },
  maintenance: {
    key: 'maintenance',
    areaKey: 'Taller',
    label: 'Mantenimiento y Taller',
    description: 'Estado de las OT, tiempos de ciclo y cumplimiento programado.',
    icon: Wrench,
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600',
    highlights: [
      { label: 'OT completadas', value: '24', trend: '+4 respecto ayer', trendTone: 'up' },
      { label: 'Tiempo medio en taller', value: '6.2 h', trend: '+0.5 h', trendTone: 'down' },
      { label: 'Stock crítico', value: '8 items', trend: 'Revisar inventario', trendTone: 'neutral' }
    ],
    summary: { activeItems: 32, alerts: 4, completion: 0.76, backlog: 7 },
    alerts: [
      { id: 'maintenance-1', label: 'OT-2345 fuera de SLA', priority: 'Alta', owner: 'Taller', eta: '1 hora' },
      { id: 'maintenance-2', label: 'Falta repuesto filtro hidráulico', priority: 'Media', owner: 'Bodega', eta: 'Mañana' }
    ],
    ChartComponent: MaintenanceHealthChart,
    footerActions: ['Abrir tablero de OT', 'Coordinar con compras', 'Actualizar plan preventivo']
  },
  cleaning: {
    key: 'cleaning',
    areaKey: 'Aseo',
    label: 'Servicios de Aseo',
    description: 'Cobertura de rutas de limpieza y levantamiento de hallazgos.',
    icon: Sparkles,
    gradientFrom: 'from-emerald-500',
    gradientTo: 'to-lime-500',
    highlights: [
      { label: 'Sectores cubiertos', value: '34', trend: '+6 nuevos', trendTone: 'up' },
      { label: 'Hallazgos abiertos', value: '5', trend: '-2 esta semana', trendTone: 'up' },
      { label: 'NPS interno', value: '4.6 / 5', trend: '+0.3', trendTone: 'up' }
    ],
    summary: { activeItems: 28, alerts: 2, completion: 0.93, backlog: 3 },
    alerts: [
      { id: 'cleaning-1', label: 'Inspección sanitaria programada', priority: 'Media', owner: 'Aseo', eta: 'Jueves' }
    ],
    ChartComponent: CleaningComplianceChart,
    footerActions: ['Registrar reporte diario', 'Planificar dotación', 'Ver checklist en progreso']
  },
  civilWorks: {
    key: 'civilWorks',
    areaKey: 'Obras',
    label: 'Obras Civiles',
    description: 'Progreso de proyectos, hitos pendientes y riesgos.',
    icon: Building2,
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-teal-500',
    highlights: [
      { label: 'Proyectos activos', value: '6', trend: '+1 nuevo contrato', trendTone: 'up' },
      { label: 'Avance promedio', value: '78%', trend: '+6% mensual', trendTone: 'up' },
      { label: 'Riesgos críticos', value: '2', trend: 'Monitoreo diario', trendTone: 'neutral' }
    ],
    summary: { activeItems: 40, alerts: 3, completion: 0.78, backlog: 4 },
    alerts: [
      { id: 'civil-1', label: 'Retraso subcontrato pavimentación', priority: 'Alta', owner: 'Obras', eta: '3 días' },
      { id: 'civil-2', label: 'Permiso municipal pendiente', priority: 'Media', owner: 'Legal', eta: '1 semana' }
    ],
    ChartComponent: CivilWorksProgressChart,
    footerActions: ['Ver cronograma detallado', 'Coordinar inspección', 'Actualizar matriz de riesgos']
  },
  tickets: {
    key: 'tickets',
    areaKey: 'IT',
    label: 'Mesa de Ayuda y Tickets',
    description: 'Flujo de requerimientos y cumplimiento de SLA.',
    icon: Ticket,
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-600',
    highlights: [
      { label: 'Tickets abiertos', value: '26', trend: '-4 hoy', trendTone: 'up' },
      { label: 'SLA cumplido', value: '88%', trend: '-3% semana', trendTone: 'down' },
      { label: 'Satisfacción usuarios', value: '4.4 / 5', trend: '+0.2', trendTone: 'up' }
    ],
    summary: { activeItems: 36, alerts: 5, completion: 0.84, backlog: 6 },
    alerts: [
      { id: 'tickets-1', label: 'Incidente red oficina norte', priority: 'Alta', owner: 'IT', eta: '45 min' },
      { id: 'tickets-2', label: 'Automatizar backup ERP', priority: 'Media', owner: 'Infraestructura', eta: '48 horas' },
      { id: 'tickets-3', label: 'Seguimiento capacitación digital', priority: 'Baja', owner: 'RRHH', eta: 'Próxima semana' }
    ],
    ChartComponent: TicketFlowChart,
    footerActions: ['Abrir bandeja de tickets', 'Ajustar SLA', 'Revisar feedback usuarios']
  }
};

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

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const isDarkMode = useIsDarkMode();
  const chartTheme = useMemo(() => buildChartTheme(isDarkMode), [isDarkMode]);

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

  const modulesToRender = useMemo(() => {
    return Object.values(moduleBlueprints).filter(module => {
      if (module.areaKey === '*') return true;
      return areaAccess.has(normalizeArea(module.areaKey));
    });
  }, [areaAccess]);

  const specializedModules = useMemo(
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

  const avgCompletion = useMemo(() => {
    if (!specializedModules.length) {
      return moduleBlueprints.general.summary.completion;
    }
    return aggregatedSummary.completion / specializedModules.length;
  }, [aggregatedSummary, specializedModules.length]);

  const timelineData = useMemo(() => {
    const scale = 0.7 + specializedModules.length * 0.25;
    return timelineTemplate.map(item => ({
      label: item.label,
      workload: Math.round(item.workload * scale),
      alerts: Math.max(1, Math.round(item.alerts * Math.max(scale * 0.6, 0.4)))
    }));
  }, [specializedModules.length]);

  const prioritizedAlerts = useMemo(() => {
    const alertPool = specializedModules.flatMap(module =>
      module.alerts.map(alert => ({
        ...alert,
        module: module.label
      }))
    );
    alertPool.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
    return alertPool.slice(0, 5);
  }, [specializedModules]);

  const quickMetrics: QuickMetric[] = useMemo(() => {
    const moduleCount = specializedModules.length;
    const alerts = specializedModules.length ? aggregatedSummary.alerts : moduleBlueprints.general.summary.alerts;
    const backlog = specializedModules.length ? aggregatedSummary.backlog : moduleBlueprints.general.summary.backlog;
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
  }, [aggregatedSummary, avgCompletion, specializedModules.length]);

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
              <p className="text-2xl font-semibold">{moduleBlueprints.general.summary.activeItems + specializedModules.length * 6}</p>
            </div>
            <div>
              <p className="text-white/70">Alertas activas</p>
              <p className="text-2xl font-semibold">{prioritizedAlerts.length || aggregatedSummary.alerts}</p>
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
            <ShieldCheck className="h-5 w-5 text-blue-500" />
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
            <AlertTriangle className="h-5 w-5 text-amber-500" />
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
        {modulesToRender.map(module => {
          const Icon = module.icon;
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
                    {Math.round(module.summary.completion * 100)}% cumplimiento
                  </span>
                  <span className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4 text-blue-500" />
                    {module.summary.activeItems} tareas vivas
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,1fr]">
                <div className="space-y-4">
                  {module.highlights.map(item => (
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
                  <module.ChartComponent chartTheme={chartTheme} />
                </div>
              </div>

              {module.alerts.length > 0 && (
                <div className="mt-6 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Alertas del módulo</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    {module.alerts.slice(0, 3).map(alert => (
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
                {module.footerActions.map(action => (
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