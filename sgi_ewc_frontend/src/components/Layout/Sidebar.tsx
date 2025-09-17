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
  Zap
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onPageChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openArea, setOpenArea] = useState<string | null>(null);
  const { user, logout } = useAuth();

  const hasRole = (role: string) => user?.roles?.some(r => r.toLowerCase() === role);

  const groupedMenu = [
    {
      area: 'Water Transport',
      items: [
        { id: 'trip-reports', label: 'Reportes de Viajes', icon: Truck, show: hasRole('admin') || hasRole('transport_supervisor') || hasRole('driver') },
        { id: 'route-management', label: 'Gestión de Rutas', icon: ClipboardList, show: hasRole('admin') || hasRole('transport_supervisor') },
        { id: 'fleet-registry', label: 'Registro de Flota', icon: Wrench, show: hasRole('admin') || hasRole('transport_supervisor') },
        { id: 'maintenance', label: 'Mantenimiento', icon: Settings, show: hasRole('admin') || hasRole('transport_supervisor') },
      ],
    },
    {
      area: 'General Services',
      items: [
        { id: 'cleaning-reports', label: 'Reportes de Limpieza', icon: HardHat, show: hasRole('admin') || hasRole('general_services') || hasRole('cleaning') },
        { id: 'civil-works', label: 'Obras Civiles', icon: HardHat, show: hasRole('admin') || hasRole('general_services') || hasRole('civil_works') },
      ],
    },
    {
      area: 'IT',
      items: [
        { id: 'tickets', label: 'Sistema de Tickets', icon: Ticket, show: hasRole('admin') || hasRole('it_staff') || user?.area !== 'admin' },
      ],
    },
    {
      area: 'Admin',
      items: [
        { id: 'user-management', label: 'Gestión de Usuarios', icon: Users, show: hasRole('admin') },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
  };

  const roleLabel = user?.roles?.[0]?.replace('_', ' ') ?? '';
  const isAdmin = hasRole('admin');

  // Filtra el área del usuario (para no-admin)
  const userAreaSection = groupedMenu.find(section => section.area.replace(' ', '_').toLowerCase() === user?.area?.replace(' ', '_').toLowerCase());

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
      <nav className="flex-1 p-4 space-y-2 overflow-auto">
        {isCollapsed ? (
          // Sidebar colapsado: solo íconos de todos los ítems visibles (admin ve todos, otros solo su área)
          isAdmin
            ? groupedMenu.flatMap(section =>
                section.items.filter(item => item.show).map(item => {
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
                })
              )
            : userAreaSection &&
              userAreaSection.items.filter(item => item.show).map(item => {
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
              })
        ) : (
          // Sidebar extendido: agrupado y con dropdowns para admin, área única para otros
          isAdmin
            ? groupedMenu.map(section => {
                const visibleItems = section.items.filter(item => item.show);
                if (visibleItems.length === 0) return null;
                const isOpen = openArea === section.area;
                return (
                  <div key={section.area}>
                    <button
                      className="flex items-center justify-between w-full px-3 py-2 font-semibold text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white"
                      onClick={() => setOpenArea(isOpen ? null : section.area)}
                    >
                      <span>{section.area}</span>
                      {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="pl-4">
                        {visibleItems.map(item => {
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
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            : userAreaSection &&
              userAreaSection.items.filter(item => item.show).map(item => {
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
              })
        )}
      </nav>

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