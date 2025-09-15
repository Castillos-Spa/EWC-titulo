export interface User {
  id: string;
  name: string;
  email: string;
  role: 'driver' | 'supervisor' | 'technician' | 'admin' | 'cleaning_crew' | 'civil_works' | 'it_support' | 'manager' | 'finance';
  areaIds: string[];
  department: 'transport' | 'cleaning' | 'civil_works' | 'it' | 'management' | 'finance';
  vehicleIds?: string[];
  permissions: string[];
  avatar?: string;
  phone?: string;
  employeeId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

class AuthServiceClass {
  // Base de datos simulada de usuarios
  private users: (User & { password: string })[] = [
    // Conductores
    {
      id: 'user-001',
      name: 'Juan Pérez',
      email: 'juan.perez@empresa.com',
      password: '123456',
      role: 'driver',
      department: 'transport',
      areaIds: ['area-norte', 'area-centro'],
      vehicleIds: ['truck-001', 'truck-002'],
      permissions: ['view_routes', 'update_trips', 'create_fuel_records', 'create_incidents'],
      phone: '+54 11 1234-5678',
      employeeId: 'EMP-001',
    },
    {
      id: 'user-002',
      name: 'María González',
      email: 'maria.gonzalez@empresa.com',
      password: '123456',
      role: 'driver',
      department: 'transport',
      areaIds: ['area-sur', 'area-oeste'],
      vehicleIds: ['truck-003'],
      permissions: ['view_routes', 'update_trips', 'create_fuel_records', 'create_incidents'],
      phone: '+54 11 2345-6789',
      employeeId: 'EMP-002',
    },
    {
      id: 'user-003',
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@empresa.com',
      password: '123456',
      role: 'driver',
      department: 'transport',
      areaIds: ['area-este'],
      vehicleIds: ['truck-004', 'truck-005'],
      permissions: ['view_routes', 'update_trips', 'create_fuel_records', 'create_incidents'],
      phone: '+54 11 3456-7890',
      employeeId: 'EMP-003',
    },

    // Personal de Aseo
    {
      id: 'user-009',
      name: 'Rosa Martínez',
      email: 'rosa.martinez@empresa.com',
      password: '123456',
      role: 'cleaning_crew',
      department: 'cleaning',
      areaIds: ['area-oficinas', 'area-baños'],
      permissions: ['view_cleaning_tasks', 'create_daily_reports', 'request_supplies', 'report_incidents'],
      phone: '+54 11 9012-3456',
      employeeId: 'ASE-001',
    },
    {
      id: 'user-010',
      name: 'Carmen López',
      email: 'carmen.lopez@empresa.com',
      password: '123456',
      role: 'cleaning_crew',
      department: 'cleaning',
      areaIds: ['area-almacenes', 'area-exteriores'],
      permissions: ['view_cleaning_tasks', 'create_daily_reports', 'request_supplies', 'report_incidents'],
      phone: '+54 11 0123-4567',
      employeeId: 'ASE-002',
    },

    // Obras Civiles Menores
    {
      id: 'user-011',
      name: 'Miguel Rodríguez',
      email: 'miguel.rodriguez@empresa.com',
      password: '123456',
      role: 'civil_works',
      department: 'civil_works',
      areaIds: ['area-construccion', 'area-mantenimiento'],
      permissions: ['view_work_orders', 'update_work_progress', 'manage_materials', 'safety_checklist'],
      phone: '+54 11 1234-5678',
      employeeId: 'OCM-001',
    },
    {
      id: 'user-012',
      name: 'Fernando Silva',
      email: 'fernando.silva@empresa.com',
      password: '123456',
      role: 'civil_works',
      department: 'civil_works',
      areaIds: ['area-infraestructura'],
      permissions: ['view_work_orders', 'update_work_progress', 'manage_materials', 'safety_checklist'],
      phone: '+54 11 2345-6789',
      employeeId: 'OCM-002',
    },

    // Área TIC
    {
      id: 'user-013',
      name: 'Andrea González',
      email: 'andrea.gonzalez@empresa.com',
      password: '123456',
      role: 'it_support',
      department: 'it',
      areaIds: ['area-sistemas', 'area-redes'],
      permissions: ['manage_it_tickets', 'chat_support', 'system_admin', 'user_management'],
      phone: '+54 11 3456-7890',
      employeeId: 'TIC-001',
    },

    // Gerencia
    {
      id: 'user-014',
      name: 'Wilson Castillo',
      email: 'wilson.castillo@empresa.com',
      password: '123456',
      role: 'manager',
      department: 'management',
      areaIds: ['all'],
      permissions: ['view_all', 'approve_all', 'manage_all', 'financial_approval', 'strategic_decisions'],
      phone: '+54 11 4567-8901',
      employeeId: 'GER-001',
    },

    // Finanzas
    {
      id: 'user-015',
      name: 'Laura Financiera',
      email: 'laura.financiera@empresa.com',
      password: '123456',
      role: 'finance',
      department: 'finance',
      areaIds: ['area-finanzas'],
      permissions: ['approve_purchases', 'view_budgets', 'financial_reports', 'expense_management'],
      phone: '+54 11 5678-9012',
      employeeId: 'FIN-001',
    },

    // Supervisores
    {
      id: 'user-004',
      name: 'Ana Martínez',
      email: 'ana.martinez@empresa.com',
      password: '123456',
      role: 'supervisor',
      department: 'transport',
      areaIds: ['area-norte', 'area-centro', 'area-sur'],
      permissions: [
        'view_routes', 'create_routes', 'update_routes', 'assign_routes',
        'view_all_fuel_records', 'approve_fuel_records',
        'view_all_incidents', 'manage_incidents',
        'view_all_tickets', 'create_tickets', 'assign_tickets'
      ],
      phone: '+54 11 4567-8901',
      employeeId: 'SUP-001',
    },
    {
      id: 'user-005',
      name: 'Roberto Silva',
      email: 'roberto.silva@empresa.com',
      password: '123456',
      role: 'supervisor',
      department: 'transport',
      areaIds: ['area-oeste', 'area-este'],
      permissions: [
        'view_routes', 'create_routes', 'update_routes', 'assign_routes',
        'view_all_fuel_records', 'approve_fuel_records',
        'view_all_incidents', 'manage_incidents',
        'view_all_tickets', 'create_tickets', 'assign_tickets'
      ],
      phone: '+54 11 5678-9012',
      employeeId: 'SUP-002',
    },

    // Técnicos
    {
      id: 'user-006',
      name: 'Luis Fernández',
      email: 'luis.fernandez@empresa.com',
      password: '123456',
      role: 'technician',
      department: 'transport',
      areaIds: ['area-taller'],
      permissions: [
        'view_tickets', 'update_tickets', 'complete_tickets',
        'view_maintenance_records', 'create_maintenance_records',
        'view_vehicle_status', 'update_vehicle_status'
      ],
      phone: '+54 11 6789-0123',
      employeeId: 'TEC-001',
    },
    {
      id: 'user-007',
      name: 'Patricia López',
      email: 'patricia.lopez@empresa.com',
      password: '123456',
      role: 'technician',
      department: 'transport',
      areaIds: ['area-taller'],
      permissions: [
        'view_tickets', 'update_tickets', 'complete_tickets',
        'view_maintenance_records', 'create_maintenance_records',
        'view_vehicle_status', 'update_vehicle_status'
      ],
      phone: '+54 11 7890-1234',
      employeeId: 'TEC-002',
    },

    // Administrador
    {
      id: 'user-008',
      name: 'Diego Administrador',
      email: 'admin@empresa.com',
      password: '123456',
      role: 'admin',
      department: 'management',
      areaIds: ['area-norte', 'area-centro', 'area-sur', 'area-oeste', 'area-este', 'area-taller'],
      permissions: [
        'view_all', 'create_all', 'update_all', 'delete_all',
        'manage_users', 'manage_vehicles', 'manage_areas',
        'view_analytics', 'export_data', 'system_settings'
      ],
      phone: '+54 11 8901-2345',
      employeeId: 'ADM-001',
    },
  ];

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1500));

    const userWithPassword = this.users.find(
      user => user.email.toLowerCase() === credentials.email.toLowerCase() && 
               user.password === credentials.password
    );

    if (!userWithPassword) {
      throw new Error('Email o contraseña incorrectos');
    }

    // Extraer password del objeto user
    const { password, ...user } = userWithPassword;

    // Generar tokens JWT simulados
    const tokens: AuthTokens = {
      accessToken: this.generateToken(user.id, '1h'),
      refreshToken: this.generateToken(user.id, '30d'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora
    };

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Simular validación del refresh token
    await new Promise(resolve => setTimeout(resolve, 500));

    // En una app real, validarías el refresh token aquí
    const payload = this.decodeToken(refreshToken);
    if (!payload) {
      throw new Error('Refresh token inválido');
    }

    // Generar nuevos tokens
    return {
      accessToken: this.generateToken(payload.userId, '1h'),
      refreshToken: this.generateToken(payload.userId, '30d'),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    };
  }

  async validateToken(token: string): Promise<User | null> {
    const payload = this.decodeToken(token);
    if (!payload) return null;

    const userWithPassword = this.users.find(user => user.id === payload.userId);
    if (!userWithPassword) return null;

    const { password, ...user } = userWithPassword;
    return user;
  }

  async logout(): Promise<void> {
    // En una app real, invalidarías el token en el servidor
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Métodos auxiliares para JWT simulado
  private generateToken(userId: string, expiresIn: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: this.getExpirationTime(expiresIn),
    }));
    const signature = btoa(`signature-${userId}-${Date.now()}`);
    
    return `${header}.${payload}.${signature}`;
  }

  private decodeToken(token: string): { userId: string; iat: number; exp: number } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      
      // Verificar expiración
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }
      
      return payload;
    } catch {
      return null;
    }
  }

  private getExpirationTime(expiresIn: string): number {
    const now = Math.floor(Date.now() / 1000);
    
    if (expiresIn.endsWith('h')) {
      const hours = parseInt(expiresIn.slice(0, -1));
      return now + (hours * 60 * 60);
    } else if (expiresIn.endsWith('d')) {
      const days = parseInt(expiresIn.slice(0, -1));
      return now + (days * 24 * 60 * 60);
    }
    
    return now + 3600; // Default 1 hour
  }

  // Método para obtener todos los usuarios (solo para desarrollo)
  getTestUsers(): Array<{ email: string; password: string; role: string; name: string }> {
    return this.users.map(user => ({
      email: user.email,
      password: user.password,
      role: user.role,
      name: user.name,
    }));
  }
}

export const AuthService = new AuthServiceClass();