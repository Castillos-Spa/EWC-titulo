import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SafeStorage } from './SafeStorage';

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
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    if (envUrl && envUrl.length > 0) return envUrl;
    if (extraUrl && extraUrl.length > 0) return extraUrl;
    const local = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
    return local;
  }

  private toExpiresAt(minutes = 5): string {
    // Backend emite access token con 5 min por defecto
    const ms = minutes * 60 * 1000;
    // Resta unos segundos para evitar borde de expiración
    return new Date(Date.now() + ms - 15_000).toISOString();
  }

  private mapBackendUserToAppUser(payload: any): User {
    const roles: string[] = Array.isArray(payload?.roles) ? payload.roles : [];
    const firstRole = roles[0] || 'User';
    let role: User['role'];
    switch (firstRole) {
      case 'Admin':
        role = 'admin';
        break;
      case 'IT':
        role = 'it_support';
        break;
      case 'Driver':
        role = 'driver';
        break;
      case 'Transporte':
        role = 'supervisor';
        break;
      case 'Obras':
        role = 'civil_works';
        break;
      case 'Aseo':
        role = 'cleaning_crew';
        break;
      default:
        role = 'technician';
    }

    let department: User['department'] = 'transport';
    if (role === 'admin') department = 'management';
    else if (role === 'it_support') department = 'it';
    else if (role === 'cleaning_crew') department = 'cleaning';
    else if (role === 'civil_works') department = 'civil_works';

    return {
      id: String(payload?.userId ?? payload?.sub ?? '0'),
      name: payload?.username || payload?.email || 'Usuario',
      email: payload?.email || '',
      role,
      areaIds: payload?.area ? [String(payload.area)] : [],
      department,
      permissions: Array.isArray(payload?.permissions) ? payload.permissions.map((p: string) => String(p)) : [],
      employeeId: 'N/A',
    };
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const baseUrl = this.getBaseUrl();
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    if (!res.ok) {
      let message = 'Error de autenticación';
      try {
        const data = await res.json();
        message = data?.message || message;
      } catch {}
      throw new Error(typeof message === 'string' ? message : 'Email o contraseña incorrectos');
    }

    const tokensRaw = await res.json();
    const accessToken: string = tokensRaw.access_token;
    const refreshToken: string = tokensRaw.refresh_token;
    if (!accessToken || !refreshToken) {
      throw new Error('Respuesta de login inválida');
    }

    // Obtener perfil
    const profileRes = await fetch(`${baseUrl}/auth/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileRes.ok) {
      throw new Error('No se pudo obtener el perfil');
    }
    const payload = await profileRes.json();
    const user = this.mapBackendUserToAppUser(payload);

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      expiresAt: this.toExpiresAt(5),
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
      expiresAt: this.toExpiresAt(5),
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

  async changePassword(userId: string | number, currentPassword: string, newPassword: string): Promise<void> {
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
  getTestUsers(): { email: string; password: string; role: string; name: string }[] {
    return [];
  }
}

export const AuthService = new AuthServiceClass();