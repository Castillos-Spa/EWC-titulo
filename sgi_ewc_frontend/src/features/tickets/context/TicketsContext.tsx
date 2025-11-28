import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Ticket, TicketStatus, TicketPriority } from '../../../types/Ticket';
import { getTickets, createTicket, updateTicket, approveTicketStep, CreateTicketPayload, uploadTicketAttachments } from '../../../utils/ticketApi';
import { getUsers } from '../../../utils/userApi';
import { User } from '../../../types/User';
import { getTicketCategoryEnum } from '../utils/category';

export type ViewMode = 'kanban' | 'list';
export interface TicketsState {
  items: Ticket[];
  users: User[];
  loading: boolean;
  error: string | null;
  search: string;
  view: ViewMode;
  status: 'all' | TicketStatus;
  category: string;
  priority: 'all' | TicketPriority;
}

type UpdatePatch = Partial<Ticket> & { assignedToId?: number };

export interface TicketsContextValue extends TicketsState {
  refresh: () => Promise<void>;
  setSearch: (q: string) => void;
  setView: (v: ViewMode) => void;
  setStatus: (s: TicketsState['status']) => void;
  setCategory: (c: string) => void;
  setPriority: (p: TicketsState['priority']) => void;
  create: (payload: CreateTicketPayload, attachments?: File[]) => Promise<void>;
  update: (id: number, patch: UpdatePatch) => Promise<void>;
  approve: (ticketId: number, approvalId: number, approved: boolean, comments?: string) => Promise<void>;
  uploadAttachments: (id: number, files: File[]) => Promise<string[]>;
}

const TicketsContext = createContext<TicketsContextValue | undefined>(undefined);

export function TicketsProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<TicketsState>({
    items: [],
    users: [],
    loading: true,
    error: null,
    search: '',
    view: 'kanban',
    status: 'all',
    category: 'all',
    priority: 'all',
  });

  const refresh = useCallback(async () => {
    try {
      setState((s) => ({ ...s, loading: true }));
      const [tickets, users] = await Promise.all([
        getTickets(),
        getUsers(),
      ]);
      setState((s) => ({ ...s, items: tickets, users, error: null, loading: false }));
    } catch (err) {
      console.error('Error al refrescar tickets:', err);
      setState((s) => ({ ...s, error: 'Error al cargar los tickets', loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ query: string }>;
      setState((s) => ({ ...s, search: ce.detail?.query ?? '', view: 'list' }));
    };
    globalThis.addEventListener('global-search', handler as EventListener);
    return () => globalThis.removeEventListener('global-search', handler as EventListener);
  }, []);

  const setSearch = (q: string) => setState((s) => ({ ...s, search: q }));
  const setView = (v: ViewMode) => setState((s) => ({ ...s, view: v }));
  const setStatus = (status: TicketsState['status']) => setState((s) => ({ ...s, status }));
  const setCategory = (category: TicketsState['category']) => setState((s) => ({ ...s, category }));
  const setPriority = (priority: TicketsState['priority']) => setState((s) => ({ ...s, priority }));

  const create = useCallback(async (payload: CreateTicketPayload, attachments?: File[]) => {
    const categoryEnum = getTicketCategoryEnum(payload.category);
    if (!categoryEnum) {
      throw new Error('INVALID_TICKET_CATEGORY');
    }

    try {
      const ticket = await createTicket({
        ...payload,
        category: payload.category.trim(),
      });
      if (attachments && attachments.length) {
        await uploadTicketAttachments(ticket.id, attachments);
      }
      await refresh();
    } catch (error) {
      // Surface backend error payload for easier debugging in dev tools.
      console.error('ticket:create failed', error);
      console.error('ticket:create payload', {
        originalCategory: payload.category,
        normalizedCategory: categoryEnum,
        recipientArea: payload.recipientArea,
      });
      if (error && typeof error === 'object' && 'body' in error) {
        console.error('ticket:create error body', (error as { body?: unknown }).body);
      }
      throw error;
    }
  }, [refresh]);

  const update = useCallback(async (id: number, patch: UpdatePatch) => {
    const updated = await updateTicket(id, patch);
    setState((s) => ({ ...s, items: s.items.map((t) => (t.id === id ? { ...t, ...updated } : t)) }));
  }, []);

  const approve = useCallback(async (ticketId: number, approvalId: number, approved: boolean, comments?: string) => {
    const updated = await approveTicketStep(ticketId, approvalId, { approved, comments });
    setState((s) => ({ ...s, items: s.items.map((t) => (t.id === updated.id ? updated : t)) }));
  }, []);

  const uploadAttachments = useCallback(async (id: number, files: File[]) => {
    const { attachments } = await uploadTicketAttachments(id, files);
    setState((s) => ({
      ...s,
      items: s.items.map((t) => (t.id === id ? { ...t, attachmentUrls: attachments } : t)),
    }));
    return attachments;
  }, []);

  const value = useMemo<TicketsContextValue>(() => ({
    ...state,
    refresh,
    setSearch,
    setView,
    setStatus,
    setCategory,
    setPriority,
    create,
    update,
    approve,
    uploadAttachments,
  }), [state, refresh, create, update, approve, uploadAttachments]);

  return <TicketsContext.Provider value={value}>{children}</TicketsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTicketsContext() {
  const ctx = useContext(TicketsContext);
  if (!ctx) throw new Error('useTicketsContext must be used within TicketsProvider');
  return ctx;
}
