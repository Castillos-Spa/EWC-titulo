import Constants from 'expo-constants';
import { SafeStorage } from './SafeStorage';

// Tipos del backend (parciales) y payloads
export type BackendTicketStatus = 'Pendiente' | 'EnProgreso' | 'Resuelto' | 'Cerrado';
export type BackendTicketPriority = 'Baja' | 'Media' | 'Alta' | 'Urgente';

export interface BackendUserInfo { id: number; username: string }

export interface BackendTicket {
  id: number;
  title: string;
  description?: string;
  status: BackendTicketStatus;
  priority: BackendTicketPriority;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: BackendUserInfo;
  assignedTo?: BackendUserInfo | null;
  recipientArea: string[];
  recipientRole: string[];
  assignedUserConfirmation: boolean | null;
  requestingUserConfirmation: boolean | null;
  tags: string[];
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  category: string;
  priority?: BackendTicketPriority;
  recipientArea: string | string[];
  tags?: string[];
  assignedToId?: number;
  recipientRole?: string[];
}

export class TicketApiClass {
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
      // Use origin to avoid trailing slash
      base = url.origin;
    } catch {
      // If it's not a valid URL string, best effort: strip trailing slashes
      base = base.replace(/\/+$/, '');
    }
    return base;
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await SafeStorage.getItem('accessToken');
    if (!token) throw new Error('No autenticado');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async getTickets(): Promise<BackendTicket[]> {
    const base = this.getBaseUrl();
    const headers = await this.authHeaders();
    const res = await fetch(`${base}/tickets`, { method: 'GET', headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || 'Error al obtener tickets');
    return data as BackendTicket[];
  }

  async getTicket(id: number): Promise<BackendTicket> {
    const base = this.getBaseUrl();
    const headers = await this.authHeaders();
    const res = await fetch(`${base}/tickets/${id}`, { method: 'GET', headers });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || 'Error al obtener ticket');
    return data as BackendTicket;
  }

  async createTicket(payload: CreateTicketPayload): Promise<BackendTicket> {
    const base = this.getBaseUrl();
    const headers = await this.authHeaders();
    const res = await fetch(`${base}/tickets`, { method: 'POST', headers, body: JSON.stringify(payload) });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || 'Error al crear ticket');
    return data as BackendTicket;
  }

  async updateTicket(id: number, patch: Partial<BackendTicket> & { status?: BackendTicketStatus; assignedToId?: number }): Promise<BackendTicket> {
    const base = this.getBaseUrl();
    const headers = await this.authHeaders();
    const res = await fetch(`${base}/tickets/${id}`, { method: 'PATCH', headers, body: JSON.stringify(patch) });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || 'Error al actualizar ticket');
    return data as BackendTicket;
  }
}

export const TicketApi = new TicketApiClass();
