import React, { useEffect, useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { FuelLog } from '../../../utils/fuelApi';

interface VehicleFuelSparklineProps {
	logs: FuelLog[];
}

const useIsDarkMode = () => {
	const getMode = () => {
		if (typeof document === 'undefined') return false;
		return document.documentElement.classList.contains('dark');
	};

		const [isDark, setIsDark] = useState(getMode);

		useEffect(() => {
		if (typeof MutationObserver === 'undefined') return undefined;
		const observer = new MutationObserver(() => setIsDark(getMode()));
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => observer.disconnect();
		}, []);

	return isDark;
};

const VehicleFuelSparkline: React.FC<VehicleFuelSparklineProps> = ({ logs }) => {
	const gradientId = useId();
	const isDarkMode = useIsDarkMode();

	const data = useMemo(() => {
		if (!logs.length) return [] as Array<{ label: string; liters: number }>;
		return logs
			.slice()
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.map((log) => ({
				label: new Date(log.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', ''),
				liters: Number.parseFloat(log.liters.toFixed(2)),
			}));
	}, [logs]);

	if (data.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
				Sin recargas
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
				<defs>
					<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor={isDarkMode ? '#38bdf8' : '#0284c7'} stopOpacity={0.35} />
						<stop offset="100%" stopColor={isDarkMode ? '#38bdf8' : '#0284c7'} stopOpacity={0.05} />
					</linearGradient>
				</defs>
				<XAxis dataKey="label" hide />
				<YAxis hide domain={[0, 'dataMax']} />
				<Tooltip
					cursor={{ strokeDasharray: '3 3' }}
					contentStyle={{
						backgroundColor: isDarkMode ? '#0f172a' : 'rgba(255,255,255,0.95)',
						border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
						borderRadius: 12,
						boxShadow: isDarkMode ? '0 10px 30px rgba(15, 23, 42, 0.45)' : '0 12px 30px rgba(15, 23, 42, 0.12)',
						color: isDarkMode ? '#e2e8f0' : '#0f172a',
					}}
					formatter={(value: number) => [`${value.toFixed(1)} L`, 'Carga']}
				/>
				<Area type="monotone" dataKey="liters" stroke={isDarkMode ? '#38bdf8' : '#0284c7'} strokeWidth={2} fill={`url(#${gradientId})`} activeDot={{ r: 4 }} />
			</AreaChart>
		</ResponsiveContainer>
	);
};

export default VehicleFuelSparkline;
