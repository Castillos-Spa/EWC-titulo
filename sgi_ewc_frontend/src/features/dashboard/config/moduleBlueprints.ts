import { Activity, Building2, Sparkles, Ticket as TicketIcon, Truck, Wrench } from 'lucide-react';
import type { ModuleDefinition, ModuleKey } from '../types';
import { GeneralHealthChart, TransportPerformanceChart, MaintenanceHealthChart, CleaningComplianceChart, CivilWorksProgressChart, TicketFlowChart } from '../components/Charts';

export const moduleBlueprints: Record<ModuleKey, ModuleDefinition> = {
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
    icon: TicketIcon,
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
