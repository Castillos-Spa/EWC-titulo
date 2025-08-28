import React, { useState } from 'react';
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

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
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
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Route Management</h2>
              <p className="text-gray-600 mb-4">
                This module would contain route assignment, driver notifications, and GPS tracking features.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800 text-sm">
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
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={getPageTitle(currentPage)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
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