import { Role } from "./User";

export enum TicketStatus {
  Pendiente = "Pendiente",
  EnProgreso = "EnProgreso",
  Resuelto = "Resuelto",
  Cerrado = "Cerrado",
}

export enum TicketPriority {
  Baja = "Baja",
  Media = "Media",
  Alta = "Alta",
  Urgente = "Urgente",
}

interface UserInfo {
  id: number;
  username: string;
}

export interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  createdAt: string;
  updatedAt: string;
  createdBy: UserInfo;
  assignedTo?: UserInfo | null;
  recipientArea: string[];
  recipientRole: Role[];
  assignedUserConfirmation: boolean | null;
  requestingUserConfirmation: boolean | null;
  tags: string[];
}
