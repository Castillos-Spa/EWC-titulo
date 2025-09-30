import Constants from 'expo-constants';
import { SafeStorage } from './SafeStorage';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  roleAssignments?: { area: string; role: string; specialty?: string | null; permissions?: string[] }[];
}

class UserApiClass {
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    let base = envUrl || extraUrl || 'http://localhost:3000';
    try {
      const url = new URL(base);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') url.hostname = '10.0.2.2';
      base = url.origin;
    } catch { base = base.replace(/\/+$/, ''); }
    return base;
  }

  private async headers(): Promise<Record<string, string>> {
    const token = await SafeStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }

  async list(): Promise<AppUser[]> {
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/users`, { headers: await this.headers() });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || 'Error al cargar usuarios');
    return data as AppUser[];
  }
}

export const UserApi = new UserApiClass();
