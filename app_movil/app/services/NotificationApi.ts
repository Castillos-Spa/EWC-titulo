import { ApiClient } from './ApiClient';

class NotificationApiClass {
  async list(page: number = 1, pageSize: number = 20): Promise<{
    items: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return ApiClient.get(`/notification?${params.toString()}`, true);
  }

  async markAsRead(id: number | string): Promise<void> {
    const n = typeof id === 'number' ? id : Number.parseInt(String(id), 10);
    if (!Number.isFinite(n)) {
      // ID no numérico (p.ej., generado localmente); no hay endpoint que lo soporte en backend
      return;
    }
    await ApiClient.patch<void>(`/notification/${n}`, { read: true }, true);
  }

  async create(payload: {
    title: string;
    message: string;
    priority: 'low' | 'normal' | 'high';
    target: { scope: 'global' | 'areas' | 'roles'; areas?: string[]; roles?: string[] };
    scheduledAt?: string;
  }): Promise<void> {
    await ApiClient.post<void>(`/notification`, payload, true);
  }
}

export const NotificationApi = new NotificationApiClass();
