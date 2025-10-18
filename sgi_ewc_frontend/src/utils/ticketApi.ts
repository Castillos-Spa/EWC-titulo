import apiFetch from "./api";
import { Ticket, TicketPriority } from "../types/Ticket";

export type CreateTicketPayload = {
  title: string;
  description?: string;
  category: string;
  priority?: TicketPriority;
  recipientArea?: string[];
  tags?: string[];
};

// --- Ticket Management ---

export async function getTickets(): Promise<Ticket[]> {
  const res = await apiFetch("/tickets", { method: "GET" });
  if (Array.isArray(res)) return res as Ticket[];
  if (
    res &&
    typeof res === "object" &&
    Array.isArray((res as Record<string, unknown>)["items"])
  ) {
    return (res as Record<string, unknown>)["items"] as Ticket[];
  }
  if (
    res &&
    typeof res === "object" &&
    Array.isArray((res as Record<string, unknown>)["data"])
  ) {
    return (res as Record<string, unknown>)["data"] as Ticket[];
  }
  return [];
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
  data: Partial<Ticket> & { assignedToId?: number }
): Promise<Ticket> {
  return apiFetch(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
export const approveTicketStep = async (
  ticketId: number,
  approvalId: number,
  payload: { approved: boolean; comments?: string }
) => {
  return apiFetch(`/tickets/${ticketId}/approvals/${approvalId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};
