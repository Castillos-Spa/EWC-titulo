import React, { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  // Common
  'common.save': 'Guardar',
  'common.cancel': 'Cancelar',
  'common.edit': 'Editar',
  'common.delete': 'Eliminar',
  'common.add': 'Agregar',
  'common.search': 'Buscar',
  'common.filter': 'Filtrar',
  'common.status': 'Estado',
  'common.actions': 'Acciones',
  'common.date': 'Fecha',
  'common.time': 'Hora',
  'common.description': 'Descripción',
  'common.priority': 'Prioridad',
  'common.category': 'Categoría',
  'common.loading': 'Cargando...',
  'common.submit': 'Enviar',
  'common.close': 'Cerrar',
  'common.view': 'Ver',
  'common.details': 'Detalles',
  'common.viewDetails': 'Ver Detalles',
  'common.name': 'Nombre',
  'common.email': 'Correo Electrónico',
  'common.role': 'Rol',
  'common.area': 'Área',
  'common.active': 'Activo',
  'common.inactive': 'Inactivo',
  'common.all': 'Todos',
  'common.yes': 'Sí',
  'common.no': 'No',
  'common.confirm': 'Confirmar',
  
  // Login
  'login.title': 'Iniciar Sesión',
  'login.subtitle': 'Sistema de Gestión Empresarial',
  'login.email': 'Correo Electrónico',
  'login.password': 'Contraseña',
  'login.signIn': 'Iniciar Sesión',
  'login.signingIn': 'Iniciando Sesión...',
  'login.demoAccounts': 'Cuentas de Demostración',
  'login.invalidCredentials': 'Credenciales inválidas',
  
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
  
  // Dashboard
  'dashboard.welcome': 'Bienvenido',
  
  // Tickets
  'tickets.title': 'Sistema de Tickets',
  'tickets.subtitle': 'Gestiona solicitudes de soporte y seguimiento de tareas',
  'tickets.newTicket': 'Nuevo Ticket',
  'tickets.createNew': 'Crear Nuevo Ticket',
  'tickets.submitRequest': 'Envía una nueva solicitud de soporte o ticket',
  'tickets.title_field': 'Título',
  'tickets.category': 'Categoría',
  'tickets.priority': 'Prioridad',
  'tickets.description': 'Descripción',
  'tickets.attachments': 'Adjuntos',
  'tickets.totalTickets': 'Total Tickets',
  'tickets.pending': 'Pendientes',
  'tickets.inProgress': 'En Progreso',
  'tickets.resolved': 'Resueltos',
  
  // Maintenance
  'maintenance.title': 'Gestión de Mantenimiento',
  'maintenance.subtitle': 'Programa y gestiona mantenimientos de vehículos',
  'maintenance.newMaintenance': 'Nuevo Mantenimiento',
  'maintenance.vehicle': 'Vehículo',
  'maintenance.type': 'Tipo',
  'maintenance.technician': 'Técnico',
  'maintenance.cost': 'Costo',
  'maintenance.totalCost': 'Costo Total',
  'maintenance.partsUsed': 'Repuestos Utilizados',
  'maintenance.preventive': 'Preventivo',
  'maintenance.corrective': 'Correctivo',
  'maintenance.emergency': 'Emergencia',
  'maintenance.scheduled': 'Programados',
  'maintenance.completed': 'Completados',
  'maintenance.overdue': 'Vencidos',
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};