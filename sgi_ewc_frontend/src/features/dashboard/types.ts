import type { LucideIcon } from 'lucide-react';
import type { ChartTheme } from './components/Charts';

export type ModuleKey = 'general' | 'transport' | 'maintenance' | 'cleaning' | 'civilWorks' | 'tickets';

export type TrendTone = 'up' | 'down' | 'neutral';

export interface ModuleHighlight {
  label: string;
  value: string;
  trend: string;
  trendTone: TrendTone;
}

export interface ModuleAlert {
  id: string;
  label: string;
  priority: 'Urgente' | 'Crítica' | 'Alta' | 'Media' | 'Baja';
  owner: string;
  eta: string;
}

export interface ModuleSummary {
  activeItems: number;
  alerts: number;
  completion: number;
  backlog: number;
}

export interface ModuleDefinition {
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
  ChartComponent: React.FC<{ chartTheme: ChartTheme; data?: unknown }>;
  footerActions: string[];
}
