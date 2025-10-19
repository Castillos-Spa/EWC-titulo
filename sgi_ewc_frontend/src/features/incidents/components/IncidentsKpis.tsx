import React, { useMemo } from 'react';
import { AlertTriangle, Activity, ShieldAlert, Camera } from 'lucide-react';
import { useIncidents } from '../hooks/useIncidents';

type StatDescriptor = {
	id: string;
	label: string;
	value: string;
	helper: string;
	accent: string;
	icon: React.ReactNode;
};

const IncidentsKpis: React.FC = () => {
	const { items, loading } = useIncidents();

	const stats = useMemo<StatDescriptor[]>(() => {
		if (!items.length) {
			return [
				{
					id: 'incidents-total',
					label: 'Incidentes registrados',
					value: loading ? '…' : '0',
					helper: 'Prepara el dashboard con nuevos reportes',
					accent: 'from-sky-500/15 via-indigo-500/10 to-sky-400/15',
					icon: <AlertTriangle className="h-6 w-6" />,
				},
				{
					id: 'incidents-open',
					label: 'Casos abiertos',
					value: loading ? '…' : '0',
					helper: 'Sin incidentes críticos por ahora',
					accent: 'from-amber-500/15 to-orange-500/15',
					icon: <Activity className="h-6 w-6" />,
				},
				{
					id: 'incidents-critical',
					label: 'Alertas críticas',
					value: loading ? '…' : '0',
					helper: 'Mantén la guardia arriba',
					accent: 'from-rose-500/18 to-pink-500/18',
					icon: <ShieldAlert className="h-6 w-6" />,
				},
				{
					id: 'incidents-media',
					label: 'Evidencias cargadas',
					value: loading ? '…' : '0',
					helper: 'Documenta cada hallazgo con fotos',
					accent: 'from-emerald-500/18 to-teal-500/18',
					icon: <Camera className="h-6 w-6" />,
				},
			];
		}

		const total = items.length;
		const open = items.filter(incident => incident.status !== 'resolved').length;
		const critical = items.filter(incident => incident.severity === 'critical').length;
		const photos = items.reduce((acc, incident) => acc + (incident.photos?.length ?? 0), 0);
		const resolved = items.filter(incident => incident.status === 'resolved').length;
		const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

		return [
			{
				id: 'incidents-total',
				label: 'Incidentes totales',
				value: String(total),
				helper: `${resolutionRate}% resueltos`,
				accent: 'from-sky-500/25 via-indigo-500/20 to-sky-400/25',
				icon: <AlertTriangle className="h-6 w-6" />,
			},
			{
				id: 'incidents-open',
				label: 'Casos en seguimiento',
				value: String(open),
				helper: `${critical} críticos en cola`,
				accent: 'from-amber-500/25 to-orange-500/20',
				icon: <Activity className="h-6 w-6" />,
			},
			{
				id: 'incidents-critical',
				label: 'Alertas críticas',
				value: String(critical),
				helper: critical > 0 ? 'Prioriza atención inmediata' : 'Sin escaladas activas',
				accent: 'from-rose-500/25 to-pink-500/25',
				icon: <ShieldAlert className="h-6 w-6" />,
			},
			{
				id: 'incidents-media',
				label: 'Evidencias registradas',
				value: String(photos),
				helper: photos > 0 ? 'Centraliza fotos y videos' : 'Aún sin adjuntos',
				accent: 'from-emerald-500/25 to-teal-500/25',
				icon: <Camera className="h-6 w-6" />,
			},
		];
	}, [items, loading]);

	return (
		<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
			{stats.map(stat => (
				<article
					key={stat.id}
					className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/80 p-6 text-slate-800 shadow-lg shadow-slate-200/50 backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:shadow-slate-900/40"
				>
					<div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${stat.accent}`} />
					<div className="relative flex flex-col gap-3">
						<div className="flex items-center justify-between">
							<span className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-blue-200/70">{stat.label}</span>
							<span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/70 text-slate-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-blue-100">
								{stat.icon}
							</span>
						</div>
						<div className="text-3xl font-semibold tracking-tight">{stat.value}</div>
						<p className="text-sm text-slate-500 dark:text-blue-200/80">{stat.helper}</p>
					</div>
				</article>
			))}
		</section>
	);
};

export default IncidentsKpis;
