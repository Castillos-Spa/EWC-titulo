import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Login from './components/Login';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import DashboardHome from './components/Dashboard/DashboardHome';
import TripReports from './components/WaterTransport/TripReports';
import FleetRegistry from './components/WaterTransport/FleetRegistry';
import MaintenanceManagement from './components/WaterTransport/MaintenanceManagement';
import EnhancedTicketSystem from './components/Tickets/EnhancedTicketSystem';
import CleaningReports from './components/GeneralServices/CleaningReports';
import CivilWorks from './components/GeneralServices/CivilWorks';
import UserManagement from './components/Admin/UserManagement';
import ChangePasswordModal from './components/ChangePasswordModal';
import { changePassword as apiChangePassword } from './utils/userApi';

const AppContent: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    // Debug visual para ver el valor de user y mustChangePassword
    console.log('Auth user:', user);
    setShowChangePassword(!!user?.mustChangePassword);
  }, [user?.mustChangePassword]);

  // Escucha el evento de logout forzado desde el interceptor de la API
  useEffect(() => {
    const handleForceLogout = () => {
      console.log("Force logout event received. Logging out...");
      logout();
    };

    window.addEventListener('force-logout', handleForceLogout);

    return () => {
      window.removeEventListener('force-logout', handleForceLogout);
    };
  }, [logout]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Debug visual en pantalla para ver el valor de mustChangePassword
  if (user?.mustChangePassword) {
    console.log('El usuario debe cambiar la contraseña, se fuerza el modal.');
  }

  const getPageTitle = (page: string) => {
    switch (page) {
      case 'dashboard': return 'Dashboard';
      case 'trip-reports': return 'Trip Reports';
      case 'route-management': return 'Route Management';
      case 'fleet-registry': return 'Fleet Registry';
      case 'maintenance': return 'Maintenance Management';
      case 'cleaning-reports': return 'Cleaning Reports';
      case 'civil-works': return 'Civil Works Reports';
      case 'tickets': return 'Ticket System';
      case 'user-management': return 'User Management';
      default: return 'Dashboard';
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardHome />;
      case 'trip-reports':
        return <TripReports />;
      case 'fleet-registry':
        return <FleetRegistry />;
      case 'maintenance':
        return <MaintenanceManagement />;
      case 'cleaning-reports':
        return <CleaningReports />;
      case 'civil-works':
        return <CivilWorks />;
      case 'tickets':
        return <EnhancedTicketSystem />;
      case 'user-management':
        return <UserManagement />;
      case 'route-management':
        return (
          <div className="space-y-6">
            <div className="p-8 text-center bg-white border border-gray-200 rounded-lg shadow-sm">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Route Management</h2>
              <p className="mb-4 text-gray-600">
                This module would contain route assignment, driver notifications, and GPS tracking features.
              </p>
              <div className="p-4 rounded-lg bg-blue-50">
                <p className="text-sm text-blue-800">
                  Feature coming soon: Real-time route optimization, driver assignments, and automated notifications.
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title={getPageTitle(currentPage)} />
        
        <main className="flex-1 p-6 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {showChangePassword && (
        <ChangePasswordModal
          onSubmit={async (newPassword: string) => {
            await apiChangePassword(user.id, newPassword);
            logout();
            setShowChangePassword(false);
          }}
          onCancel={() => {
            logout();
            setShowChangePassword(false);
          }}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
};

export default App;