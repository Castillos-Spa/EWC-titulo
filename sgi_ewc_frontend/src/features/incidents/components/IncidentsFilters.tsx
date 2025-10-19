
import React, { useMemo } from 'react';
import { Search, Filter, FilterX, ShieldAlert, MapPin, ActivitySquare } from 'lucide-react';
import type { Incident, IncidentSeverity, IncidentStatus, IncidentType } from '../../../types/Incident';

interface IncidentsFiltersProps {
	items: Incident[];
	search: string;
	status: IncidentStatus | 'all';
	severity: IncidentSeverity | 'all';
	type: IncidentType | 'all';
	area: string;
	areas: string[];
	total: number;
	onSearch: (value: string) => void;
	onStatusChange: (value: IncidentStatus | 'all') => void;
	onSeverityChange: (value: IncidentSeverity | 'all') => void;
	onTypeChange: (value: IncidentType | 'all') => void;
	onAreaChange: (value: string) => void;
	onReset: () => void;
}

const STATUS_OPTIONS: Array<{ value: IncidentStatus | 'all'; label: string }> = [
	{ value: 'all', label: 'Todos los estados' },
	{ value: 'reported', label: 'Reportado' },
	{ value: 'acknowledged', label: 'Reconocido' },
	{ value: 'in_progress', label: 'En progreso' },
	{ value: 'resolved', label: 'Resuelto' },
];

const SEVERITY_ORDER: IncidentSeverity[] = ['critical', 'high', 'medium', 'low'];
const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
	critical: 'Crítico',
	high: 'Alto',
	medium: 'Medio',
	low: 'Bajo',
};

const TYPE_OPTIONS: Array<{ value: IncidentType | 'all'; label: string }> = [
	{ value: 'all', label: 'Todos los tipos' },
	{ value: 'vehicle_breakdown', label: 'Avería de vehículo' },
	{ value: 'accident', label: 'Accidente' },
	{ value: 'traffic_delay', label: 'Retraso de tráfico' },
	{ value: 'weather', label: 'Condiciones climáticas' },
	{ value: 'security', label: 'Seguridad' },
	{ value: 'other', label: 'Otro' },
];

const severityBadgeStyles: Record<IncidentSeverity, string> = {
	critical: 'border-rose-400/60 bg-rose-500/15 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/20 dark:text-rose-100',
	high: 'border-orange-400/60 bg-orange-500/15 text-orange-600 dark:border-orange-500/40 dark:bg-orange-500/20 dark:text-orange-100',
	medium: 'border-amber-400/60 bg-amber-500/15 text-amber-600 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-100',
	low: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-600 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100',
};

const IncidentsFilters: React.FC<IncidentsFiltersProps> = ({
	items,
	search,
	status,
	severity,
	type,
	area,
	areas,
	total,
	onSearch,
	onStatusChange,
	onSeverityChange,
	onTypeChange,
	onAreaChange,
	onReset,
}) => {
	const hasActiveFilters = useMemo(() => {
		return (
			search.trim() !== '' ||
			status !== 'all' ||
			severity !== 'all' ||
			type !== 'all' ||
			area !== 'all'
		);
	}, [search, status, severity, type, area]);

	const severityDistribution = useMemo(() => {
		return SEVERITY_ORDER.map(level => ({
			level,
			count: items.filter(incident => incident.severity === level).length,
		}));
	}, [items]);

	const statusDistribution = useMemo(() => {
		return STATUS_OPTIONS.filter(option => option.value !== 'all').map(option => ({
			status: option.value as IncidentStatus,
			label: option.label,
			count: items.filter(incident => incident.status === option.value).length,
		}));
	}, [items]);

	return (
		<section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:shadow-slate-900/40">
			<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.18),_rgba(15,23,42,0)_70%)] dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_rgba(15,23,42,0.45))]" />
			<div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
				<div className="space-y-5">
					<div className="space-y-3">
						<span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-blue-100">
							<ShieldAlert className="h-4 w-4" /> Panel de filtros
						</span>
						<p className="max-w-xl text-sm text-slate-500 dark:text-blue-200/80">
							Filtra por estado, criticidad o área para priorizar la mitigación. Los contadores muestran la distribución actual de alertas.
						</p>
					</div>

					<div className="grid gap-3 lg:grid-cols-2">
						<div className="relative">
							<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-blue-200/70" />
							<input
								value={search}
								onChange={event => onSearch(event.target.value)}
								placeholder="Busca por título, descripción o ubicación"
								className="w-full rounded-2xl border border-slate-200 bg-white/80 py-2 pl-11 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
							/>
						</div>
						<select
							value={area}
							onChange={event => onAreaChange(event.target.value)}
							className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
						>
							<option value="all">Todas las áreas</option>
							{areas.map(areaOption => (
								<option key={areaOption} value={areaOption}>
									{areaOption}
								</option>
							))}
						</select>
					</div>

					<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						<select
							value={status}
							onChange={event => onStatusChange(event.target.value as IncidentStatus | 'all')}
							className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
						>
							{STATUS_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
						<select
							value={severity}
							onChange={event => onSeverityChange(event.target.value as IncidentSeverity | 'all')}
							className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
						>
							<option value="all">Todas las severidades</option>
							{SEVERITY_ORDER.map(level => (
								<option key={level} value={level}>
									{SEVERITY_LABEL[level]}
								</option>
							))}
						</select>
						<select
							value={type}
							onChange={event => onTypeChange(event.target.value as IncidentType | 'all')}
							className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white"
						>
							{TYPE_OPTIONS.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80">
							<ActivitySquare className="h-4 w-4" /> {total} incidentes visibles
						</p>
						<div className="flex flex-wrap items-center gap-2">
							{hasActiveFilters && (
								<button
									type="button"
									onClick={onReset}
									className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-blue-100"
								>
									<FilterX className="h-4 w-4" /> Limpiar filtros
								</button>
							)}
							<span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-200/80">
								<Filter className="h-4 w-4" /> Vista refinada
							</span>
						</div>
					</div>
				</div>

				<div className="space-y-4 rounded-3xl border border-white/60 bg-white/75 px-5 py-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10">
					<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">Distribución</p>
					<div className="space-y-3 text-sm text-slate-600 dark:text-blue-200/80">
						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">Severidad</p>
							<div className="flex flex-wrap gap-2">
								{severityDistribution.map(({ level, count }) => (
									<span
										key={level}
										className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${severityBadgeStyles[level]} ${severity === level ? 'ring-2 ring-offset-2 ring-slate-200 dark:ring-white/20 dark:ring-offset-slate-900' : ''}`}
									>
										{SEVERITY_LABEL[level]}
										<span className="rounded-full bg-white/60 px-2 py-0.5 text-[0.65rem] font-bold text-slate-600 dark:bg-white/10 dark:text-blue-100">{count}</span>
									</span>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">Estado</p>
							<div className="grid gap-2 sm:grid-cols-2">
								{statusDistribution.map(({ status: statusValue, label, count }) => (
									<span
										key={statusValue}
										className={`inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100 ${status === statusValue ? 'border-sky-300 text-sky-600 dark:border-sky-500/40 dark:text-sky-100' : ''}`}
									>
										{label}
										<span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[0.65rem] font-bold dark:bg-white/10">{count}</span>
									</span>
								))}
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400 dark:text-blue-200/60">Áreas activas</p>
							<div className="flex flex-wrap gap-2">
								{areas.map(areaOption => (
									<span
										key={`area-${areaOption}`}
										className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-blue-100 ${area === areaOption ? 'border-sky-300 text-sky-600 dark:border-sky-500/40 dark:text-sky-100' : ''}`}
									>
										<MapPin className="h-3.5 w-3.5" />
										{areaOption}
									</span>
								))}
								{areas.length === 0 && (
									<span className="text-xs text-slate-400 dark:text-blue-200/60">Sin áreas registradas aún.</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default IncidentsFilters;
