import React from 'react';
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

export interface ChartTheme {
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

export const GeneralHealthChart: React.FC<{ chartTheme: ChartTheme; data?: unknown }> = ({ chartTheme, data }) => {
  const fallback = [
    { month: 'May', engagement: 58, satisfaction: 78 },
    { month: 'Jun', engagement: 64, satisfaction: 81 },
    { month: 'Jul', engagement: 69, satisfaction: 83 },
    { month: 'Ago', engagement: 72, satisfaction: 85 },
    { month: 'Sep', engagement: 76, satisfaction: 87 },
    { month: 'Oct', engagement: 81, satisfaction: 90 }
  ];
  const series = Array.isArray(data) ? (data as Array<{ month: string; engagement: number; satisfaction: number }>) : fallback;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="month" stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <YAxis stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <Tooltip
          cursor={{ strokeDasharray: '4 4' }}
          contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: 12, color: chartTheme.tooltipText }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
        <Line type="monotone" dataKey="engagement" stroke={chartTheme.linePrimary} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="satisfaction" stroke={chartTheme.lineSecondary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const TransportPerformanceChart: React.FC<{ chartTheme: ChartTheme; data?: unknown }> = ({ chartTheme, data }) => {
  const fallback = [
    { day: 'Lun', viajes: 22, retrasos: 3 },
    { day: 'Mar', viajes: 28, retrasos: 2 },
    { day: 'Mie', viajes: 35, retrasos: 1 },
    { day: 'Jue', viajes: 32, retrasos: 2 },
    { day: 'Vie', viajes: 30, retrasos: 1 },
    { day: 'Sab', viajes: 18, retrasos: 1 },
    { day: 'Dom', viajes: 14, retrasos: 0 }
  ];
  const series = Array.isArray(data) ? (data as Array<{ day: string; viajes: number; retrasos: number }>) : fallback;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series}>
        <defs>
          <linearGradient id="transportTrips" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={chartTheme.areaStart} stopOpacity={0.85} />
            <stop offset="95%" stopColor={chartTheme.areaEnd} stopOpacity={0.08} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="day" stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <YAxis stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: 12, color: chartTheme.tooltipText }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
        <Area type="monotone" dataKey="viajes" stroke={chartTheme.areaStroke} fill="url(#transportTrips)" strokeWidth={2} />
        <Line type="monotone" dataKey="retrasos" stroke={chartTheme.lineAlert} strokeWidth={2} dot />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const MaintenanceHealthChart: React.FC<{ chartTheme: ChartTheme; data?: unknown }> = ({ chartTheme, data }) => {
  const fallback = [
    { label: 'W1', programado: 18, completado: 14 },
    { label: 'W2', programado: 22, completado: 19 },
    { label: 'W3', programado: 24, completado: 21 },
    { label: 'W4', programado: 26, completado: 24 }
  ];
  const series = Array.isArray(data) ? (data as Array<{ label: string; programado: number; completado: number }>) : fallback;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={series}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <YAxis stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: 12, color: chartTheme.tooltipText }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
        <Bar dataKey="programado" fill={chartTheme.barPrimary} radius={[6, 6, 0, 0]} />
        <Bar dataKey="completado" fill={chartTheme.barSecondary} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const CleaningComplianceChart: React.FC<{ chartTheme: ChartTheme; data?: unknown }> = ({ chartTheme, data }) => {
  const compliance = (data && typeof (data as { compliance?: number }).compliance === 'number') ? Math.max(0, Math.min(100, Math.round(((data as { compliance: number }).compliance)))) : 92;
  const series = [
    { name: 'Cumplimiento', value: compliance, fill: chartTheme.radialPrimary },
    { name: 'Meta', value: 100, fill: chartTheme.radialTrack }
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="95%" barSize={16} data={series} startAngle={90} endAngle={-270}>
        <RadialBar background dataKey="value" cornerRadius={6} />
        <Tooltip
          contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: 12, color: chartTheme.tooltipText }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
      </RadialBarChart>
    </ResponsiveContainer>
  );
};

export const CivilWorksProgressChart: React.FC<{ chartTheme: ChartTheme; data?: unknown }> = ({ chartTheme, data }) => {
  const fallback = [
    { proyecto: 'Canalización', progreso: 78 },
    { proyecto: 'Estanques', progreso: 64 },
    { proyecto: 'Pavimentación', progreso: 56 },
    { proyecto: 'Saneamiento', progreso: 88 }
  ];
  const series = Array.isArray(data) ? (data as Array<{ proyecto: string; progreso: number }>) : fallback;

  const colors = chartTheme.civilPalette;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={series} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <YAxis dataKey="proyecto" type="category" stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: 12, color: chartTheme.tooltipText }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
        <Bar dataKey="progreso" radius={[0, 12, 12, 0]}>
          {series.map((entry, index) => (
            <Cell key={entry.proyecto} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export const TicketFlowChart: React.FC<{ chartTheme: ChartTheme; data?: unknown }> = ({ chartTheme, data }) => {
  const fallback = [
    { label: 'W1', abiertos: 28, resueltos: 20 },
    { label: 'W2', abiertos: 24, resueltos: 22 },
    { label: 'W3', abiertos: 32, resueltos: 29 },
    { label: 'W4', abiertos: 30, resueltos: 31 },
    { label: 'W5', abiertos: 26, resueltos: 30 },
    { label: 'W6', abiertos: 22, resueltos: 28 }
  ];
  const series = Array.isArray(data) ? (data as Array<{ label: string; abiertos: number; resueltos: number }>) : fallback;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={series}>
        <CartesianGrid stroke={chartTheme.gridColor} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <YAxis stroke={chartTheme.axisColor} tick={{ fill: chartTheme.axisColor }} tickLine={false} />
        <Tooltip
          contentStyle={{ backgroundColor: chartTheme.tooltipBg, borderColor: chartTheme.tooltipBorder, borderRadius: 12, color: chartTheme.tooltipText }}
          itemStyle={{ color: chartTheme.tooltipText }}
          labelStyle={{ color: chartTheme.tooltipText }}
        />
        <Line type="monotone" dataKey="abiertos" stroke={chartTheme.lineAlert} strokeWidth={2} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="resueltos" stroke={chartTheme.linePositive} strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  );
};
