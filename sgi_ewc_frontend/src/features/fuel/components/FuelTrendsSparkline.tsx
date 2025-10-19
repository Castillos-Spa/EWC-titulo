import React, { useEffect, useId, useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface FuelTrendPoint {
	date: string;
	liters: number;
}

interface FuelTrendsSparklineProps {
	data: FuelTrendPoint[];
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

const FuelTrendsSparkline: React.FC<FuelTrendsSparklineProps> = ({ data }) => {
	const gradientId = useId();
	const isDarkMode = useIsDarkMode();

	const chartData = useMemo(() => {
		return data
			.slice()
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.map((entry) => ({
				label: new Date(entry.date).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }).replace('.', ''),
				liters: Number.parseFloat(entry.liters.toFixed(2)),
			}));
	}, [data]);

	if (chartData.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-xs font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
				Sin datos de flota
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height="100%">
			<AreaChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
				<defs>
					<linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
						<stop offset="0%" stopColor={isDarkMode ? '#6366f1' : '#2563eb'} stopOpacity={0.4} />
						<stop offset="100%" stopColor={isDarkMode ? '#6366f1' : '#2563eb'} stopOpacity={0.08} />
					</linearGradient>
				</defs>
				<XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: isDarkMode ? '#bfdbfe' : '#1e293b', fontSize: 11 }} />
				<YAxis hide domain={[0, 'dataMax']} />
						<Tooltip
							cursor={{ strokeDasharray: '3 3' }}
							contentStyle={{
								backgroundColor: isDarkMode ? '#0f172a' : 'rgba(255,255,255,0.95)',
								border: `1px solid ${isDarkMode ? '#1e293b' : '#e2e8f0'}`,
								borderRadius: 12,
								boxShadow: isDarkMode ? '0 12px 35px rgba(15,23,42,0.45)' : '0 16px 32px rgba(15,23,42,0.12)',
								color: isDarkMode ? '#e2e8f0' : '#0f172a',
							}}
							formatter={(value: number) => [`${value.toFixed(1)} L`, 'Flota']}
						/>
				<Area type="monotone" dataKey="liters" stroke={isDarkMode ? '#818cf8' : '#1d4ed8'} strokeWidth={2.2} fill={`url(#${gradientId})`} activeDot={{ r: 4 }} />
			</AreaChart>
		</ResponsiveContainer>
	);
};

export default FuelTrendsSparkline;
