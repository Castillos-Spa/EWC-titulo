import { ApiClient } from './ApiClient';

class NotificationApiClass {
  async markAsRead(id: number | string): Promise<void> {
    await ApiClient.patch<void>(`/notifications/${id}/read`, undefined, true);
  }

  async create(payload: { message: string; type: string; target: 'global' | 'areas'; areas?: string[] }): Promise<void> {
    await ApiClient.post<void>(`/notifications`, payload, true);
  }
}

export const NotificationApi = new NotificationApiClass();
