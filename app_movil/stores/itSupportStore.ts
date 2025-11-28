import { create } from 'zustand';

export interface ITTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  category: 'hardware' | 'software' | 'network' | 'email' | 'phone' | 'printer' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  reportedBy: string;
  assignedTo?: string;
  location: {
    building: string;
    floor?: string;
    office?: string;
    description?: string;
  };
  affectedUsers: string[];
  estimatedResolution?: string;
  actualResolution?: string;
  resolution?: string;
  comments: ITComment[];
  attachments: string[];
  relatedAssets?: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface ITComment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  type: 'comment' | 'status_change' | 'assignment' | 'resolution';
  attachments?: string[];
  createdAt: string;
  isInternal: boolean;
}

export interface ITNotification {
  id: string;
  ticketId: string;
  userId: string;
  type: 'assignment' | 'comment' | 'status_change' | 'resolution';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface ITSupportState {
  tickets: ITTicket[];
  notifications: ITNotification[];
  currentTicket: ITTicket | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadITTickets: (status?: string, assignedTo?: string) => Promise<void>;
  createITTicket: (ticketData: Omit<ITTicket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'comments'>) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: ITTicket['status'], resolution?: string) => Promise<void>;
  assignTicket: (ticketId: string, assignedTo: string) => Promise<void>;
  addComment: (ticketId: string, content: string, isInternal?: boolean, attachments?: string[]) => Promise<void>;
  addAttachment: (ticketId: string, attachmentUri: string) => void;
  loadNotifications: (userId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => void;
  setCurrentTicket: (ticket: ITTicket | null) => void;
  clearError: () => void;
}

export const useITSupportStore = create<ITSupportState>((set, get) => ({
  tickets: [],
  notifications: [],
  currentTicket: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadITTickets: async (status?: string, assignedTo?: string) => {
    set({ isLoading: true, error: null });
    try {
      const mockTickets: ITTicket[] = [
        {
          id: 'it-ticket-001',
          ticketNumber: 'TIC-2025-001',
          title: 'Impresora no imprime',
          description:
            'La impresora HP LaserJet de contabilidad no imprime. Muestra error de papel atascado pero no hay papel atascado visible.',
          category: 'printer',
          priority: 'medium',
          status: 'open',
          reportedBy: 'María Contadora',
          location: {
            building: 'Edificio Principal',
            floor: '2',
            office: 'Contabilidad',
            description: 'Impresora junto al escritorio principal',
          },
          affectedUsers: ['María Contadora', 'Juan Contador'],
          comments: [
            {
              id: 'comment-001',
              ticketId: 'it-ticket-001',
              authorId: 'user-013',
              authorName: 'Andrea González',
              content:
                'Ticket recibido. Revisaré la impresora en los próximos 30 minutos.',
              type: 'comment',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              isInternal: false,
            },
          ],
          attachments: [],
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          syncStatus: 'synced',
        },
        {
          id: 'it-ticket-002',
          ticketNumber: 'TIC-2025-002',
          title: 'Solicitud de Acceso a Sistema',
          description: 'Nuevo empleado necesita acceso al sistema de inventarios',
          category: 'software',
          priority: 'low',
          status: 'in_progress',
          reportedBy: 'Supervisor García',
          assignedTo: 'Andrea González',
          location: {
            building: 'Edificio Principal',
            floor: '1',
            office: 'Recursos Humanos',
          },
          affectedUsers: ['Nuevo Empleado'],
          comments: [
            {
              id: 'comment-002',
              ticketId: 'it-ticket-002',
              authorId: 'user-013',
              authorName: 'Andrea González',
              content:
                'Creando usuario en el sistema. Necesito confirmación del nivel de acceso requerido.',
              type: 'comment',
              createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
              isInternal: false,
            },
          ],
          attachments: [],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          syncStatus: 'pending',
        },
      ];

      const filtered = mockTickets.filter((t) => {
        const statusOk = status ? t.status === status : true;
        const assigneeOk = assignedTo ? t.assignedTo === assignedTo : true;
        return statusOk && assigneeOk;
      });

      set({ tickets: filtered, isLoading: false });
    } catch (error) {
      console.error('Error al cargar tickets de TIC:', error);
      set({ error: 'Error al cargar tickets de TIC', isLoading: false });
    }
  },

  createITTicket: async (ticketData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newTicket: ITTicket = {
        ...ticketData,
        id: `it-ticket-${Date.now()}`,
        ticketNumber: `TIC-2025-${String(Date.now()).slice(-3)}`,
        comments: [],
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      set((state) => ({
        tickets: [newTicket, ...state.tickets],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('Error al crear ticket de TIC:', error);
      set({ error: 'Error al crear ticket de TIC', isSubmitting: false });
    }
  },

  updateTicketStatus: async (ticketId: string, status: ITTicket['status'], resolution?: string) => {
    try {
      const updateData: Partial<ITTicket> = {
        status,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      if (status === 'resolved' && resolution) {
        updateData.resolution = resolution;
        updateData.resolvedAt = new Date().toISOString();
      }

      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, ...updateData } : ticket
        ),
      }));
    } catch (error) {
      console.error('Error al actualizar ticket:', error);
      set({ error: 'Error al actualizar ticket' });
    }
  },

  assignTicket: async (ticketId: string, assignedTo: string) => {
    try {
      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                assignedTo,
                status: 'in_progress',
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending',
              }
            : ticket
        ),
      }));
    } catch (error) {
      console.error('Error al asignar ticket:', error);
      set({ error: 'Error al asignar ticket' });
    }
  },

  addComment: async (ticketId: string, content: string, isInternal = false, attachments: string[] = []) => {
    try {
      const newComment: ITComment = {
        id: `comment-${Date.now()}`,
        ticketId,
        authorId: 'current-user-id',
        authorName: 'Usuario Actual',
        content,
        type: 'comment',
        attachments,
        createdAt: new Date().toISOString(),
        isInternal,
      };

      set((state) => ({
        tickets: state.tickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                comments: [...ticket.comments, newComment],
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending',
              }
            : ticket
        ),
        currentTicket:
          state.currentTicket?.id === ticketId
            ? { ...state.currentTicket, comments: [...state.currentTicket.comments, newComment] }
            : state.currentTicket,
      }));
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      set({ error: 'Error al agregar comentario' });
    }
  },

  addAttachment: (ticketId: string, attachmentUri: string) => {
    set((state) => ({
      tickets: state.tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              attachments: [...ticket.attachments, attachmentUri],
              updatedAt: new Date().toISOString(),
              syncStatus: 'pending',
            }
          : ticket
      ),
      currentTicket:
        state.currentTicket?.id === ticketId
          ? { ...state.currentTicket, attachments: [...state.currentTicket.attachments, attachmentUri] }
          : state.currentTicket,
    }));
  },

  loadNotifications: async (userId: string) => {
    try {
      const mockNotifications: ITNotification[] = [
        {
          id: 'notif-001',
          ticketId: 'it-ticket-001',
          userId,
          type: 'assignment',
          title: 'Nuevo ticket asignado',
          message: 'Se te asignó el ticket TIC-2025-001',
          read: false,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        },
      ];

      set({ notifications: mockNotifications });
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      set({ error: 'Error al cargar notificaciones' });
    }
  },

  markNotificationAsRead: (notificationId: string) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      ),
    }));
  },

  setCurrentTicket: (ticket: ITTicket | null) => {
    set({ currentTicket: ticket });
  },

  clearError: () => {
    set({ error: null });
  },
}));