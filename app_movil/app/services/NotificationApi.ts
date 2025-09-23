import Constants from 'expo-constants';
import { SafeStorage } from './SafeStorage';

class NotificationApiClass {
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    return envUrl || extraUrl || 'http://localhost:3000';
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
}

export const NotificationApi = new NotificationApiClass();
