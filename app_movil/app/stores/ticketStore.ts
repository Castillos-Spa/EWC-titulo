import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  type: 'maintenance' | 'delivery' | 'pickup' | 'inspection' | 'repair' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignedTo: string;
  assignedBy: string;
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

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  currentTicket: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadTickets: async (status?: string, dateRange?: { start: string; end: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate API call - in real app this would fetch from server
      const mockTickets: Ticket[] = [
        {
          id: 'ticket-001',
          ticketNumber: 'TK-2025-001',
          title: 'Mantenimiento Preventivo Vehículo ABC-123',
          description: 'Revisión completa del sistema de frenos y cambio de aceite',
          type: 'maintenance',
          priority: 'high',
          status: 'assigned',
          assignedTo: 'Juan Pérez',
          assignedBy: 'Supervisor García',
          location: {
            latitude: -34.6037,
            longitude: -58.3816,
            address: 'Taller Central, Av. Corrientes 1234, Buenos Aires',
          },
          estimatedDuration: 120,
          scheduledDate: new Date().toISOString().split('T')[0],
          photos: [],
          materials: [
            { id: 'mat-001', name: 'Aceite Motor 15W-40', quantity: 6, unit: 'litros' },
            { id: 'mat-002', name: 'Filtro de Aceite', quantity: 1, unit: 'unidad' },
            { id: 'mat-003', name: 'Pastillas de Freno', quantity: 4, unit: 'unidades' },
          ],
          checklist: [
            { id: 'check-001', description: 'Revisar nivel de aceite', completed: false, photoRequired: true },
            { id: 'check-002', description: 'Inspeccionar pastillas de freno', completed: false, photoRequired: true },
            { id: 'check-003', description: 'Verificar presión de neumáticos', completed: false, photoRequired: false },
            { id: 'check-004', description: 'Probar sistema de luces', completed: false, photoRequired: false },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced',
        },
        {
          id: 'ticket-002',
          ticketNumber: 'TK-2025-002',
          title: 'Entrega de Equipos - Constructora XYZ',
          description: 'Entrega de herramientas y materiales de construcción',
          type: 'delivery',
          priority: 'medium',
          status: 'in_progress',
          assignedTo: 'Juan Pérez',
          assignedBy: 'Supervisor García',
          clientName: 'Constructora XYZ',
          location: {
            latitude: -34.6118,
            longitude: -58.3960,
            address: 'Obra en construcción, Av. 9 de Julio 567, Buenos Aires',
          },
          estimatedDuration: 60,
          scheduledDate: new Date().toISOString().split('T')[0],
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // Started 30 min ago
          photos: [],
          materials: [
            { id: 'mat-004', name: 'Taladros', quantity: 3, unit: 'unidades', used: 3 },
            { id: 'mat-005', name: 'Cables eléctricos', quantity: 50, unit: 'metros', used: 45 },
          ],
          checklist: [
            { id: 'check-005', description: 'Verificar estado de herramientas', completed: true, photoRequired: true },
            { id: 'check-006', description: 'Confirmar entrega con cliente', completed: false, photoRequired: false },
          ],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        },
        {
          id: 'ticket-003',
          ticketNumber: 'TK-2025-003',
          title: 'Inspección de Seguridad - Almacén Norte',
          description: 'Inspección rutinaria de protocolos de seguridad y equipos',
          type: 'inspection',
          priority: 'low',
          status: 'completed',
          assignedTo: 'Juan Pérez',
          assignedBy: 'Supervisor García',
          location: {
            latitude: -34.5875,
            longitude: -58.3974,
            address: 'Almacén Norte, Zona Industrial, Buenos Aires',
          },
          estimatedDuration: 90,
          actualDuration: 85,
          scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          photos: [],
          completionNotes: 'Inspección completada sin observaciones. Todos los protocolos en orden.',
          checklist: [
            { id: 'check-007', description: 'Verificar extintores', completed: true, photoRequired: true },
            { id: 'check-008', description: 'Revisar salidas de emergencia', completed: true, photoRequired: true },
            { id: 'check-009', description: 'Inspeccionar equipos de protección', completed: true, photoRequired: false },
          ],
          createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          syncStatus: 'synced',
        },
      ];

      // Save to local database
      await DatabaseService.saveTickets(mockTickets);
      set({ tickets: mockTickets, isLoading: false });
    } catch (error) {
      console.error('Error al cargar tickets:', error);
      set({ error: 'Error al cargar tickets', isLoading: false });
    }
  },

  createTicket: async (ticketData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newTicket: Ticket = {
        ...ticketData,
        id: `ticket-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      await DatabaseService.saveTicket(newTicket);
      
      set(state => ({
        tickets: [newTicket, ...state.tickets],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('Error al crear ticket:', error);
      set({ error: 'Error al crear ticket', isSubmitting: false });
    }
  },

  updateTicketStatus: async (ticketId: string, status: Ticket['status']) => {
    try {
      const updatedTicket = { 
        status, 
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const 
      };
      
      await DatabaseService.updateTicket(ticketId, updatedTicket);
      
      set(state => ({
        tickets: state.tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
        ),
      }));
    } catch (error) {
      console.error('Error al actualizar ticket:', error);
      set({ error: 'Error al actualizar ticket' });
    }
  },

  startTicket: async (ticketId: string) => {
    try {
      const updatedTicket = {
        status: 'in_progress' as const,
        startTime: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
      };

      await DatabaseService.updateTicket(ticketId, updatedTicket);
      
      set(state => ({
        tickets: state.tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
        ),
      }));
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

      const updatedTicket = {
        status: 'completed' as const,
        endTime: new Date().toISOString(),
        actualDuration,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
        ...completionData,
      };

      await DatabaseService.updateTicket(ticketId, updatedTicket);
      
      set(state => ({
        tickets: state.tickets.map(ticket =>
          ticket.id === ticketId ? { ...ticket, ...updatedTicket } : ticket
        ),
        currentTicket: null,
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