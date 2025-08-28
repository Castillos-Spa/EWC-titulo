import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Truck, 
  Wrench, 
  ClipboardList, 
  Settings, 
  Users, 
  Home,
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
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: t('nav.dashboard'), icon: Home, show: true },
    ];

    const roleBasedItems = [
      // Water Transport
      { id: 'trip-reports', label: t('nav.tripReports'), icon: Truck, show: ['admin', 'transport_supervisor', 'driver'].includes(user?.role || '') },
      { id: 'route-management', label: t('nav.routeManagement'), icon: ClipboardList, show: ['admin', 'transport_supervisor'].includes(user?.role || '') },
      { id: 'fleet-registry', label: t('nav.fleetRegistry'), icon: Wrench, show: ['admin', 'transport_supervisor'].includes(user?.role || '') },
      { id: 'maintenance', label: t('nav.maintenance'), icon: Settings, show: ['admin', 'transport_supervisor'].includes(user?.role || '') },
      
      // General Services
      { id: 'cleaning-reports', label: t('nav.cleaningReports'), icon: HardHat, show: ['admin', 'general_services', 'cleaning'].includes(user?.role || '') },
      { id: 'civil-works', label: t('nav.civilWorks'), icon: HardHat, show: ['admin', 'general_services', 'civil_works'].includes(user?.role || '') },
      
      // IT
      { id: 'tickets', label: t('nav.tickets'), icon: Ticket, show: ['admin', 'it_staff'].includes(user?.role || '') || user?.area !== 'admin' },
      
      // Admin
      { id: 'user-management', label: t('nav.userManagement'), icon: Users, show: user?.role === 'admin' },
    ];

    return [...baseItems, ...roleBasedItems.filter(item => item.show)];
  };

  const handleLogout = () => {
    logout();
  };

  const menuItems = getMenuItems();

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen flex flex-col`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Sistema</h1>
                <p className="text-xs text-gray-400">Empresarial</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">{user?.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
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
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;