import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SafeStorage } from './SafeStorage';

export interface User {
  id: string;
  name: string;
  email: string;
  roles: string[]; // Roles exactamente como en backend (Prisma Role enum)
  role:
    | 'driver'
    | 'supervisor'
    | 'technician'
    | 'admin'
    | 'cleaning_crew'
    | 'civil_works'
    | 'it_support'
    | 'manager'
    | 'finance';
  areaIds: string[];
  department:
    | 'transport'
    | 'cleaning'
    | 'civil_works'
    | 'it'
    | 'management'
    | 'finance';
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
  private ensureApiPrefix(url: string): string {
    let out = url.replace(/\/+$/, '');
    try {
      const u = new URL(out);
      const path = u.pathname.replace(/\/+$/, '');
      const hasApi = /\/api(\/v\d+)?$/.test(path);
      if (!hasApi) {
        u.pathname = (path || '') + '/api/v1';
        out = u.toString().replace(/\/+$/, '');
      }
    } catch {
      if (!/\/api(\/v\d+)?$/.test(out)) {
        out = out + '/api/v1';
      }
      out = out.replace(/\/+$/, '');
    }
    return out;
  }

  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined =
      typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    // Prefer env var, luego extra.apiUrl
    let url = envUrl && envUrl.length > 0 ? envUrl : extraUrl;
    // En Android emulador, localhost/127.0.0.1 deben apuntar a 10.0.2.2
    if (url && Platform.OS === 'android') {
      try {
        const u = new URL(url);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          u.hostname = '10.0.2.2';
          url = u.toString();
        }
      } catch {
        // Si no es una URL válida, usar reemplazo básico
        url = url
          .replace('://localhost', '://10.0.2.2')
          .replace('://127.0.0.1', '://10.0.2.2');
      }
    }
    if (url && url.length > 0) {
      return this.ensureApiPrefix(url);
    }
    const local =
      Platform.OS === 'android'
        ? 'http://10.0.2.2:3000'
        : 'http://localhost:3000';
    // Agregar /api/v1 por defecto
    return this.ensureApiPrefix(local);
  }

  private async mapLoginError(res: any): Promise<string> {
    let message = 'Error de autenticación';
    let parsed: any = null;
    let rawText: string | null = null;
    try {
      parsed = await res.json();
      message = parsed?.message || message;
    } catch {
      try {
        rawText = await res.text();
      } catch {}
    }

    if (res?.status === 404 && (rawText?.includes('Cannot') || String(message).includes('Cannot'))) {
      return 'Endpoint no encontrado. Verifica que la URL incluya /api/v1';
    }
    if (res?.status === 401 || res?.status === 400) {
      return 'Email o contraseña incorrectos';
    }
    if (res?.status >= 500) {
      return 'Error del servidor. Intenta más tarde.';
    }
    return typeof message === 'string' ? message : 'Error de autenticación';
  }

  // Helpers para normalizar campos desde el payload del backend
  private getAreasFromPayload(payload: any): string[] {
    if (Array.isArray(payload?.areas)) {
      return payload.areas.map(String);
    }
    if (payload?.area) return [String(payload.area)];
    return [];
  }

  private getSpecialtiesFromRolesByArea(payload: any): string[] {
    const rolesByArea = payload?.rolesByArea && typeof payload.rolesByArea === 'object' ? payload.rolesByArea : {};
    return Object.values(rolesByArea)
      .map((v: any) => v?.specialty)
      .filter(Boolean)
      .map(String);
  }

  private derivePrimaryRole(roles: string[], areas: string[], specialties: string[]): User['role'] {
    if (roles.includes('Admin')) return 'admin';
    if (specialties.includes('DRIVER')) return 'driver';
    if (areas.includes('IT')) return 'it_support';
    if (areas.includes('Aseo')) return 'cleaning_crew';
    if (areas.includes('Obras')) return 'civil_works';
    if (roles.includes('Supervisor')) return 'supervisor';
    return 'technician';
  }

  private deriveDepartment(role: User['role']): User['department'] {
    if (role === 'admin') return 'management';
    if (role === 'it_support') return 'it';
    if (role === 'cleaning_crew') return 'cleaning';
    if (role === 'civil_works') return 'civil_works';
    return 'transport';
  }

  private toExpiresAt(minutes = 15): string {
    // Backend emite access token con 15 min por defecto (ver JwtModule signOptions)
    const ms = minutes * 60 * 1000;
    // Resta unos segundos para evitar borde de expiración
    return new Date(Date.now() + ms - 15_000).toISOString();
  }

  private mapBackendUserToAppUser(payload: any): User {
    const roles: string[] = Array.isArray(payload?.roles) ? payload.roles : [];
    const areas: string[] = this.getAreasFromPayload(payload);
    const specialties: string[] = this.getSpecialtiesFromRolesByArea(payload);
    const role: User['role'] = this.derivePrimaryRole(roles, areas, specialties);
    const department: User['department'] = this.deriveDepartment(role);

    const id = String(payload?.userId ?? payload?.sub ?? payload?.id ?? '0');
    const permissions: string[] = Array.isArray(payload?.permissions)
      ? payload.permissions.map(String)
      : [];

    return {
      id,
      name: payload?.username || payload?.email || 'Usuario',
      email: payload?.email || '',
      roles,
      role,
      areaIds: areas,
      department,
      permissions,
      employeeId: 'N/A',
    };
  }

  async login(
    credentials: LoginCredentials
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });

    if (!res.ok) {
      const message = await this.mapLoginError(res);
      throw new Error(message);
    }

    const data = await res.json();
    const accessToken: string | undefined = data?.access_token;
    const refreshToken: string | undefined = data?.refresh_token;
    if (!accessToken || !refreshToken) {
      throw new Error('Respuesta de login inválida');
    }

    // Preferir el usuario retornado por el backend en /auth/login, si viene completo.
    // Si faltan permisos (backend no los incluye en userDetails), consultamos /auth/profile.
    let rawUser: any = data?.user;
    if (!rawUser || !Array.isArray(rawUser?.permissions)) {
      const profileRes = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!profileRes.ok) {
        throw new Error('No se pudo obtener el perfil');
      }
      rawUser = await profileRes.json();
    }
    const user = this.mapBackendUserToAppUser(rawUser);

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
  expiresAt: this.toExpiresAt(15),
    };

    return { user, tokens };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      throw new Error('Refresh token inválido');
    }
    const data = await res.json();
    const newAccess: string | undefined = data?.access_token;
    if (!newAccess) throw new Error('Respuesta de refresh inválida');
    return {
      accessToken: newAccess,
      refreshToken, // el backend no entrega uno nuevo
      expiresAt: this.toExpiresAt(15),
    };
  }

  async validateToken(token: string): Promise<User | null> {
    try {
      const baseUrl = this.getBaseUrl();
      const profileRes = await fetch(`${baseUrl}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!profileRes.ok) return null;
      const payload = await profileRes.json();
      return this.mapBackendUserToAppUser(payload);
    } catch {
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const accessToken = await SafeStorage.getItem('accessToken');
      if (!accessToken) return;
      const baseUrl = this.getBaseUrl();
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // ignorar errores de logout
    }
  }

  async changePassword(
    userId: string | number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const accessToken = await SafeStorage.getItem('accessToken');
    if (!accessToken) throw new Error('No autenticado');
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/users/${userId}/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      try {
        const data = await res.json();
        let msg: string = 'No se pudo cambiar la contraseña';
        if (typeof data?.message === 'string') {
          msg = data.message;
        } else if (Array.isArray(data?.message)) {
          msg = data.message.join(', ');
        }
        throw new Error(msg);
      } catch (e) {
        if (e instanceof Error) throw e;
        throw new Error('No se pudo cambiar la contraseña');
      }
    }
  }

  // ...eliminados helpers del JWT simulado

  // Método para mock de UI en LoginScreen (dejar vacío si no hay lista)
  getTestUsers(): {
    email: string;
    password: string;
    role: string;
    name: string;
  }[] {
    return [];
  }
}
const AuthService = new AuthServiceClass();

export default AuthService;
export { AuthService };
