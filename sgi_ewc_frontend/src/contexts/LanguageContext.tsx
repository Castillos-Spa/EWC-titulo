import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, useCallback } from 'react';

// Tipado explícito para evitar TS7053 al indexar con string
export type Languages = 'en' | 'es' | 'pt';

type LanguageContextType = {
  t: (key: string) => string;
  language: Languages;
  setLanguage: React.Dispatch<React.SetStateAction<Languages>>;
};

const translations: Record<Languages, Record<string, string>> = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.description': 'Description',
    'common.priority': 'Priority',
    'common.category': 'Category',
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.close': 'Close',
    'common.view': 'View',
    'common.details': 'Details',
    'common.viewDetails': 'View Details',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.role': 'Role',
    'common.area': 'Area',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.all': 'All',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',
    
    // Login
    'login.title': 'Login',
    'login.subtitle': 'Business Management System',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing In...',
    'login.demoAccounts': 'Demo Accounts',
    'login.invalidCredentials': 'Invalid credentials',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.tripReports': 'Trip Reports',
    'nav.routeManagement': 'Route Management',
    'nav.fleetRegistry': 'Fleet Registry',
    'nav.maintenance': 'Maintenance',
    'nav.cleaningReports': 'Cleaning Reports',
    'nav.civilWorks': 'Civil Works',
    'nav.tickets': 'Ticket System',
  'nav.notifications': 'Notifications',
  'nav.fuel': 'Fuel',
  'nav.routes': 'Routes',
  'nav.assignments': 'Route Assignments',
  'nav.incidents': 'Incidents',
    'nav.userManagement': 'User Management',
    'nav.logout': 'Logout',
  'sidebar.logout': 'Log Out',
  'sidebar.sessionActive': 'Active session',
  'sidebar.brandSubtitle': 'Operations',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    
    // Tickets
    'tickets.title': 'Ticket System',
    'tickets.subtitle': 'Manage support requests and task tracking',
    'tickets.newTicket': 'New Ticket',
    'tickets.createNew': 'Create New Ticket',
    'tickets.submitRequest': 'Submit a new support request or ticket',
    'tickets.title_field': 'Title',
    'tickets.category': 'Category',
    'tickets.priority': 'Priority',
    'tickets.description': 'Description',
    'tickets.attachments': 'Attachments',
    'tickets.totalTickets': 'Total Tickets',
    'tickets.pending': 'Pending',
    'tickets.inProgress': 'In Progress',
    'tickets.resolved': 'Resolved',
    
    // Maintenance
    'maintenance.title': 'Maintenance Management',
    'maintenance.subtitle': 'Schedule and manage vehicle maintenance',
    'maintenance.newMaintenance': 'New Maintenance',
    'maintenance.vehicle': 'Vehicle',
    'maintenance.type': 'Type',
    'maintenance.technician': 'Technician',
    'maintenance.cost': 'Cost',
    'maintenance.totalCost': 'Total Cost',
    'maintenance.partsUsed': 'Parts Used',
    'maintenance.preventive': 'Preventive',
    'maintenance.corrective': 'Corrective',
    'maintenance.emergency': 'Emergency',
    'maintenance.scheduled': 'Scheduled',
    'maintenance.completed': 'Completed',
    'maintenance.overdue': 'Overdue',
  },
  es: {
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
  'nav.notifications': 'Notificaciones',
  'nav.fuel': 'Combustible',
  'nav.routes': 'Rutas',
  'nav.assignments': 'Asignación Rutas',
  'nav.incidents': 'Incidentes',
    'nav.userManagement': 'Gestión de Usuarios',
    'nav.logout': 'Cerrar Sesión',
  'sidebar.logout': 'Cerrar Sesión',
  'sidebar.sessionActive': 'Sesión activa',
  'sidebar.brandSubtitle': 'Operaciones',
    
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
  },
  pt: {
    // Common
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.add': 'Adicionar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.status': 'Status',
    'common.actions': 'Ações',
    'common.date': 'Data',
    'common.time': 'Hora',
    'common.description': 'Descrição',
    'common.priority': 'Prioridade',
    'common.category': 'Categoria',
    'common.loading': 'Carregando...',
    'common.submit': 'Enviar',
    'common.close': 'Fechar',
    'common.view': 'Ver',
    'common.details': 'Detalhes',
    'common.viewDetails': 'Ver Detalhes',
    'common.name': 'Nome',
    'common.email': 'E-mail',
    'common.role': 'Função',
    'common.area': 'Área',
    'common.active': 'Ativo',
    'common.inactive': 'Inativo',
    'common.all': 'Todos',
    'common.yes': 'Sim',
    'common.no': 'Não',
    'common.confirm': 'Confirmar',

    // Login
    'login.title': 'Acessar',
    'login.subtitle': 'Sistema de Gestão Empresarial',
    'login.email': 'E-mail',
    'login.password': 'Senha',
    'login.signIn': 'Entrar',
    'login.signingIn': 'Entrando...',
    'login.demoAccounts': 'Contas de Demonstração',
    'login.invalidCredentials': 'Credenciais inválidas',

    // Navigation
    'nav.dashboard': 'Painel',
    'nav.tripReports': 'Relatórios de Viagem',
    'nav.routeManagement': 'Gestão de Rotas',
    'nav.fleetRegistry': 'Registro de Frotas',
    'nav.maintenance': 'Manutenção',
    'nav.cleaningReports': 'Relatórios de Limpeza',
    'nav.civilWorks': 'Obras Civis',
    'nav.tickets': 'Sistema de Chamados',
    'nav.notifications': 'Notificações',
    'nav.fuel': 'Combustível',
    'nav.routes': 'Rotas',
    'nav.assignments': 'Designações de Rotas',
    'nav.incidents': 'Incidentes',
    'nav.userManagement': 'Gestão de Usuários',
    'nav.logout': 'Sair',
    'sidebar.logout': 'Encerrar sessão',
    'sidebar.sessionActive': 'Sessão ativa',
    'sidebar.brandSubtitle': 'Operações',

    // Dashboard
    'dashboard.welcome': 'Bem-vindo',

    // Tickets
    'tickets.title': 'Sistema de Chamados',
    'tickets.subtitle': 'Gerencie solicitações de suporte e acompanhamento de tarefas',
    'tickets.newTicket': 'Novo Chamado',
    'tickets.createNew': 'Criar Novo Chamado',
    'tickets.submitRequest': 'Envie uma nova solicitação de suporte ou chamado',
    'tickets.title_field': 'Título',
    'tickets.category': 'Categoria',
    'tickets.priority': 'Prioridade',
    'tickets.description': 'Descrição',
    'tickets.attachments': 'Anexos',
    'tickets.totalTickets': 'Total de Chamados',
    'tickets.pending': 'Pendentes',
    'tickets.inProgress': 'Em Andamento',
    'tickets.resolved': 'Resolvidos',

    // Maintenance
    'maintenance.title': 'Gestão de Manutenção',
    'maintenance.subtitle': 'Agende e gerencie a manutenção da frota',
    'maintenance.newMaintenance': 'Nova Manutenção',
    'maintenance.vehicle': 'Veículo',
    'maintenance.type': 'Tipo',
    'maintenance.technician': 'Técnico',
    'maintenance.cost': 'Custo',
    'maintenance.totalCost': 'Custo Total',
    'maintenance.partsUsed': 'Peças Utilizadas',
    'maintenance.preventive': 'Preventiva',
    'maintenance.corrective': 'Corretiva',
    'maintenance.emergency': 'Emergencial',
    'maintenance.scheduled': 'Programada',
    'maintenance.completed': 'Concluída',
    'maintenance.overdue': 'Atrasada',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Languages>('es');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Languages | null;
    if (savedLanguage && ['en', 'es', 'pt'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Persistir cambios de idioma
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = useCallback((key: string) => translations[language][key] ?? key, [language]);

  const value = useMemo(() => ({ t, language, setLanguage }), [t, language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};