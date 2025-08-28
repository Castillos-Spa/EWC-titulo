import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextType {
  language: 'en' | 'es';
  setLanguage: (lang: 'en' | 'es') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.tripReports': 'Trip Reports',
    'nav.routeManagement': 'Route Management',
    'nav.fleetRegistry': 'Fleet Registry',
    'nav.maintenance': 'Maintenance',
    'nav.cleaningReports': 'Cleaning Reports',
    'nav.civilWorks': 'Civil Works',
    'nav.tickets': 'Ticket System',
    'nav.userManagement': 'User Management',
    'nav.logout': 'Logout',
    
    // Common
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.loading': 'Loading...',
    'common.date': 'Date',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.viewDetails': 'View Details',
    'common.noResults': 'No results found',
    
    // Login
    'login.title': 'Enterprise System',
    'login.subtitle': 'Sign in to your account',
    'login.email': 'Email Address',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.demoAccounts': 'Demo Accounts:',
    'login.invalidCredentials': 'Invalid credentials. Try any email from the demo with password: password123',
    
    // Dashboard
    'dashboard.welcome': 'Welcome back',
    'dashboard.systemOverview': 'System overview and management tools',
    'dashboard.monitorFleet': 'Monitor your fleet and operations',
    'dashboard.drivingPerformance': 'Your driving performance and assignments',
    'dashboard.supportTickets': 'Support tickets and system status',
    'dashboard.dailyTasks': 'Your daily tasks and progress',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.quickActions': 'Quick Actions',
    
    // Tickets
    'tickets.title': 'Ticket System',
    'tickets.subtitle': 'Manage support tickets and requests across all areas',
    'tickets.newTicket': 'New Ticket',
    'tickets.totalTickets': 'Total Tickets',
    'tickets.pending': 'Pending',
    'tickets.inProgress': 'In Progress',
    'tickets.resolved': 'Resolved',
    'tickets.closed': 'Closed',
    'tickets.createNew': 'Create New Ticket',
    'tickets.submitRequest': 'Submit a new support ticket or request',
    'tickets.title_field': 'Title',
    'tickets.category': 'Category',
    'tickets.priority': 'Priority',
    'tickets.description': 'Description',
    'tickets.attachments': 'Attachments',
    'tickets.assignedTo': 'Assigned to',
    'tickets.createdBy': 'Created by',
    'tickets.comments': 'Comments',
    'tickets.addComment': 'Add Comment',
    'tickets.changeStatus': 'Change Status',
    'tickets.assignTicket': 'Assign Ticket',
    
    // Fleet
    'fleet.title': 'Fleet Registry',
    'fleet.subtitle': 'Manage all company vehicles and their assignments',
    'fleet.addVehicle': 'Add Vehicle',
    'fleet.totalVehicles': 'Total Vehicles',
    'fleet.active': 'Active',
    'fleet.inMaintenance': 'In Maintenance',
    'fleet.maintenanceDue': 'Maintenance Due',
    'fleet.plateNumber': 'Plate Number',
    'fleet.brand': 'Brand',
    'fleet.model': 'Model',
    'fleet.year': 'Year',
    'fleet.mileage': 'Mileage',
    'fleet.assignedArea': 'Assigned Area',
    'fleet.assignedDriver': 'Assigned Driver',
    'fleet.nextMaintenance': 'Next Maintenance',
    'fleet.scheduleMaintenance': 'Schedule Maintenance',
    
    // Maintenance
    'maintenance.title': 'Maintenance Management',
    'maintenance.subtitle': 'Track and manage vehicle maintenance activities',
    'maintenance.newMaintenance': 'New Maintenance',
    'maintenance.scheduled': 'Scheduled',
    'maintenance.completed': 'Completed',
    'maintenance.overdue': 'Overdue',
    'maintenance.totalCost': 'Total Cost',
    'maintenance.type': 'Type',
    'maintenance.vehicle': 'Vehicle',
    'maintenance.cost': 'Cost',
    'maintenance.technician': 'Technician',
    'maintenance.partsUsed': 'Parts Used',
    'maintenance.preventive': 'Preventive',
    'maintenance.corrective': 'Corrective',
    'maintenance.emergency': 'Emergency',
  },
  es: {
    // Navigation
    'nav.dashboard': 'Panel Principal',
    'nav.tripReports': 'Reportes de Viajes',
    'nav.routeManagement': 'Gestión de Rutas',
    'nav.fleetRegistry': 'Registro de Flota',
    'nav.maintenance': 'Mantenimiento',
    'nav.cleaningReports': 'Reportes de Limpieza',
    'nav.civilWorks': 'Obras Civiles',
    'nav.tickets': 'Sistema de Tickets',
    'nav.userManagement': 'Gestión de Usuarios',
    'nav.logout': 'Cerrar Sesión',
    
    // Common
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.add': 'Agregar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.submit': 'Enviar',
    'common.loading': 'Cargando...',
    'common.date': 'Fecha',
    'common.status': 'Estado',
    'common.actions': 'Acciones',
    'common.viewDetails': 'Ver Detalles',
    'common.noResults': 'No se encontraron resultados',
    
    // Login
    'login.title': 'Sistema Empresarial',
    'login.subtitle': 'Inicia sesión en tu cuenta',
    'login.email': 'Correo Electrónico',
    'login.password': 'Contraseña',
    'login.signIn': 'Iniciar Sesión',
    'login.signingIn': 'Iniciando sesión...',
    'login.demoAccounts': 'Cuentas de Demostración:',
    'login.invalidCredentials': 'Credenciales inválidas. Prueba cualquier email de la demo con contraseña: password123',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido de nuevo',
    'dashboard.systemOverview': 'Resumen del sistema y herramientas de gestión',
    'dashboard.monitorFleet': 'Monitorea tu flota y operaciones',
    'dashboard.drivingPerformance': 'Tu rendimiento de conducción y asignaciones',
    'dashboard.supportTickets': 'Tickets de soporte y estado del sistema',
    'dashboard.dailyTasks': 'Tus tareas diarias y progreso',
    'dashboard.recentActivity': 'Actividad Reciente',
    'dashboard.quickActions': 'Acciones Rápidas',
    
    // Tickets
    'tickets.title': 'Sistema de Tickets',
    'tickets.subtitle': 'Gestiona tickets de soporte y solicitudes de todas las áreas',
    'tickets.newTicket': 'Nuevo Ticket',
    'tickets.totalTickets': 'Total de Tickets',
    'tickets.pending': 'Pendientes',
    'tickets.inProgress': 'En Progreso',
    'tickets.resolved': 'Resueltos',
    'tickets.closed': 'Cerrados',
    'tickets.createNew': 'Crear Nuevo Ticket',
    'tickets.submitRequest': 'Envía un nuevo ticket de soporte o solicitud',
    'tickets.title_field': 'Título',
    'tickets.category': 'Categoría',
    'tickets.priority': 'Prioridad',
    'tickets.description': 'Descripción',
    'tickets.attachments': 'Adjuntos',
    'tickets.assignedTo': 'Asignado a',
    'tickets.createdBy': 'Creado por',
    'tickets.comments': 'Comentarios',
    'tickets.addComment': 'Agregar Comentario',
    'tickets.changeStatus': 'Cambiar Estado',
    'tickets.assignTicket': 'Asignar Ticket',
    
    // Fleet
    'fleet.title': 'Registro de Flota',
    'fleet.subtitle': 'Gestiona todos los vehículos de la empresa y sus asignaciones',
    'fleet.addVehicle': 'Agregar Vehículo',
    'fleet.totalVehicles': 'Total de Vehículos',
    'fleet.active': 'Activos',
    'fleet.inMaintenance': 'En Mantenimiento',
    'fleet.maintenanceDue': 'Mantenimiento Pendiente',
    'fleet.plateNumber': 'Número de Placa',
    'fleet.brand': 'Marca',
    'fleet.model': 'Modelo',
    'fleet.year': 'Año',
    'fleet.mileage': 'Kilometraje',
    'fleet.assignedArea': 'Área Asignada',
    'fleet.assignedDriver': 'Conductor Asignado',
    'fleet.nextMaintenance': 'Próximo Mantenimiento',
    'fleet.scheduleMaintenance': 'Programar Mantenimiento',
    
    // Maintenance
    'maintenance.title': 'Gestión de Mantenimiento',
    'maintenance.subtitle': 'Rastrea y gestiona las actividades de mantenimiento de vehículos',
    'maintenance.newMaintenance': 'Nuevo Mantenimiento',
    'maintenance.scheduled': 'Programados',
    'maintenance.completed': 'Completados',
    'maintenance.overdue': 'Vencidos',
    'maintenance.totalCost': 'Costo Total',
    'maintenance.type': 'Tipo',
    'maintenance.vehicle': 'Vehículo',
    'maintenance.cost': 'Costo',
    'maintenance.technician': 'Técnico',
    'maintenance.partsUsed': 'Repuestos Utilizados',
    'maintenance.preventive': 'Preventivo',
    'maintenance.corrective': 'Correctivo',
    'maintenance.emergency': 'Emergencia',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'es';
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: 'en' | 'es') => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};