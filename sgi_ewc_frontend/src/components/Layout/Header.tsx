import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { markNotificationAsRead } from '../../utils/notificationApi';
import { getUsers } from '../../utils/userApi';
import { getTickets } from '../../utils/ticketApi';
import type { Ticket } from '../../types/Ticket';
import type { User as UserType } from '../../types/User';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface HeaderProps {
  title: string;
  onProfileClick: () => void;
  onSettingsClick: () => void;
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

const Header: React.FC<HeaderProps> = ({ title, onProfileClick, onSettingsClick }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [messageCount, setMessageCount] = useState(0);
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
  }>({ users: [], tickets: [] });

  const runGlobalSearch = async (q: string) => {
    if (!q) {
      setSearchResults({ users: [], tickets: [] });
      setSearchOpen(false);
      setSearchLoading(false);
      return;
    }
    setSearchOpen(true);
    setSearchLoading(true);
    try {
      const result = {
        users: [] as Array<{ id: number; title: string; subtitle: string }>,
        tickets: [] as Array<{ id: number; title: string; subtitle: string }>,
      };
      if (user?.isAdmin) {
        const list: UserType[] = await getUsers();
        const ql = q.toLowerCase();
        const filtered = list.filter((u) =>
          (u.username || '').toLowerCase().includes(ql) || (u.email || '').toLowerCase().includes(ql)
        ).slice(0, 8);
        result.users = filtered.map((u) => ({ id: u.id, title: u.username, subtitle: u.email }));
      }
      // Tickets accesibles para el usuario
      const tickets: Ticket[] = await getTickets();
      const ql = q.toLowerCase();
      const isAccessible = (t: Ticket) => {
        const createdByMe = !!user?.id && t.createdBy?.id === user.id;
        const assignedToMe = !!user?.id && (t.assignedTo?.id ?? null) === user.id;
        const inMyAreas = Array.isArray(t.recipientArea) && t.recipientArea.some(a => (user?.areas || []).includes(a));
        return !!user && (user.isAdmin || createdByMe || assignedToMe || inMyAreas);
      };
      const filteredTickets = tickets
        .filter((t) => (
          String(t.id ?? '').includes(q) ||
          (t.title || '').toLowerCase().includes(ql) ||
          (t.description || '').toLowerCase().includes(ql)
        ) && isAccessible(t))
        .slice(0, 8);
      result.tickets = filteredTickets.map((t) => ({
        id: t.id,
        title: t.title || `Ticket #${t.id}`,
        subtitle: `#${t.id} • ${t.status || '—'}`,
      }));
      setSearchResults(result);
    } catch (e) {
      console.warn('Global search error', e);
      setSearchResults({ users: [], tickets: [] });
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    // Usa la misma URL base que las APIs: fallback a http://localhost:3000 si no hay VITE_API_URL
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
      const mapped: Notification[] = (list ?? []).map((n) => ({
        id: String(n.id ?? Date.now()),
        type: n.type ?? 'info',
        message: n.message ?? '',
        timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
        read: n.read ?? false,
      }));
      setNotifications(mapped);
    });

    socket.on('notification', (data) => {
      console.log('Notificación recibida:', data);

      const newNotif: Notification = {
        id: String(data?.id ?? Date.now()),
        type: data?.type ?? 'info',
        message: data?.message ?? 'Nueva notificación',
        timestamp: new Date().toLocaleTimeString(),
        read: false,
      };

      setNotifications((prev) => [newNotif, ...prev]);
    });

    // Escuchar mensajes (chat)
    socket.on('message', (data) => {
      console.log('Mensaje recibido:', data?.content ?? data);
      setMessageCount((prev) => prev + 1);
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
  }, [user?.id]);

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
      // Opcional: si ya está leída, podrías navegar a la página relacionada
      // con la notificación, si aplica.
      return;
    }

    try {
      await markNotificationAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error al marcar la notificación como leída", error);
    }
  };

  return (
    <header className="px-6 py-4 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{getTitle(title)}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">Bienvenido, {user?.username}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block" ref={searchRef}>
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Buscar"
              value={searchText}
              onChange={(e) => {
                const q = e.target.value;
                setSearchText(q);
                if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                searchDebounceRef.current = window.setTimeout(() => {
                  window.dispatchEvent(new CustomEvent('global-search', { detail: { query: q } }));
                  runGlobalSearch(q);
                }, 300);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
                  window.dispatchEvent(new CustomEvent('global-search', { detail: { query: searchText } }));
                  setSearchOpen(true);
                } else if (e.key === 'Escape') {
                  setSearchText('');
                  window.dispatchEvent(new CustomEvent('global-search', { detail: { query: '' } }));
                  setSearchOpen(false);
                  setSearchResults({ users: [], tickets: [] });
                }
              }}
              className="w-64 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white placeholder-gray-400 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
            />

            {searchOpen && (
              <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b dark:text-gray-200 dark:border-gray-800">
                  Resultados de búsqueda
                </div>
                {searchLoading ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Buscando…</div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    {((user?.isAdmin ? searchResults.users.length : 0) + searchResults.tickets.length) === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Sin resultados</div>
                    )}

                    {user?.isAdmin && searchResults.users.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Usuarios</div>
                        {searchResults.users.map(u => (
                          <button
                            key={`user-${u.id}`}
                            type="button"
                            onClick={() => {
                              // Navegar a Gestión de Usuarios y aplicar filtro
                              window.dispatchEvent(new CustomEvent('set-page', { detail: { page: 'user-management' } }));
                              window.dispatchEvent(new CustomEvent('global-search', { detail: { query: u.title } }));
                              setSearchOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {u.title.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm text-gray-900 dark:text-gray-100">{u.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{u.subtitle}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.tickets.length > 0 && (
                      <div>
                        <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">Tickets</div>
                        {searchResults.tickets.map(t => (
                          <button
                            key={`ticket-${t.id}`}
                            type="button"
                            onClick={() => {
                              // Navegar a Tickets y aplicar filtro por id
                              window.dispatchEvent(new CustomEvent('set-page', { detail: { page: 'tickets' } }));
                              window.dispatchEvent(new CustomEvent('global-search', { detail: { query: String(t.id) } }));
                              setSearchOpen(false);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              #{String(t.id).slice(-2)}
                            </div>
                            <div>
                              <div className="text-sm text-gray-900 dark:text-gray-100">{t.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{t.subtitle}</div>
                            </div>
                          </button>
                        ))}
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
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-50 py-2 mt-2 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96 dark:bg-gray-900 dark:border-gray-800">
                <div className="px-4 py-2 font-medium text-gray-700 border-b dark:text-gray-200 dark:border-gray-800">
                  Notificaciones
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">
                    No tienes notificaciones
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <button
                      type="button"
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`block w-full text-left px-4 py-3 border-b hover:bg-gray-50 dark:hover:bg-gray-800 last:border-b-0 ${notif.read ? 'opacity-60' : ''}`}
                      aria-pressed={notif.read}
                    >
                      <p className="text-sm text-gray-800 dark:text-gray-100">{notif.message}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {notif.timestamp}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <button className="relative p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800">
            <MessageSquare className="w-5 h-5" />
            {messageCount > 0 && (
              <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-blue-500 rounded-full -top-1 -right-1">
                {messageCount}
              </span>
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center p-2 space-x-2 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-sm font-medium text-white">{user?.username.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                {(() => {
                  let roleLabel = 'Usuario';
                  if (user?.isAdmin) roleLabel = 'Administrador';
                  else if (user?.roles && user.roles.length > 0) roleLabel = user.roles.join(', ');
                  return (
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400" title={user?.roles?.join(', ')}>
                      {roleLabel}
                    </p>
                  );
                })()}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-900 dark:border-gray-800">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                {(() => {
                  let roleLabel = 'Usuario';
                  if (user?.isAdmin) roleLabel = 'Administrador';
                  else if (user?.roles && user.roles.length > 0) roleLabel = user.roles.join(', ');
                  return (
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400" title={user?.roles?.join(', ')}>
                      {roleLabel}
                    </p>
                  );
                })()}
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onProfileClick();
                  }}
                  className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <span>Ver perfil</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onSettingsClick();
                  }}
                  className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <span>Configuración</span>
                </button>

                <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span>Cerrar sesión</span>
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
