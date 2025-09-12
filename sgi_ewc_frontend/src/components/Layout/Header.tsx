import React from 'react';
import { Bell, Search, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user } = useAuth();

  const getTitle = (title: string) => {
    const titleMap: { [key: string]: string } = {
      'Dashboard': 'Panel Principal',
      'Trip Reports': 'Reportes de Viajes',
      'Route Management': 'Gestión de Rutas',
      'Fleet Registry': 'Registro de Flota',
      'Maintenance Management': 'Gestión de Mantenimiento',
      'Cleaning Reports': 'Reportes de Limpieza',
      'Civil Works Reports': 'Reportes de Obras Civiles',
      'Ticket System': 'Sistema de Tickets',
      'User Management': 'Gestión de Usuarios'
    };
    return titleMap[title] || title;
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{getTitle(title)}</h1>
          <p className="text-sm text-gray-600">Bienvenido, {user?.name}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar"
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
          
          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          
          {/* Messages */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              2
            </span>
          </button>
          
          {/* Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">{user?.name.charAt(0)}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;