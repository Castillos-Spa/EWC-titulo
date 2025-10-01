import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { markNotificationAsRead } from '../../utils/notificationApi';

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

const Header: React.FC<HeaderProps> = ({ title, onProfileClick }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [messageCount, setMessageCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(import.meta.env.VITE_API_URL, {
      // permitir polling + upgrade a websocket
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      query: { userId: String(user.id) },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WS conectado', socket.id);
    });
    socket.on('connect_error', (err) => {
      console.warn('WS error de conexión', err.message);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getTitle = (title: string) => {
    const titleMap: { [key: string]: string } = { //TODO averiguar bien esto
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
    <header className="px-6 py-4 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle(title)}</h1>
          <p className="text-sm text-gray-600">Bienvenido, {user?.username}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Buscar"
              className="w-64 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 z-50 py-2 mt-2 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg w-80 max-h-96">
                <div className="px-4 py-2 font-medium text-gray-700 border-b">
                  Notificaciones
                </div>
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-center text-gray-500">
                    No tienes notificaciones
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id} // Usar un ID único y estable
                      onClick={() => handleNotificationClick(notif)}
                      className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 last:border-b-0 ${notif.read ? 'opacity-60' : ''}`}
                    >
                      <p className="text-sm text-gray-800">{notif.message}</p>
                      <span className="text-xs text-gray-500">
                        {notif.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          <button className="relative p-2 text-gray-600 transition-colors rounded-lg hover:text-gray-900 hover:bg-gray-100">
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
              className="flex items-center p-2 space-x-2 transition-colors rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full">
                <span className="text-sm font-medium text-white">{user?.username.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate" title={user?.roles.join(', ')}>
                  {user?.isAdmin 
                    ? 'Administrador' 
                    : user?.roles && user.roles.length > 0 
                      ? user.roles.join(', ') 
                      : 'Usuario'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate" title={user?.roles.join(', ')}>
                  {user?.isAdmin 
                    ? 'Administrador' 
                    : user?.roles && user.roles.length > 0 
                      ? user.roles.join(', ') 
                      : 'Usuario'}
                </p>
                </div>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onProfileClick();
                  }}
                  className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <span>Ver perfil</span>
                </button>

                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <span>Configuración</span>
                </button>

                <div className="pt-2 mt-2 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-left text-red-600 transition-colors hover:bg-red-50"
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
