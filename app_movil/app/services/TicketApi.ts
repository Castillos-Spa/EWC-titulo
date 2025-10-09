import { ApiClient } from './ApiClient';

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
  async getTickets(): Promise<BackendTicket[]> {
    return ApiClient.get<BackendTicket[]>(`/tickets`, true);
  }

  async getTicket(id: number): Promise<BackendTicket> {
    return ApiClient.get<BackendTicket>(`/tickets/${id}`, true);
  }

  async createTicket(payload: CreateTicketPayload): Promise<BackendTicket> {
    return ApiClient.post<BackendTicket>(`/tickets`, payload, true);
  }

  async updateTicket(id: number, patch: Partial<BackendTicket> & { status?: BackendTicketStatus; assignedToId?: number }): Promise<BackendTicket> {
    return ApiClient.patch<BackendTicket>(`/tickets/${id}`, patch, true);
  }
}

export const TicketApi = new TicketApiClass();
