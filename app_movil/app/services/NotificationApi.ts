import Constants from 'expo-constants';
import { SafeStorage } from './SafeStorage';

class NotificationApiClass {
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    let base = envUrl || extraUrl || 'http://localhost:3000';
    try {
      const url = new URL(base);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = '10.0.2.2';
      }
      base = url.origin; // normaliza para evitar //
    } catch {
      base = base.replace(/\/+$/, '');
    }
    return base;
  }

  async markAsRead(id: number | string): Promise<void> {
    const token = await SafeStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      let msg = 'No se pudo marcar como leído';
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch {}
      throw new Error(msg);
    }
  }

  async create(payload: { message: string; type: string; target: 'global' | 'areas'; areas?: string[] }): Promise<void> {
    const token = await SafeStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');
    const base = this.getBaseUrl();
    const res = await fetch(`${base}/notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      let msg = 'No se pudo crear la notificación';
      try {
        const data = await res.json();
        msg = data?.message || msg;
      } catch {}
      throw new Error(msg);
    }
  }
}

export const NotificationApi = new NotificationApiClass();
