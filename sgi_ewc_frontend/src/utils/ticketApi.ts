import apiFetch from "./api";
import { Ticket, TicketPriority } from "../types/Ticket";

export type CreateTicketPayload = {
  title: string;
  description?: string;
  category: string;
  priority?: TicketPriority;
  recipientArea: string;
  tags?: string[];
};

// --- Ticket Management ---

export async function getTickets(): Promise<Ticket[]> {
  return apiFetch("/tickets", { method: "GET" });
}

export async function getTicket(id: number): Promise<Ticket> {
  return apiFetch(`/tickets/${id}`, { method: "GET" });
}

export async function createTicket(data: CreateTicketPayload): Promise<Ticket> {
  return apiFetch("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTicket(
  id: number,
  data: Partial<Ticket>
): Promise<Ticket> {
  return apiFetch(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
