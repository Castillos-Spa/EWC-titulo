import apiFetch from "./api";
import { Ticket, TicketPriority } from "../types/Ticket";
import { fetchWithCache, invalidateCache } from "./requestCache";

export type CreateTicketPayload = {
  title: string;
  description?: string;
  category: string;
  priority?: TicketPriority;
  recipientArea?: string[];
  tags?: string[];
};

// --- Ticket Management ---

const TICKETS_CACHE_KEY = "tickets:list";

const normalizeTickets = (res: unknown): Ticket[] => {
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
};

export async function getTickets(forceRefresh = false): Promise<Ticket[]> {
  return fetchWithCache(
    TICKETS_CACHE_KEY,
    async () => {
      const res = await apiFetch("/tickets", { method: "GET" });
      return normalizeTickets(res);
    },
    { force: forceRefresh }
  );
}

export async function getTicket(id: number): Promise<Ticket> {
  return apiFetch(`/tickets/${id}`, { method: "GET" });
}

export async function createTicket(data: CreateTicketPayload): Promise<Ticket> {
  const created = await apiFetch("/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
  invalidateCache(TICKETS_CACHE_KEY);
  return created;
}

export async function updateTicket(
  id: number,
  data: Partial<Ticket> & { assignedToId?: number }
): Promise<Ticket> {
  const updated = await apiFetch(`/tickets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
  invalidateCache(TICKETS_CACHE_KEY);
  return updated;
}
export const approveTicketStep = async (
  ticketId: number,
  approvalId: number,
  payload: { approved: boolean; comments?: string }
) => {
  const updated = await apiFetch(
    `/tickets/${ticketId}/approvals/${approvalId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
  invalidateCache(TICKETS_CACHE_KEY);
  return updated;
};
