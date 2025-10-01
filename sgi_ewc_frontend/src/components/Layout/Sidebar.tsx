import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Truck, 
  Wrench, 
  ClipboardList, 
  Settings, 
  Users, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Ticket,
  HardHat,
  Zap,
  AlertCircle
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const hasAreaAccess = (area: string) => user?.isAdmin || user?.areas?.includes(area);

  // Catálogo global de vistas (ids en kebab-case igual que en App.tsx)
  const viewsCatalog = {
    dashboard: { id: 'dashboard', label: 'Dashboard', icon: Truck, show: () => true },
    tickets: { id: 'tickets', label: 'Sistema de Tickets', icon: Ticket, show: () => true },
    'trip-reports': { id: 'trip-reports', label: 'Reportes de Viajes', icon: Truck, show: () => hasAreaAccess('Transporte') },
    'route-management': { id: 'route-management', label: 'Gestión de Rutas', icon: ClipboardList, show: () => hasAreaAccess('Transporte') },
    'fleet-registry': { id: 'fleet-registry', label: 'Registro de Flota', icon: Wrench, show: () => hasAreaAccess('Transporte') },
    'fuel-by-fleet': { id: 'fuel-by-fleet', label: 'Combustible por Flota', icon: Zap, show: () => hasAreaAccess('Transporte') },
    'notifications': { id: 'notifications', label: 'Notificaciones', icon: AlertCircle, show: () => true },
    maintenance: { id: 'maintenance', label: 'Mantenimiento', icon: Settings, show: () => hasAreaAccess('Taller') },
    'cleaning-reports': { id: 'cleaning-reports', label: 'Aseo', icon: HardHat, show: () => hasAreaAccess('Aseo') },
    'civil-works': { id: 'civil-works', label: 'Obras Civiles', icon: HardHat, show: () => hasAreaAccess('Obras') },
    incidents: { id: 'incidents', label: 'Incidentes', icon: AlertCircle, show: () => true },
    'user-management': { id: 'user-management', label: 'Gestión de Usuarios', icon: Users, show: () => hasAreaAccess('Admin') || hasAreaAccess('RRHH') },
  // Configuración se accede desde el menú del usuario en el Header para no duplicar navegación
  // settings: { id: 'settings', label: 'Configuración', icon: Settings, show: () => true },
  };

  const handleLogout = () => {
    logout();
  };

  const roleLabel = user?.roles?.includes('Admin') ? 'Admin' : user?.roles?.[0] ?? 'Usuario';

  // Lógica simplificada: iterar sobre todas las vistas posibles y usar su propia condición `show()` para decidir si se renderiza.
  const visibleItemsUnique = Object.values(viewsCatalog).filter(item => item.show());

  let navContent: React.ReactNode = null;

  if (isCollapsed) {
    navContent = visibleItemsUnique.map(item => {
      const Icon = item.icon;
      const isActive = currentPage === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onPageChange(item.id)}
          className={`flex items-center justify-center w-full h-10 my-2 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
          title={item.label}
        >
          <Icon className="w-5 h-5" />
        </button>
      );
    });
  } else {
    // Vista expandida: lista plana de items visibles (sin secciones)
    navContent = visibleItemsUnique.map(item => {
      const Icon = item.icon;
      const isActive = currentPage === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onPageChange(item.id)}
          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          <Icon className="flex-shrink-0 w-5 h-5" />
          <span className="font-medium">{item.label}</span>
        </button>
      );
    });
  }

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">EmpresaSystem</h1>
                <p className="text-xs text-gray-400">Empresarial</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 transition-colors rounded-lg hover:bg-gray-700"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
              <span className="text-sm font-medium">{user?.username.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-gray-400 truncate">{roleLabel}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-auto">{navContent}</nav>

      {/* Logout */}
      <div className="py-4 bg-gray-900 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 space-x-3 text-gray-300 transition-colors rounded-none hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="flex-shrink-0 w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
