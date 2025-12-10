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
    const response: any = await ApiClient.get(`/notification?${params.toString()}`, true);

    if (Array.isArray(response)) {
      const items = response;
      return {
        items,
        total: items.length,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      };
    }

    let itemsCandidate: any[] = [];
    if (Array.isArray(response?.items)) {
      itemsCandidate = response.items;
    } else if (Array.isArray(response?.data)) {
      itemsCandidate = response.data;
    } else if (Array.isArray(response?.results)) {
      itemsCandidate = response.results;
    }

    const totalCandidate = typeof response?.total === 'number' ? response.total : itemsCandidate.length;
    const effectivePageSize = typeof response?.pageSize === 'number' ? response.pageSize : pageSize;
    const effectivePage = typeof response?.page === 'number' ? response.page : page;

    let totalPagesCandidate: number;
    if (typeof response?.totalPages === 'number') {
      totalPagesCandidate = response.totalPages;
    } else {
      totalPagesCandidate = Math.max(1, Math.ceil(totalCandidate / effectivePageSize));
    }

    return {
      items: itemsCandidate,
      total: totalCandidate,
      page: effectivePage,
      pageSize: effectivePageSize,
      totalPages: totalPagesCandidate,
    };
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
