import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
	Home,
	Wrench,
	Users,
	ChevronLeft,
	ChevronRight,
	LogOut,
	Ticket,
	HardHat,
	Bell,
	AlertTriangle,
	Map,
	Car,
	Sparkles,
	Fuel,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BackendModuleKey } from '../../types/User';

type UiDensity = 'comfortable' | 'compact';

interface SidebarProps {
	currentPage: string;
	onPageChange: (page: string) => void;
	uiDensity: UiDensity;
}

type ViewDefinition = {
	id: string;
	labelKey: string;
	icon: LucideIcon;
	areas?: string[];
	moduleKey?: BackendModuleKey | BackendModuleKey[];
	sectionKey: SidebarSectionKey;
	moduleBadgeKey?: string;
};

type SidebarSectionKey = 'general' | 'operations' | 'management';

interface NavButtonProps {
	item: ViewDefinition;
	label: string;
	collapsed: boolean;
	compact: boolean;
	isActive: boolean;
	onClick: (id: string) => void;
	moduleLabel?: string;
}

interface SidebarHeaderProps {
	isCollapsed: boolean;
	compact: boolean;
	onToggle: () => void;
	subtitle: string;
	expandLabel: string;
	collapseLabel: string;
}

interface SidebarFooterProps {
	isCollapsed: boolean;
	compact: boolean;
	onLogout: () => void;
	logoutLabel: string;
}

const SidebarSectionHeader: React.FC<{ label: string; collapsed: boolean; compact: boolean }> = ({
	label,
	collapsed,
	compact,
}) => {
	const dividerClass = compact ? 'my-2.5 mx-1' : 'my-3 mx-1.5';
	if (collapsed) {
		return <div className={`${dividerClass} h-px rounded-full bg-slate-200/70 dark:bg-white/10`} aria-hidden="true" />;
	}
	return (
		<div
			className={`flex items-center text-xs font-semibold uppercase tracking-[0.32em] text-slate-400/90 dark:text-blue-100/50 ${
				compact ? 'px-2.5 pt-3 pb-1' : 'px-3 pt-4 pb-1.5'
			}`}
		>
			<span className="flex-1 border-t border-dashed border-slate-200/70 pr-3 dark:border-white/10" aria-hidden="true" />
			<span className="px-2 text-[11px] tracking-[0.32em] text-slate-500/80 dark:text-blue-100/60">{label}</span>
			<span className="flex-1 border-t border-dashed border-slate-200/70 pl-3 dark:border-white/10" aria-hidden="true" />
		</div>
	);
};

const SidebarModuleGroupHeader: React.FC<{ label: string; compact: boolean }> = ({ label, compact }) => (
	<div
		className={`px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400/80 dark:text-blue-100/60 ${
			compact ? 'pt-2 pb-1' : 'pt-3 pb-1.5'
		}`}
	>
		{label}
	</div>
);

const SidebarNavButton: React.FC<NavButtonProps> = ({ item, label, collapsed, compact, isActive, onClick, moduleLabel }) => {
	const Icon = item.icon;
	const baseClasses = 'group relative flex items-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-400 focus-visible:ring-offset-transparent';
	const activeClasses = 'bg-gradient-to-br from-sky-200/90 to-indigo-200/80 text-slate-900 shadow-lg shadow-sky-200/60 dark:from-white/15 dark:to-white/15 dark:text-white dark:shadow-blue-900/40';
	const inactiveClasses = 'text-slate-600 hover:text-slate-900 hover:bg:white/80 dark:text-blue-100/70 dark:hover:text-white dark:hover:bg-white/10';

	if (collapsed) {
		const collapsedBaseClasses = `${baseClasses} h-11 w-11 justify-center rounded-2xl border bg-white/80 p-0 text-slate-600 shadow-sm backdrop-blur-sm dark:bg-white/5 dark:text-blue-100/80`;
		const collapsedActiveClasses = 'border-sky-300/70 bg-gradient-to-br from-sky-200/80 to-indigo-200/80 text-slate-900 shadow-lg shadow-sky-200/60 ring-2 ring-sky-200/70 ring-offset-2 ring-offset-white dark:border-transparent dark:from-sky-500/30 dark:to-sky-600/20 dark:text-white dark:shadow-sky-900/60 dark:ring-offset-0';
		const collapsedInactiveClasses = 'border-slate-200 hover:border-sky-300 hover:bg-white dark:border-white/10 dark:hover:border-sky-300/40 dark:hover:bg-white/10';
		return (
			<button
				onClick={() => onClick(item.id)}
				title={moduleLabel ? `${label} • ${moduleLabel}` : label}
				className={`${collapsedBaseClasses} ${isActive ? collapsedActiveClasses : collapsedInactiveClasses}`}
			>
				<Icon className="relative h-5 w-5" />
			</button>
		);
	}

	return (
		<button
			onClick={() => onClick(item.id)}
			className={`${baseClasses} w-full rounded-xl ${compact ? 'gap-2.5 px-2.5 py-2' : 'gap-3 px-3 py-2.5'} ${
				isActive ? activeClasses : inactiveClasses
			}`}
		>
			<span
				className={`flex items-center justify-center rounded-lg bg-white text-slate-600 shadow-inner dark:bg-white/10 dark:text-white ${
					compact ? 'h-8 w-8' : 'h-9 w-9'
				}`}
			>
				<Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
			</span>
			<div className="flex flex-1 flex-col text-left">
				<span className="text-sm font-medium tracking-tight text-slate-700 dark:text-white">{label}</span>
			</div>
			{isActive && (
				<span className={`${compact ? 'h-[6px] w-[6px]' : 'h-2 w-2'} rounded-full bg-emerald-400`} />
			)}
		</button>
	);
};

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ isCollapsed, compact, onToggle, subtitle, expandLabel, collapseLabel }) => (
	<div
		className={`relative border-b border-slate-200/60 dark:border-white/10 ${compact ? 'px-3 py-3' : 'px-4 py-4'}`}
	>
		<div className={`flex items-center justify-between ${compact ? 'gap-2.5' : 'gap-3'}`}>
			{!isCollapsed && (
				<div className={`flex items-center ${compact ? 'gap-2.5' : 'gap-3'}`}>
					<div
						className={`flex items-center justify-center rounded-2xl bg-sky-200 text-sky-600 shadow-inner dark:bg-blue-500/20 dark:text-blue-200 ${
							compact ? 'h-9 w-9' : 'h-10 w-10'
						}`}
					>
						<Sparkles className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
					</div>
					<div className="leading-tight">
						<h1 className="text-base font-semibold tracking-wide text-slate-800 dark:text-white">P I G O</h1>
						<p className="text-xs font-medium uppercase tracking-[0.32em] text-blue-500/80 dark:text-blue-200/70">{subtitle}</p>
					</div>
				</div>
			)}
			<button
				onClick={onToggle}
				className={`flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:border-sky-300 hover:bg-sky-50 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 dark:hover:border:white/30 dark:hover:bg:white/20 ${
					compact ? 'h-8 w-8' : 'h-9 w-9'
				}`}
				aria-label={isCollapsed ? expandLabel : collapseLabel}
				title={isCollapsed ? expandLabel : collapseLabel}
			>
				{isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
			</button>
		</div>
	</div>
);

const SidebarFooter: React.FC<SidebarFooterProps> = ({ isCollapsed, compact, onLogout, logoutLabel }) => (
	<div
		className={`relative border-t border-slate-200/60 dark:border-white/10 ${compact ? 'px-2.5 py-3' : 'px-3 py-4'}`}
	>
		<button
			onClick={onLogout}
			className={`group flex w-full items-center rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 transition-all hover:border-sky-300 hover:bg-sky-50 hover:text-slate-800 dark:border-transparent dark:bg-white/5 dark:text-blue-100 dark:hover:border:white/20 dark:hover:bg:white/15 dark:hover:text:white ${
				compact ? 'gap-2.5 px-2.5 py-1.5' : 'gap-3 px-3 py-2'
			}`}
		>
			<span
				className={`flex items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200 ${
					compact ? 'h-8 w-8' : 'h-9 w-9'
				}`}
			>
				<LogOut className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
			</span>
			{!isCollapsed && <span className="text-slate-700 dark:text-white">{logoutLabel}</span>}
		</button>
	</div>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange, uiDensity }) => {
	const [isCollapsed, setIsCollapsed] = useState(false);
	const { user, logout, modules } = useAuth();
	const { t, language } = useLanguage();
	const compact = uiDensity === 'compact';
	const moduleSet = useMemo(() => new Set(modules ?? []), [modules]);

	const sectionLabels = useMemo(
		() => ({
			general: t('sidebar.section.general'),
			operations: t('sidebar.section.operations'),
			management: t('sidebar.section.management'),
		}),
		[t],
	);

	const hasAreaAccess = (area: string) => Boolean(user?.isAdmin || user?.areas?.includes(area));

	const hasModuleAccess = (moduleRequirement?: BackendModuleKey | BackendModuleKey[]) => {
		if (!moduleRequirement) {
			return true;
		}
		if (user?.isAdmin) {
			return true;
		}
		if (moduleSet.size === 0) {
			return true;
		}
		const required = Array.isArray(moduleRequirement) ? moduleRequirement : [moduleRequirement];
		return required.some(key => moduleSet.has(key));
	};

	const getModuleLabel = (moduleRequirement?: BackendModuleKey | BackendModuleKey[], badgeKey?: string) => {
		if (badgeKey) {
			const badgeTranslation = t(badgeKey);
			if (badgeTranslation && badgeTranslation !== badgeKey) {
				return badgeTranslation;
			}
		}
		if (!moduleRequirement) {
			return undefined;
		}
		const keys = Array.isArray(moduleRequirement) ? moduleRequirement : [moduleRequirement];
		const primaryKey = keys[0];
		if (!primaryKey) {
			return undefined;
		}
		const translationKey = `module.label.${primaryKey}`;
		const translated = t(translationKey);
		return translated && translated !== translationKey ? translated : primaryKey.split('_').join(' ');
	};

	const viewDefinitions: ViewDefinition[] = [
		{ id: 'dashboard', labelKey: 'nav.dashboard', icon: Home, moduleKey: 'DASHBOARD', sectionKey: 'general' },
		{ id: 'notifications', labelKey: 'nav.notifications', icon: Bell, moduleKey: 'NOTIFICATIONS', sectionKey: 'general' },
		{ id: 'tickets', labelKey: 'nav.tickets', icon: Ticket, moduleKey: 'TICKETS', sectionKey: 'general' },
		{ id: 'incidents', labelKey: 'nav.incidents', icon: AlertTriangle, moduleKey: 'INCIDENTS', sectionKey: 'general' },
		{
			id: 'transport-routes',
			labelKey: 'nav.routes',
			icon: Map,
			areas: ['Transporte'],
			moduleKey: 'ROUTES',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.transport',
		},
		{
			id: 'fleet-registry',
			labelKey: 'nav.fleetRegistry',
			icon: Car,
			areas: ['Transporte'],
			moduleKey: 'FLEET',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.transport',
		},
		{
			id: 'fuel-by-fleet',
			labelKey: 'nav.fuel',
			icon: Fuel,
			areas: ['Transporte'],
			moduleKey: 'FUEL',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.transport',
		},
		{
			id: 'truck-assignments',
			labelKey: 'nav.assignments',
			icon: Car,
			areas: ['Transporte'],
			moduleKey: 'ROUTES',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.transport',
		},
		{
			id: 'maintenance',
			labelKey: 'nav.maintenance',
			icon: Wrench,
			areas: ['Taller'],
			moduleKey: 'MAINTENANCE',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.maintenance',
		},
		{
			id: 'cleaning-reports',
			labelKey: 'nav.cleaningReports',
			icon: Sparkles,
			areas: ['Aseo'],
			moduleKey: 'CLEANING',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.cleaning',
		},
		{
			id: 'civil-works',
			labelKey: 'nav.civilWorks',
			icon: HardHat,
			areas: ['Obras'],
			moduleKey: 'CIVIL_WORK',
			sectionKey: 'operations',
			moduleBadgeKey: 'module.badge.civil',
		},
		{
			id: 'user-management',
			labelKey: 'nav.userManagement',
			icon: Users,
			areas: ['Admin', 'RRHH'],
			moduleKey: 'USERS',
			sectionKey: 'management',
			moduleBadgeKey: 'module.badge.management',
		},
	];

	const visibleItemsUnique = viewDefinitions.filter((item) => {
		if (!hasModuleAccess(item.moduleKey)) {
			return false;
		}
		if (!item.areas || item.areas.length === 0) return true;
		return item.areas.some(area => hasAreaAccess(area));
	});

	const handleLogout = () => {
		logout();
	};

	const navCopy = useMemo(() => {
		switch (language) {
			case 'en':
				return {
					expand: 'Expand navigation',
					collapse: 'Collapse navigation',
				};
			case 'pt':
				return {
					expand: 'Expandir navegação',
					collapse: 'Recolher navegação',
				};
			default:
				return {
					expand: 'Expandir navegación',
					collapse: 'Contraer navegación',
				};
		}
	}, [language]);

	let lastSection: SidebarSectionKey | null = null;
	let lastModuleGroupKey: string | null = null;
	const navContent = visibleItemsUnique.map(item => {
		const sectionChanged = item.sectionKey !== lastSection;
		if (sectionChanged) {
			lastModuleGroupKey = null;
		}
		const moduleLabel = item.moduleBadgeKey ? getModuleLabel(item.moduleKey, item.moduleBadgeKey) : undefined;
		const shouldRenderModuleHeader =
			!isCollapsed && Boolean(moduleLabel) && Boolean(sectionChanged || item.moduleBadgeKey !== lastModuleGroupKey);
		lastSection = item.sectionKey;
		if (item.moduleBadgeKey && moduleLabel) {
			lastModuleGroupKey = item.moduleBadgeKey;
		}
		return (
			<React.Fragment key={item.id}>
				{sectionChanged && (
					<SidebarSectionHeader
						label={sectionLabels[item.sectionKey] ?? item.sectionKey}
						collapsed={isCollapsed}
						compact={compact}
					/>
				)}
				{shouldRenderModuleHeader && moduleLabel && (
					<SidebarModuleGroupHeader label={moduleLabel} compact={compact} />
				)}
				<SidebarNavButton
					item={item}
					label={t(item.labelKey)}
					collapsed={isCollapsed}
					compact={compact}
					isActive={currentPage === item.id}
					onClick={onPageChange}
					moduleLabel={isCollapsed ? moduleLabel : undefined}
				/>
			</React.Fragment>
		);
	});

	return (
		<div
			className={`relative flex min-h-screen flex-col overflow-hidden text-slate-700 transition-all duration-300 ease-out dark:text-white ${
				isCollapsed ? 'w-[4.5rem]' : 'w-72'
			}`}
		>
			<div className="absolute inset-0 bg-gradient-to-b from-blue-100 via-white to-indigo-100 dark:from-blue-900 dark:via-slate-950 dark:to-slate-950" />
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_rgba(191,219,254,0.15))] dark:bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.35),_rgba(15,23,42,0.65))]" />
			<div className="absolute inset-0 bg-white/60 backdrop-blur-xl dark:bg-black/30" />

			<div className="relative flex h-full flex-col">
				<SidebarHeader
					isCollapsed={isCollapsed}
					compact={compact}
					onToggle={() => setIsCollapsed(!isCollapsed)}
					subtitle={t('sidebar.brandSubtitle')}
					expandLabel={navCopy.expand}
					collapseLabel={navCopy.collapse}
				/>

				<nav
					className={`relative flex-1 overflow-y-auto ${compact ? 'px-2.5 py-3' : 'px-3 py-4'} ${
						compact ? 'space-y-1.5' : 'space-y-2'
					}`}
				>
					<div className={compact ? 'space-y-1.5' : 'space-y-2'}>{navContent}</div>
				</nav>

				<SidebarFooter
					isCollapsed={isCollapsed}
					compact={compact}
					onLogout={handleLogout}
					logoutLabel={t('sidebar.logout')}
				/>
			</div>
		</div>
	);
};

export default Sidebar;
