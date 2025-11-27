import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';
import { TicketApi, BackendTicket, BackendTicketPriority, BackendTicketStatus } from '../services/TicketApi';

export interface Ticket {
  id: string; // keep as string for mobile UI; backend id is number
  ticketNumber?: string; // optional, backend doesn't provide this
  title: string;
  description: string;
  type: 'maintenance' | 'delivery' | 'pickup' | 'inspection' | 'repair' | 'other';
  // Categoría original del backend (p.ej., "Soporte_IT", "Mantenimiento", ...)
  category?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignedTo?: string;
  assignedBy?: string;
  clientName?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  photos: string[];
  notes?: string;
  completionNotes?: string;
  signaturePath?: string;
  materials?: Material[];
  checklist?: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  used?: number;
  notes?: string;
}

export interface ChecklistItem {
  id: string;
  description: string;
  completed: boolean;
  notes?: string;
  photoRequired: boolean;
  photoPath?: string;
}

interface TicketState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadTickets: (status?: string, dateRange?: { start: string; end: string }) => Promise<void>;
  createTicket: (ticketData: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: Ticket['status']) => Promise<void>;
  startTicket: (ticketId: string) => Promise<void>;
  completeTicket: (ticketId: string, completionData: {
    completionNotes?: string;
    signaturePath?: string;
    materials?: Material[];
    checklist?: ChecklistItem[];
  }) => Promise<void>;
  addTicketPhoto: (ticketId: string, photoUri: string) => void;
  updateChecklist: (ticketId: string, checklistItemId: string, completed: boolean, notes?: string) => void;
  updateMaterialUsage: (ticketId: string, materialId: string, used: number) => void;
  setCurrentTicket: (ticket: Ticket | null) => void;
  clearError: () => void;
}

function updateChecklistInTicket(
  ticket: Ticket,
  checklistItemId: string,
  completed: boolean,
  notes?: string
): Ticket {
  const checklist = ticket.checklist?.map((item) =>
    item.id === checklistItemId ? { ...item, completed, notes } : item
  );
  return {
    ...ticket,
    checklist,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
}

function applyChecklistToTickets(
  tickets: Ticket[],
  ticketId: string,
  checklistItemId: string,
  completed: boolean,
  notes?: string
): Ticket[] {
  return tickets.map((t) => (t.id === ticketId ? updateChecklistInTicket(t, checklistItemId, completed, notes) : t));
}

function updateMaterialInTicket(ticket: Ticket, materialId: string, used: number): Ticket {
  const materials = ticket.materials?.map((m) => (m.id === materialId ? { ...m, used } : m));
  return {
    ...ticket,
    materials,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
}

function applyMaterialToTickets(tickets: Ticket[], ticketId: string, materialId: string, used: number): Ticket[] {
  return tickets.map((t) => (t.id === ticketId ? updateMaterialInTicket(t, materialId, used) : t));
}

const extractNumericTicketId = (ticketId: string): number => {
  const digits = ticketId.replaceAll(/\D/g, '');
  const parsed = Number.parseInt(digits, 10);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  const fallback = Number(ticketId);
  return Number.isNaN(fallback) ? parsed : fallback;
};

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadTickets: async (status?: string, dateRange?: { start: string; end: string }) => {
    set({ isLoading: true, error: null });
    try {
      const backendTickets: BackendTicket[] = await TicketApi.getTickets();
      const list = Array.isArray(backendTickets) ? backendTickets : [];
      const mapped: Ticket[] = list.map(mapFromBackend);

      // Filtrado opcional por estado y rango de fechas (creación)
      const display: Ticket[] = mapped.filter((t) => {
        const matchesStatus = status ? t.status === (status as Ticket['status']) : true;
        const matchesDate = dateRange
          ? (() => {
              const created = new Date(t.createdAt).getTime();
              const startMs = new Date(dateRange.start).getTime();
              const endMs = new Date(dateRange.end).getTime();
              return created >= startMs && created <= endMs;
            })()
          : true;
        return matchesStatus && matchesDate;
      });
      // Guardado local best-effort (no bloquear si SQLite falla)
      try {
        // Persistimos todos los tickets recuperados para uso offline
        await DatabaseService.saveTickets(mapped);
      } catch (e) {
        console.warn('No se pudo persistir tickets en SQLite (continuando):', e);
      }
      set({ tickets: display, isLoading: false });
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      const msg = (error as any)?.message || 'Error al cargar tickets';
      set({ error: msg, isLoading: false });
    }
  },

  createTicket: async (ticketData) => {
    set({ isSubmitting: true, error: null });
    try {
      // Mapear prioridad a backend
      const priorityMap: Record<Ticket['priority'], BackendTicketPriority> = {
        low: 'Baja',
        medium: 'Media',
        high: 'Alta',
        urgent: 'Urgente',
      };
      const payload = {
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.type ?? 'other',
        priority: priorityMap[ticketData.priority] ?? 'Media',
        recipientArea: 'IT',
        tags: [],
      };
      const created = await TicketApi.createTicket(payload);
      const mapped = mapFromBackend(created);
      try {
        await DatabaseService.saveTicket(mapped);
      } catch (e) {
        console.warn('No se pudo persistir ticket en SQLite (continuando):', e);
      }
      set(state => ({ tickets: [mapped, ...state.tickets], isSubmitting: false }));
    } catch (error) {
      console.error('Error al crear ticket:', error);
      set({ error: 'Error al crear ticket', isSubmitting: false });
    }
  },

  updateTicketStatus: async (ticketId: string, status: Ticket['status']) => {
    try {
      // Mapear estado a backend y enviar
      const backendStatus = mapStatusToBackend(status);
      const numericId = extractNumericTicketId(ticketId);
      const updatedFromBackend = await TicketApi.updateTicket(numericId, { status: backendStatus });
      const mapped = mapFromBackend(updatedFromBackend);
      try {
        await DatabaseService.updateTicket(ticketId, {
          status: mapped.status,
          updatedAt: mapped.updatedAt,
          syncStatus: 'synced',
        });
      } catch (e) {
        console.warn('No se pudo actualizar ticket en SQLite (continuando):', e);
      }
      set(state => ({ tickets: state.tickets.map(t => (t.id === ticketId ? { ...t, status: mapped.status, updatedAt: mapped.updatedAt, syncStatus: 'synced' } : t)) }));
    } catch (error) {
      console.error('Error al actualizar ticket:', error);
      set({ error: 'Error al actualizar ticket' });
    }
  },

  startTicket: async (ticketId: string) => {
    try {
      const numericId = extractNumericTicketId(ticketId);
      const updatedFromBackend = await TicketApi.updateTicket(numericId, { status: 'EnProgreso' });
      const mapped = mapFromBackend(updatedFromBackend);
      const startTime = new Date().toISOString();
      try {
        await DatabaseService.updateTicket(ticketId, {
          status: mapped.status,
          startTime,
          updatedAt: mapped.updatedAt,
          syncStatus: 'synced',
        });
      } catch (e) {
        console.warn('No se pudo actualizar inicio en SQLite (continuando):', e);
      }
      set(state => ({ tickets: state.tickets.map(t => (t.id === ticketId ? { ...t, status: mapped.status, startTime, updatedAt: mapped.updatedAt, syncStatus: 'synced' } : t)) }));
    } catch (error) {
      console.error('Error al iniciar ticket:', error);
      set({ error: 'Error al iniciar ticket' });
    }
  },

  completeTicket: async (ticketId: string, completionData) => {
    try {
      const ticket = get().tickets.find(t => t.id === ticketId);
      if (!ticket) return;

      const actualDuration = ticket.startTime
        ? Math.round((Date.now() - new Date(ticket.startTime).getTime()) / (1000 * 60))
        : undefined;

      const numericId = extractNumericTicketId(ticketId);
      const updatedFromBackend = await TicketApi.updateTicket(numericId, { status: 'Resuelto' });
      const mapped = mapFromBackend(updatedFromBackend);
      const endTime = new Date().toISOString();
      try {
        await DatabaseService.updateTicket(ticketId, {
          status: mapped.status,
          endTime,
          actualDuration,
          completionNotes: completionData.completionNotes,
          updatedAt: mapped.updatedAt,
          syncStatus: 'synced',
        });
      } catch (e) {
        console.warn('No se pudo finalizar ticket en SQLite (continuando):', e);
      }
      set(state => ({ 
        tickets: state.tickets.map(t => (t.id === ticketId ? { ...t, status: mapped.status, endTime, actualDuration, completionNotes: completionData.completionNotes, updatedAt: mapped.updatedAt, syncStatus: 'synced' } : t)), 
        currentTicket: null 
      }));
    } catch (error) {
      console.error('Error al completar ticket:', error);
      set({ error: 'Error al completar ticket' });
    }
  },

  addTicketPhoto: (ticketId: string, photoUri: string) => {
    try {
      const state = get();
      set(state => ({
        tickets: state.tickets.map(ticket =>
          ticket.id === ticketId
            ? { 
                ...ticket, 
                photos: [...(ticket.photos || []), photoUri],
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const,
              }
            : ticket
        ),
        currentTicket: state.currentTicket?.id === ticketId
          ? { 
              ...state.currentTicket, 
              photos: [...(state.currentTicket.photos || []), photoUri],
              updatedAt: new Date().toISOString(),
            }
          : state.currentTicket,
      }));

      // Save to database
      const ticket = state.tickets.find(t => t.id === ticketId);
      if (ticket) {
        DatabaseService.updateTicket(ticketId, {
          photos: JSON.stringify([...(ticket.photos || []), photoUri]),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        }).catch(error => {
          console.warn('Failed to save photo to database:', error);
        });
      }
    } catch (error) {
      console.error('Error adding photo to ticket:', error);
      set({ error: 'Error al agregar foto' });
    }
  },

  updateChecklist: (ticketId: string, checklistItemId: string, completed: boolean, notes?: string) => {
    set((state) => {
      const tickets = applyChecklistToTickets(state.tickets, ticketId, checklistItemId, completed, notes);
      const currentTicket =
        state.currentTicket?.id === ticketId
          ? updateChecklistInTicket(state.currentTicket, checklistItemId, completed, notes)
          : state.currentTicket;
      return { tickets, currentTicket };
    });
  },

  updateMaterialUsage: (ticketId: string, materialId: string, used: number) => {
    set((state) => {
      const tickets = applyMaterialToTickets(state.tickets, ticketId, materialId, used);
      const currentTicket =
        state.currentTicket?.id === ticketId
          ? updateMaterialInTicket(state.currentTicket, materialId, used)
          : state.currentTicket;
      return { tickets, currentTicket };
    });
  },

  setCurrentTicket: (ticket: Ticket | null) => {
    set({ currentTicket: ticket });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// Helpers de mapeo
function mapPriorityFromBackend(p: BackendTicketPriority): Ticket['priority'] {
  const map: Record<BackendTicketPriority, Ticket['priority']> = {
    Baja: 'low',
    Media: 'medium',
    Alta: 'high',
    Urgente: 'urgent',
  };
  return map[p] ?? 'medium';
}

function mapStatusFromBackend(s: BackendTicketStatus): Ticket['status'] {
  const map: Record<BackendTicketStatus, Ticket['status']> = {
    Pendiente: 'assigned',
    EnProgreso: 'in_progress',
    Resuelto: 'completed',
    Cerrado: 'completed',
  };
  return map[s] ?? 'assigned';
}

function mapStatusToBackend(s: Ticket['status']): BackendTicketStatus {
  const map: Record<Ticket['status'], BackendTicketStatus> = {
    assigned: 'Pendiente',
    in_progress: 'EnProgreso',
    on_hold: 'Pendiente',
    completed: 'Resuelto',
    cancelled: 'Cerrado',
  };
  return map[s] ?? 'Pendiente';
}

function inferTypeFromCategory(category?: string): Ticket['type'] {
  const cat = (category || '').toLowerCase();
  if (cat.includes('mantenimiento')) return 'maintenance';
  if (cat.includes('inspeccion') || cat.includes('inspección')) return 'inspection';
  if (cat.includes('entrega')) return 'delivery';
  if (cat.includes('repar')) return 'repair';
  return 'other';
}

function mapFromBackend(bt: BackendTicket): Ticket {
  return {
    id: String(bt.id),
    ticketNumber: `TK-${bt.id}`,
    title: bt.title,
    description: bt.description ?? '',
    type: inferTypeFromCategory(bt.category),
    category: (bt as any).category as string | undefined,
    priority: mapPriorityFromBackend((bt as any).priority ?? 'Media'),
    status: mapStatusFromBackend(bt.status),
    assignedTo: bt.assignedTo?.username ?? '',
    assignedBy: bt.createdBy?.username ?? '',
    location: { latitude: 0, longitude: 0 },
    estimatedDuration: 60,
    scheduledDate: new Date(bt.createdAt).toISOString().split('T')[0],
    photos: [],
    createdAt: bt.createdAt,
    updatedAt: (bt as any).updatedAt ?? bt.createdAt,
    syncStatus: 'synced',
  };
}