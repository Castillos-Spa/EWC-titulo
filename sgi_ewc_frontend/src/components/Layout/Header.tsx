import React, { useState, useRef, useEffect } from 'react';
import { Bell, Search, MessageSquare, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

interface HeaderProps {
  title: string;
  onProfileClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onProfileClick }) => {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [messageCount, setMessageCount] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io('http://localhost:3000', {
      transports: ['websocket'],
      query: { userId: user?.id },
    });

    socketRef.current = socket;

    // Escuchar notificaciones
    socket.on('notification', (data: any) => {
      console.log('Notificación recibida:', data);

      const newNotif: Notification = {
        id: Date.now().toString(),
        type: data.type || 'info',
        message: data.message || 'Nueva notificación',
        timestamp: new Date().toLocaleTimeString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
    });

    // Escuchar mensajes (chat)
    socket.on('message', (data: any) => {
      console.log('Mensaje recibido:', data);
      setMessageCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

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
    const titleMap: { [key: string]: string } = {
      Dashboard: 'Panel Principal',
      'Trip Reports': 'Reportes de Viajes',
      'Route Management': 'Gestión de Rutas',
      'Fleet Registry': 'Registro de Flota',
      'Maintenance Management': 'Gestión de Mantenimiento',
      'Cleaning Reports': 'Reportes de Limpieza',
      'Civil Works Reports': 'Reportes de Obras Civiles',
      'Ticket System': 'Sistema de Tickets',
      'User Management': 'Gestión de Usuarios',
    };
    return titleMap[title] || title;
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
              {notifications.length > 0 && (
                <span className="absolute flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full -top-1 -right-1">
                  {notifications.length}
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
                      key={notif.id}
                      className="px-4 py-3 border-b cursor-pointer hover:bg-gray-50 last:border-b-0"
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
                <p className="text-xs text-gray-500">{user?.roles?.[0] || 'Usuario'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 z-50 w-56 py-2 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                  <p className="text-xs text-gray-500">{user?.roles?.[0] || 'Usuario'}</p>
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
