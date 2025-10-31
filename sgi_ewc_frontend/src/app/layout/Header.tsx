import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Bell, Search, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { listNotifications, markNotificationAsRead } from '../../utils/notificationApi';
import { getUsers } from '../../utils/userApi';
import { getTickets } from '../../utils/ticketApi';
import { getVehiculos, getTallerWorkOrders } from '../../utils/tallerApi';
import { getRoutes } from '../../utils/RoutesApi';
import { fetchIncidents } from '../../utils/incidentApi';
import type { Ticket } from '../../types/Ticket';
import type { User as UserType } from '../../types/User';
import type { AppNotification } from '../../types/Notification';
import { useIntlFormat } from '../intl/format';
import { useNavigate } from 'react-router-dom';
import type { Vehiculo } from '../../types/Vehiculo';
import type { OrdenTrabajo } from '../../types/OrdenTrabajo';
import type { Incident } from '../../types/Incident';

interface Notification {
	id: string;
	type: string;
	message: string;
	timestamp: string;
	read: boolean;
}

type UiDensity = 'comfortable' | 'compact';

interface HeaderProps {
	title: string;
	onProfileClick: () => void;
	onSettingsClick: () => void;
	uiDensity?: UiDensity;
}

// Tipado de eventos de Socket.IO
type NotificationWire = {
	id?: number | string;
	type?: string;
	message?: string;
	read?: boolean;
	createdAt?: string | Date;
};

type MessageWire = {
	id?: number | string;
	content?: string;
};

interface ServerToClientEvents {
	notification: (data: NotificationWire) => void;
	message: (data: MessageWire) => void;
	'notifications:init': (list: NotificationWire[]) => void;
	'notifications:error': (e: { message: string }) => void;
}

type ClientToServerEvents = Record<string, never>;

// Los mapeadores dependen del formato de hora preferido
const makeMapAppNotification = (formatTime: (v?: string | Date | null) => string) =>
	(notification: AppNotification): Notification => ({
		id: notification.id,
		type: notification.type ?? notification.priority ?? 'info',
		message: notification.message ?? notification.title,
		timestamp: formatTime(notification.createdAt),
		read: notification.read ?? false,
	});

const makeMapWireNotification = (formatTime: (v?: string | Date | null) => string) =>
	(wire: NotificationWire): Notification => ({
		id: String(wire.id ?? Date.now()),
		type: wire.type ?? 'info',
		message: wire.message ?? 'Nueva notificación',
		timestamp: formatTime(wire.createdAt ?? null),
		read: wire.read ?? false,
	});

const mergeNotifications = (incoming: Notification[], existing: Notification[]): Notification[] => {
	if (!incoming.length) return existing;
	const seen = new Set<string>();
	const merged: Notification[] = [];

	for (const notif of incoming) {
		merged.push(notif);
		seen.add(notif.id);
	}

	for (const notif of existing) {
		if (!seen.has(notif.id)) {
			merged.push(notif);
		}
	}

	return merged;
};

// Tipos y helpers para la búsqueda
type FlatItem = { kind: 'section' | 'user' | 'ticket' | 'vehicle' | 'route' | 'maint' | 'incident'; key: string; payload?: unknown; label: string; helper?: string };

type SearchResultShape = {
	users: Array<{ id: number; title: string; subtitle: string }>;
	tickets: Array<{ id: number; title: string; subtitle: string }>;
	vehicles: Array<{ id: number; title: string; subtitle: string }>;
	routes: Array<{ id: number; title: string; subtitle: string }>;
	maint: Array<{ id: number; title: string; subtitle: string }>;
	incidents: Array<{ id: string | number; title: string; subtitle: string }>;
};

const buildFlatResults = (
	isAdmin: boolean | undefined,
	searchResults: {
		users: Array<{ id: number; title: string; subtitle: string }>;
		tickets: Array<{ id: number; title: string; subtitle: string }>;
		vehicles: Array<{ id: number; title: string; subtitle: string }>;
		routes: Array<{ id: number; title: string; subtitle: string }>;
		maint: Array<{ id: number; title: string; subtitle: string }>;
		incidents: Array<{ id: string | number; title: string; subtitle: string }>;
	}
): FlatItem[] => {
	const sections: Array<{
		show: boolean;
		sectionKey: string;
		sectionLabel: string;
		kind: FlatItem['kind'];
		items: Array<{ id: number | string; title: string; subtitle: string }>;
	}> = [
		{ show: !!isAdmin && searchResults.users.length > 0, sectionKey: 'users', sectionLabel: 'Usuarios', kind: 'user', items: searchResults.users },
		{ show: searchResults.tickets.length > 0, sectionKey: 'tickets', sectionLabel: 'Tickets', kind: 'ticket', items: searchResults.tickets },
		{ show: searchResults.vehicles.length > 0, sectionKey: 'vehicles', sectionLabel: 'Flota', kind: 'vehicle', items: searchResults.vehicles },
		{ show: searchResults.routes.length > 0, sectionKey: 'routes', sectionLabel: 'Rutas', kind: 'route', items: searchResults.routes },
		{ show: searchResults.maint.length > 0, sectionKey: 'maint', sectionLabel: 'Mantenimiento', kind: 'maint', items: searchResults.maint },
		{ show: searchResults.incidents.length > 0, sectionKey: 'incidents', sectionLabel: 'Incidentes', kind: 'incident', items: searchResults.incidents },
	];

	const list: FlatItem[] = [];
	for (const s of sections) {
		if (!s.show) continue;
		list.push({ kind: 'section', key: `${s.sectionKey}-section`, label: s.sectionLabel });
		for (const it of s.items) {
			list.push({ kind: s.kind, key: `${s.kind}-${it.id}`, payload: it, label: it.title, helper: it.subtitle });
		}
	}
	return list;
};

const Header: React.FC<HeaderProps> = ({ title, onProfileClick, onSettingsClick, uiDensity }) => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const { formatTime } = useIntlFormat();
	const mapAppNotification = useMemo(() => makeMapAppNotification(formatTime), [formatTime]);
	const mapWireNotification = useMemo(() => makeMapWireNotification(formatTime), [formatTime]);
	const [showProfileMenu, setShowProfileMenu] = useState(false);
	const [showNotifications, setShowNotifications] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const unreadCount = notifications.filter(n => !n.read).length;
	const [searchText, setSearchText] = useState('');
	const searchDebounceRef = useRef<number | undefined>(undefined);

	const menuRef = useRef<HTMLDivElement>(null);
	const notifRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLDivElement>(null);
	const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<{
		users: Array<{ id: number; title: string; subtitle: string }>;
		tickets: Array<{ id: number; title: string; subtitle: string }>;
		vehicles: Array<{ id: number; title: string; subtitle: string }>;
		routes: Array<{ id: number; title: string; subtitle: string }>;
		maint: Array<{ id: number; title: string; subtitle: string }>;
		incidents: Array<{ id: string | number; title: string; subtitle: string }>;
	}>({ users: [], tickets: [], vehicles: [], routes: [], maint: [], incidents: [] });
	const [activeIndex, setActiveIndex] = useState<number>(-1);

	// Lista plana para navegación con teclas
		const flatResults = useMemo(() => buildFlatResults(user?.isAdmin, searchResults), [user?.isAdmin, searchResults]);
	const areaCount = Array.isArray(user?.areas) ? user?.areas?.length ?? 0 : 0;
	const areaBadgeLabel = areaCount > 0 ? `${areaCount} áreas` : user?.email ?? 'Sesión activa';
	const unreadDisplay = unreadCount > 9 ? '9+' : String(unreadCount);
	const density: UiDensity = uiDensity ?? 'comfortable';
	const headerPadding = density === 'compact' ? 'px-5 py-3' : 'px-6 py-4';
	const actionGap = density === 'compact' ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4';
	const searchWidth = density === 'compact' ? 'w-60' : 'w-72';
	const searchPadding = density === 'compact' ? 'py-1.5' : 'py-2';

	useEffect(() => {
		if (!user?.id) return;
		let cancelled = false;

		const fetchNotifications = async () => {
			try {
				const items = await listNotifications();
				if (cancelled) return;
				const mapped = items.map(mapAppNotification);
				setNotifications(prev => mergeNotifications(mapped, prev));
			} catch (err) {
				console.warn('No se pudieron cargar las notificaciones iniciales', err);
			}
		};

		void fetchNotifications();

		return () => {
			cancelled = true;
		};
	}, [user?.id, mapAppNotification]);

		// Helpers para la búsqueda global
		const parseSearch = (q: string) => {
			const m = /^([a-zA-Z]+):\s*(.*)$/.exec(q);
			const prefix = m ? m[1].toLowerCase() : '';
			const rawQuery = (m ? m[2] : q).trim();
			const ql = rawQuery.toLowerCase();
			return { prefix, rawQuery, ql };
		};

			const loadUsers = async (ql: string) => {
			if (!user?.isAdmin) return [] as Array<{ id: number; title: string; subtitle: string }>;
			const list: UserType[] = await getUsers();
			const filtered = list.filter((u) =>
				(u.username || '').toLowerCase().includes(ql) || (u.email || '').toLowerCase().includes(ql)
			).slice(0, 8);
			return filtered.map((u) => ({ id: u.id, title: u.username, subtitle: u.email }));
		};

		const loadTickets = async (ql: string, rawQuery: string) => {
			const tickets: Ticket[] = await getTickets();
			const isAccessible = (t: Ticket) => {
				const createdByMe = !!user?.id && t.createdBy?.id === user.id;
				const assignedToMe = !!user?.id && (t.assignedTo?.id ?? null) === user.id;
				const inMyAreas = Array.isArray(t.recipientArea) && t.recipientArea.some(a => (user?.areas || []).includes(a));
				return !!user && (user.isAdmin || createdByMe || assignedToMe || inMyAreas);
			};
			const filteredTickets = tickets
				.filter((t) => (
					String(t.id ?? '').includes(rawQuery) ||
					(t.title || '').toLowerCase().includes(ql) ||
					(t.description || '').toLowerCase().includes(ql)
				) && isAccessible(t))
				.slice(0, 8);
			return filteredTickets.map((t) => ({ id: t.id, title: t.title || `Ticket #${t.id}`, subtitle: `#${t.id} • ${t.status || '—'}` }));
		};

		const loadVehicles = async (ql: string, rawQuery: string) => {
			try {
				const vehicles: Vehiculo[] = await getVehiculos();
				return vehicles.filter(v => {
					const hay = [v.patente, v.marca, v.modelo, v.codigo, v.areaAsignada].map(x => (x ?? '').toString().toLowerCase()).join(' ');
					return hay.includes(ql) || String(v.id).includes(rawQuery);
				}).slice(0, 8).map(v => ({ id: v.id, title: `${v.patente} — ${v.marca} ${v.modelo}`, subtitle: `${v.areaAsignada ?? 'Sin área'} • ${v.estado ?? ''}` }));
			} catch {
				return [];
			}
		};

		const loadRoutes = async (ql: string, rawQuery: string) => {
			try {
				const routes = await getRoutes() as unknown as Array<{ id: number; code: string; origin: string; destination: string; distanceKm: number; frequency: string }>;
				return routes.filter(r => {
					const hay = [r.code, r.origin, r.destination].map(x => String(x).toLowerCase()).join(' ');
					return hay.includes(ql) || String(r.id).includes(rawQuery);
				}).slice(0, 8).map(r => ({ id: r.id, title: `${r.code}: ${r.origin} → ${r.destination}`, subtitle: `${r.distanceKm} km • ${r.frequency}` }));
			} catch {
				return [];
			}
		};

		const loadMaint = async (ql: string, rawQuery: string) => {
			try {
				const ots: OrdenTrabajo[] = await getTallerWorkOrders();
				return ots.filter(ot => {
					const hay = [ot.description ?? '', ot.tipo ?? '', ot.estado ?? '', String(ot.vehiculoId)].map(x => String(x).toLowerCase()).join(' ');
					return hay.includes(ql) || String(ot.id).includes(rawQuery);
				}).slice(0, 8).map(ot => ({ id: ot.id, title: `OT #${ot.id} — ${ot.tipo ?? ''} (${ot.estado})`, subtitle: `Vehículo ${ot.vehiculoId}` }));
			} catch {
				return [];
			}
		};

		const loadIncidents = async (ql: string, rawQuery: string) => {
			try {
				const incs: Incident[] = await fetchIncidents();
				return incs.filter(i => {
					const hay = [i.title ?? '', i.description ?? '', i.area ?? '', i.type ?? ''].map(x => String(x).toLowerCase()).join(' ');
					return hay.includes(ql) || String(i.id).includes(rawQuery);
				}).slice(0, 8).map(i => ({ id: i.id, title: i.title || `Incidente ${i.type}`, subtitle: `${i.area ?? ''} • ${i.status}` }));
			} catch {
				return [];
			}
		};

		const runGlobalSearch = async (q: string) => {
		if (!q) {
			setSearchResults({ users: [], tickets: [], vehicles: [], routes: [], maint: [], incidents: [] });
			setSearchOpen(false);
			setSearchLoading(false);
			setActiveIndex(-1);
			return;
		}
		setSearchOpen(true);
		setSearchLoading(true);
		try {
						const { prefix, rawQuery, ql } = parseSearch(q);

								const loadAll = async (): Promise<SearchResultShape> => {
							const [users, tickets, vehicles, routes, maint, incidents] = await Promise.all([
								loadUsers(ql),
								loadTickets(ql, rawQuery),
								loadVehicles(ql, rawQuery),
								loadRoutes(ql, rawQuery),
								loadMaint(ql, rawQuery),
								loadIncidents(ql, rawQuery),
							]);
									return { users, tickets, vehicles, routes, maint, incidents };
						};

								const applyPrefix = (res: SearchResultShape, pfx: string): SearchResultShape => {
							if (!pfx) return res;
							const allow = (k: string) => ({ u: 'users', user: 'users', t: 'tickets', ticket: 'tickets', v: 'vehicles', vehiculo: 'vehicles', f: 'vehicles', r: 'routes', route: 'routes', m: 'maint', maint: 'maint', mantenimiento: 'maint', i: 'incidents', incidente: 'incidents' } as Record<string,string>)[k];
							const target = allow(pfx);
							if (!target) return res;
							return {
								users: target === 'users' ? res.users : [],
								tickets: target === 'tickets' ? res.tickets : [],
								vehicles: target === 'vehicles' ? res.vehicles : [],
								routes: target === 'routes' ? res.routes : [],
								maint: target === 'maint' ? res.maint : [],
								incidents: target === 'incidents' ? res.incidents : [],
							};
						};

						const rawRes = await loadAll();
						const finalRes = applyPrefix(rawRes, prefix);
						setSearchResults(finalRes);
			setActiveIndex(-1);
		} catch (e) {
			console.warn('Global search error', e);
			setSearchResults({ users: [], tickets: [], vehicles: [], routes: [], maint: [], incidents: [] });
		} finally {
			setSearchLoading(false);
		}
	};

	useEffect(() => {
		if (!user?.id) return;
		const wsBaseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
		const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(wsBaseUrl, {
			// permitir polling + upgrade a websocket
			reconnection: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			transports: ['websocket', 'polling'],
			path: '/socket.io',
			query: { userId: String(user.id) },
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('WS conectado', socket.id);
		});
		socket.on('connect_error', (err) => {
			console.warn('WS error de conexión', err);
		});

		socket.on('notifications:error', (e) => {
			console.warn('WS notifications:error', e?.message || e);
		});

		// Escuchar notificaciones
		socket.on('notifications:init', (list) => {
			const mapped = (list ?? []).map(mapWireNotification);
			setNotifications(prev => mergeNotifications(mapped, prev));
		});

		socket.on('notification', (data) => {
			console.log('Notificación recibida:', data);
			const newNotif = mapWireNotification(data);
			setNotifications(prev => mergeNotifications([newNotif], prev));
		});

		return () => {
			socket.off('notifications:init');
			socket.off('notification');
			socket.off('message');
			socket.off('connect');
			socket.off('connect_error');
			socket.off('notifications:error');
			socket.disconnect();
		};
	}, [user?.id, mapWireNotification]);

	// Cerrar menús al hacer click fuera
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setShowProfileMenu(false);
			}
			if (
				notifRef.current &&
				!notifRef.current.contains(event.target as Node)
			) {
				setShowNotifications(false);
			}
			if (
				searchRef.current &&
				!searchRef.current.contains(event.target as Node)
			) {
				setSearchOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Atajo global Ctrl/Cmd+K para enfocar búsqueda
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			const isMac = /Mac/i.test(navigator.userAgent);
			if ((isMac ? e.metaKey : e.ctrlKey) && (e.key.toLowerCase() === 'k')) {
				e.preventDefault();
				const inputEl = searchRef.current?.querySelector('input');
				if (inputEl) {
					inputEl.focus();
					setSearchOpen(true);
				}
			}
		};
		globalThis.addEventListener('keydown', handler);
		return () => globalThis.removeEventListener('keydown', handler);
	}, []);

	// Acción al seleccionar un resultado
	const selectActive = () => {
		if (activeIndex < 0 || activeIndex >= flatResults.length) return;
		const item = flatResults[activeIndex];
		if (!item || item.kind === 'section') return;
		if (item.kind === 'user') {
			const u = item.payload as { id: number; title: string };
			navigate('/usuarios');
			globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: u.title } }));
			setSearchOpen(false);
			setSearchText('');
			setActiveIndex(-1);
			return;
		}
		if (item.kind === 'ticket') {
			const t = item.payload as { id: number; title: string };
			navigate('/tickets');
			// dar tiempo al enrutamiento para que la página monte
			setTimeout(() => {
				globalThis.dispatchEvent(new CustomEvent('tickets:open', { detail: { id: t.id } }));
			}, 50);
			setSearchOpen(false);
			setSearchText('');
			setActiveIndex(-1);
		}
		if (item.kind === 'vehicle') {
			const v = item.payload as { id: number; title: string };
			navigate('/flota');
			setTimeout(() => {
				globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: v.title.split(' — ')[0] } }));
			}, 50);
			setSearchOpen(false);
			setSearchText('');
			setActiveIndex(-1);
		}
		if (item.kind === 'route') {
			const r = item.payload as { id: number; title: string };
			navigate('/rutas');
			setTimeout(() => {
				globalThis.dispatchEvent(new CustomEvent('routes:open', { detail: { id: r.id } }));
				globalThis.dispatchEvent(new CustomEvent('routes:search', { detail: { query: r.title.split(':')[0] } }));
			}, 50);
			setSearchOpen(false);
			setSearchText('');
			setActiveIndex(-1);
		}
		if (item.kind === 'maint') {
			const m = item.payload as { id: number; title: string };
			navigate('/mantenimiento');
			setTimeout(() => {
				globalThis.dispatchEvent(new CustomEvent('maintenance:open', { detail: { id: m.id } }));
			}, 50);
			setSearchOpen(false);
			setSearchText('');
			setActiveIndex(-1);
		}
		if (item.kind === 'incident') {
			const i = item.payload as { id: string | number; title: string };
			navigate('/incidentes');
			setTimeout(() => {
				globalThis.dispatchEvent(new CustomEvent('incidents:open', { detail: { id: i.id } }));
			}, 50);
			setSearchOpen(false);
			setSearchText('');
			setActiveIndex(-1);
		}
	};

	const getTitle = (title: string) => {
		const titleMap: { [key: string]: string } = {
			Dashboard: 'Panel Principal',
			'Trip Reports': 'Reportes de Viajes',
			'route-management': 'Gestión de Rutas',
			'fleet-registry': 'Registro de Flota',
			'Maintenance Management': 'Gestión de Mantenimiento',
			'Cleaning Reports': 'Reportes de Limpieza',
			'Civil Works Reports': 'Reportes de Obras Civiles',
			'Ticket System': 'Sistema de Tickets',
			'User Management': 'Gestión de Usuarios',
		};
		return titleMap[title] || title;
	};

	const handleNotificationClick = async (notification: Notification) => {
		if (notification.read) {
			return;
		}

		try {
			const updated = await markNotificationAsRead(notification.id);
			if (updated) {
				const mapped = mapAppNotification(updated);
				setNotifications(prev => prev.map(n => (n.id === mapped.id ? { ...n, ...mapped } : n)));
			} else {
				setNotifications(prev => prev.map(n => (n.id === notification.id ? { ...n, read: true } : n)));
			}
		} catch (error) {
			console.error("Error al marcar la notificación como leída", error);
		}
	};

	return (
		<header className={`relative border-b border-slate-200/60 bg-gradient-to-r from-blue-100 via-white to-indigo-100 ${headerPadding} text-slate-800 shadow-lg dark:border-white/10 dark:from-blue-900 dark:via-slate-950 dark:to-slate-950 dark:text-white`}>
			<div className="flex w-full flex-wrap items-center gap-6">
				<div className="flex min-w-0 flex-col gap-2">
					<span className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600/70 drop-shadow-sm dark:text-blue-200/80">Operaciones EWC</span>
					<div className="flex flex-wrap items-center gap-3">
						<h1 className="text-2xl font-semibold leading-tight text-slate-900 drop-shadow-sm dark:text-white">{getTitle(title)}</h1>
						<span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-white">
							{areaBadgeLabel}
						</span>
					</div>
					<p className="text-sm text-slate-500 dark:text-blue-100/80">Bienvenido, {user?.username}</p>
				</div>

	<div className={`ml-auto flex items-center ${actionGap}`}>
		{/* Search */}
					<div className="relative hidden md:block" ref={searchRef}>
						<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-blue-200/80" />
						<input
							type="text"
							placeholder="Buscar"
							value={searchText}
							onChange={(e) => {
								const q = e.target.value;
								setSearchText(q);
								if (searchDebounceRef.current) globalThis.clearTimeout(searchDebounceRef.current);
								searchDebounceRef.current = globalThis.setTimeout(() => {
									globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: q } }));
									runGlobalSearch(q);
								}, 300);
							}}
							onKeyDown={(e) => {
								if (e.key === 'Enter') {
									if (searchDebounceRef.current) globalThis.clearTimeout(searchDebounceRef.current);
									globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: searchText } }));
									if (searchOpen && activeIndex >= 0) {
										selectActive();
									} else {
										setSearchOpen(true);
									}
								} else if (e.key === 'Escape') {
									setSearchText('');
									globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: '' } }));
									setSearchOpen(false);
									setSearchResults({ users: [], tickets: [], vehicles: [], routes: [], maint: [], incidents: [] });
									setActiveIndex(-1);
								} else if (e.key === 'ArrowDown') {
									e.preventDefault();
									if (!searchOpen) setSearchOpen(true);
									setActiveIndex((prev) => {
										let next = prev + 1;
										const len = flatResults.length;
										if (len === 0) return -1;
										while (next < len && flatResults[next]?.kind === 'section') next++;
										if (next >= len) {
											// vuelta al primero real
											next = flatResults.findIndex(r => r.kind !== 'section');
										}
										return next;
									});
								} else if (e.key === 'ArrowUp') {
									e.preventDefault();
									setActiveIndex((prev) => {
										let next = prev - 1;
										if (flatResults.length === 0) return -1;
										while (next >= 0 && flatResults[next]?.kind === 'section') next--;
										if (next < 0) {
											// ir al último real
											for (let i = flatResults.length - 1; i >= 0; i--) {
												if (flatResults[i].kind !== 'section') return i;
											}
											return -1;
										}
										return next;
									});
								}
							}}
							className={`${searchWidth} rounded-full border border-slate-300 bg-white/80 ${searchPadding} pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 shadow-inner backdrop-blur focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-white/10 dark:bg-white/10 dark:text-white dark:placeholder-white/60 dark:focus:ring-sky-400`}
						/>

						{searchOpen && (
							<div className="absolute left-0 right-0 z-40 mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
								<div className="border-b px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
									Resultados de búsqueda
								</div>
								{searchLoading ? (
									<div className="p-4 text-sm text-slate-500 dark:text-blue-200/80">Buscando…</div>
								) : (
									<div className="max-h-96 overflow-y-auto">
										{(((user?.isAdmin ? searchResults.users.length : 0)
											+ searchResults.tickets.length
											+ searchResults.vehicles.length
											+ searchResults.routes.length
											+ searchResults.maint.length
											+ searchResults.incidents.length) === 0) && (
											<div className="px-4 py-3 text-sm text-slate-500 dark:text-blue-200/80">Sin resultados</div>
										)}

										{user?.isAdmin && searchResults.users.length > 0 && (
											<div>
												<div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-blue-200/70">Usuarios</div>
												{searchResults.users.map((u) => {
													const realIndex = flatResults.findIndex(r => r.key === `user-${u.id}`);
													const isActive = activeIndex === realIndex;
													return (
													<button
														key={`user-${u.id}`}
														type="button"
															onMouseEnter={() => setActiveIndex(realIndex)}
															onClick={() => {
																navigate('/usuarios');
																globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: u.title } }));
																setSearchOpen(false);
																setSearchText('');
															}}
															className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${isActive ? 'bg-blue-50/70 dark:bg-white/10' : ''}`}
													>
														<div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/30 text-blue-600 shadow-inner dark:from-sky-500/30 dark:to-indigo-500/30 dark:text-blue-100">
															{u.title.charAt(0)}
														</div>
														<div>
															<div className="text-sm font-medium text-slate-800 dark:text:white">{u.title}</div>
															<div className="text-xs text-slate-500 dark:text:blue-200/80">{u.subtitle}</div>
														</div>
													</button>
													);
												})}
											</div>
										)}

										{searchResults.tickets.length > 0 && (
											<div>
												<div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-blue-200/70">Tickets</div>
												{searchResults.tickets.map((t) => {
													const realIndex = flatResults.findIndex(r => r.key === `ticket-${t.id}`);
													const isActive = activeIndex === realIndex;
													return (
													<button
														key={`ticket-${t.id}`}
														type="button"
															onMouseEnter={() => setActiveIndex(realIndex)}
															onClick={() => {
																navigate('/tickets');
																setTimeout(() => {
																	globalThis.dispatchEvent(new CustomEvent('tickets:open', { detail: { id: t.id } }));
																}, 50);
																setSearchOpen(false);
																setSearchText('');
															}}
															className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${isActive ? 'bg-blue-50/70 dark:bg-white/10' : ''}`}
													>
														<div>
															<div className="text-sm font-medium text-slate-800 dark:text-white">{t.title}</div>
															<div className="text-xs text-slate-500 dark:text-blue-200/80">{t.subtitle}</div>
														</div>
														<ChevronDown className="h-4 w-4 text-slate-400" />
													</button>
													);
												})}
											</div>
										)}

										{searchResults.vehicles.length > 0 && (
											<div>
												<div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-blue-200/70">Flota</div>
												{searchResults.vehicles.map((v) => {
													const realIndex = flatResults.findIndex(r => r.key === `vehicle-${v.id}`);
													const isActive = activeIndex === realIndex;
													return (
													<button
														key={`vehicle-${v.id}`}
														type="button"
														onMouseEnter={() => setActiveIndex(realIndex)}
														onClick={() => {
															navigate('/flota');
															setTimeout(() => {
																globalThis.dispatchEvent(new CustomEvent('global-search', { detail: { query: v.title.split(' — ')[0] } }));
															}, 50);
															setSearchOpen(false);
															setSearchText('');
														}}
														className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${isActive ? 'bg-blue-50/70 dark:bg-white/10' : ''}`}
													>
														<div className="text-sm font-medium text-slate-800 dark:text-white">{v.title}</div>
														<div className="text-xs text-slate-500 dark:text-blue-200/80">{v.subtitle}</div>
													</button>
													);
												})}
											</div>
										)}

										{searchResults.routes.length > 0 && (
											<div>
												<div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-blue-200/70">Rutas</div>
												{searchResults.routes.map((r) => {
													const realIndex = flatResults.findIndex(fr => fr.key === `route-${r.id}`);
													const isActive = activeIndex === realIndex;
													return (
													<button
														key={`route-${r.id}`}
														type="button"
														onMouseEnter={() => setActiveIndex(realIndex)}
														onClick={() => {
															navigate('/rutas');
															setTimeout(() => {
																globalThis.dispatchEvent(new CustomEvent('routes:open', { detail: { id: r.id } }));
																globalThis.dispatchEvent(new CustomEvent('routes:search', { detail: { query: r.title.split(':')[0] } }));
															}, 50);
															setSearchOpen(false);
															setSearchText('');
														}}
														className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${isActive ? 'bg-blue-50/70 dark:bg-white/10' : ''}`}
													>
														<div className="text-sm font-medium text-slate-800 dark:text-white">{r.title}</div>
														<div className="text-xs text-slate-500 dark:text-blue-200/80">{r.subtitle}</div>
													</button>
													);
												})}
											</div>
										)}

										{searchResults.maint.length > 0 && (
											<div>
												<div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-blue-200/70">Mantenimiento</div>
												{searchResults.maint.map((m) => {
													const realIndex = flatResults.findIndex(fr => fr.key === `maint-${m.id}`);
													const isActive = activeIndex === realIndex;
													return (
													<button
														key={`maint-${m.id}`}
														type="button"
														onMouseEnter={() => setActiveIndex(realIndex)}
														onClick={() => {
															navigate('/mantenimiento');
															setTimeout(() => {
																globalThis.dispatchEvent(new CustomEvent('maintenance:open', { detail: { id: m.id } }));
															}, 50);
															setSearchOpen(false);
															setSearchText('');
														}}
														className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${isActive ? 'bg-blue-50/70 dark:bg-white/10' : ''}`}
													>
														<div className="text-sm font-medium text-slate-800 dark:text-white">{m.title}</div>
														<div className="text-xs text-slate-500 dark:text-blue-200/80">{m.subtitle}</div>
													</button>
													);
												})}
											</div>
										)}

										{searchResults.incidents.length > 0 && (
											<div>
												<div className="px-4 py-2 text-xs font-semibold uppercase text-slate-500 dark:text-blue-200/70">Incidentes</div>
												{searchResults.incidents.map((i) => {
													const realIndex = flatResults.findIndex(fr => fr.key === `incident-${i.id}`);
													const isActive = activeIndex === realIndex;
													return (
													<button
														key={`incident-${i.id}`}
														type="button"
														onMouseEnter={() => setActiveIndex(realIndex)}
														onClick={() => {
															navigate('/incidentes');
															setTimeout(() => {
																globalThis.dispatchEvent(new CustomEvent('incidents:open', { detail: { id: i.id } }));
															}, 50);
															setSearchOpen(false);
															setSearchText('');
														}}
														className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${isActive ? 'bg-blue-50/70 dark:bg-white/10' : ''}`}
													>
														<div className="text-sm font-medium text-slate-800 dark:text-white">{i.title}</div>
														<div className="text-xs text-slate-500 dark:text-blue-200/80">{i.subtitle}</div>
													</button>
													);
												})}
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Notifications */}
					<div className="relative" ref={notifRef}>
						<button
							type="button"
							onClick={() => setShowNotifications(prev => !prev)}
							className="relative inline-flex items-center rounded-full border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm backdrop-blur hover:border-sky-300 hover:bg-sky-50 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 dark:hover:bg-white/15"
						>
							<Bell className="h-5 w-5" />
							{unreadCount > 0 && (
								<span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-xs font-semibold text-white">
									{unreadDisplay}
								</span>
							)}
						</button>

						{showNotifications && (
							<div className="absolute right-0 z-40 mt-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
								<div className="border-b px-4 py-2 text-sm font-medium text-slate-700 dark:border-slate-800 dark:text-slate-200">
									Notificaciones
								</div>
								<div className="max-h-80 overflow-y-auto">
									{notifications.length === 0 ? (
										<div className="px-4 py-3 text-sm text-slate-500 dark:text-blue-200/80">Sin notificaciones</div>
									) : (
										notifications.map((n) => (
											<button
												key={n.id}
												type="button"
												onClick={() => handleNotificationClick(n)}
												className={`flex w-full items-start gap-3 px-4 py-2 text-left transition-colors hover:bg-blue-50/70 dark:hover:bg-white/10 ${n.read ? 'opacity-70' : ''}`}
											>
												<span className={`mt-1 h-2 w-2 rounded-full ${n.read ? 'bg-slate-300' : 'bg-emerald-400'}`} />
												<div>
													<div className="text-sm font-medium text-slate-800 dark:text-white">{n.message}</div>
													<div className="text-xs text-slate-500 dark:text-blue-200/80">{n.timestamp}</div>
												</div>
											</button>
										))
									)}
								</div>
								<div className="border-t p-2 text-right text-xs dark:border-slate-800">
									<button
										type="button"
										onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
										className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100 dark:text-blue-200 dark:hover:bg-white/10"
									>
										Marcar todo como leído
									</button>
								</div>
							</div>
						)}
					</div>

					{/* Profile */}
					<div className="relative" ref={menuRef}>
						<button
							type="button"
							onClick={() => setShowProfileMenu(prev => !prev)}
							className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-700 shadow-sm backdrop-blur hover:border-sky-300 hover:bg-sky-50 dark:border-white/10 dark:bg-white/10 dark:text-blue-100 dark:hover:border-white/20 dark:hover:bg-white/20"
						>
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/30 text-blue-700 shadow-inner dark:from-blue-500/25 dark:to-indigo-500/20 dark:text-blue-100">
								{user?.username?.charAt(0) || 'U'}
							</span>
							<span className="hidden sm:inline">{user?.username}</span>
							<ChevronDown className="h-4 w-4" />
						</button>

						{showProfileMenu && (
							<div className="absolute right-0 z-40 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
								<div className="py-1">
									<button
										type="button"
										onClick={onProfileClick}
										className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50/70 dark:text-slate-200 dark:hover:bg-white/10"
									>
										Mi Perfil
									</button>
									<button
										type="button"
										onClick={onSettingsClick}
										className="block w-full px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-blue-50/70 dark:text-slate-200 dark:hover:bg-white/10"
									>
										Configuración
									</button>
									<button
										type="button"
										onClick={() => logout()}
										className="block w-full px-4 py-2 text-left text-sm text-rose-600 transition-colors hover:bg-rose-50/70 dark:text-rose-300 dark:hover:bg-rose-500/10"
									>
										Cerrar sesión
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</header>
	);
};

export default Header;
