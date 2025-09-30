import { create } from 'zustand';
import { useTicketStore } from './ticketStore';
import type { Ticket } from './ticketStore';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  type: 'route' | 'cleaning' | 'civil_work' | 'it_ticket' | 'approval' | 'maintenance' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo: string;
  assignedBy: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  relatedEntityId: string; // ID of the related route, ticket, etc.
  relatedEntityType: string;
  progress: number; // 0-100
  attachments: string[];
  comments: TaskComment[];
  approvals?: TaskApproval[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  attachments?: string[];
  createdAt: string;
}

export interface TaskApproval {
  id: string;
  taskId: string;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  approvedAt?: string;
  level: number; // 1: supervisor, 2: manager, 3: finance
}

interface KanbanState {
  tasks: KanbanTask[];
  currentTask: KanbanTask | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadUserTasks: (userId: string, filters?: { type?: string; status?: string }) => Promise<void>;
  updateTaskStatus: (taskId: string, status: KanbanTask['status']) => Promise<void>;
  updateTaskProgress: (taskId: string, progress: number) => Promise<void>;
  addTaskComment: (taskId: string, content: string, attachments?: string[]) => Promise<void>;
  addTaskAttachment: (taskId: string, attachmentUri: string) => void;
  requestApproval: (taskId: string, approverIds: string[]) => Promise<void>;
  processApproval: (taskId: string, approvalId: string, status: 'approved' | 'rejected', notes?: string) => Promise<void>;
  setCurrentTask: (task: KanbanTask | null) => void;
  clearError: () => void;
}

function applyApprovalToTasks(
  tasks: KanbanTask[],
  taskId: string,
  approvalId: string,
  status: 'approved' | 'rejected',
  notes?: string
): KanbanTask[] {
  const approvedAt = new Date().toISOString();
  return tasks.map((task) => {
    if (task.id !== taskId) return task;
    const approvals = task.approvals?.map((approval) =>
      approval.id === approvalId
        ? { ...approval, status, notes, approvedAt }
        : approval
    );
    return { ...task, approvals, updatedAt: approvedAt, syncStatus: 'pending' };
  });
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadUserTasks: async (userId: string, filters?: { type?: string; status?: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Asegura que los tickets estén cargados desde backend
      const ticketState = useTicketStore.getState();
      if (!ticketState.tickets || ticketState.tickets.length === 0) {
        await ticketState.loadTickets();
      }

      let tasks = mapTicketsToTasks(ticketState.tickets);

      // Filtros opcionales
      if (filters?.type && filters.type !== 'all') {
        tasks = tasks.filter(t => t.type === filters.type);
      }
      if (filters?.status && filters.status !== 'all') {
        tasks = tasks.filter(t => t.status === filters.status);
      }

      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('Error al cargar tareas:', error);
      set({ error: 'Error al cargar tareas', isLoading: false });
    }
  },

  updateTaskStatus: async (taskId: string, status: KanbanTask['status']) => {
    try {
      // Delegar cambios al backend vía ticketStore
      const ticketState = useTicketStore.getState();
      if (status === 'in_progress') {
        await ticketState.startTicket(taskId);
      } else if (status === 'completed') {
        await ticketState.completeTicket(taskId, {});
      } else if (status === 'cancelled') {
        await ticketState.updateTicketStatus(taskId, 'cancelled');
      } else {
        // pending
        await ticketState.updateTicketStatus(taskId, 'assigned');
      }

      // Refrescar tareas mapeadas desde tickets
      const tasks = mapTicketsToTasks(ticketState.tickets);
      set({ tasks });
    } catch (error) {
      console.error('Error al actualizar estado de tarea:', error);
      set({ error: 'Error al actualizar estado de tarea' });
    }
  },

  updateTaskProgress: async (taskId: string, progress: number) => {
    try {
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId 
            ? { 
                ...task, 
                progress: Math.max(0, Math.min(100, progress)),
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const,
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error al actualizar progreso:', error);
      set({ error: 'Error al actualizar progreso' });
    }
  },

  addTaskComment: async (taskId: string, content: string, attachments = []) => {
    try {
      const newComment: TaskComment = {
        id: `comment-${Date.now()}`,
        taskId,
        authorId: 'current-user-id', // In real app, get from auth
        authorName: 'Usuario Actual',
        content,
        attachments,
        createdAt: new Date().toISOString(),
      };

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                comments: [...task.comments, newComment],
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const,
              }
            : task
        ),
        currentTask: state.currentTask?.id === taskId
          ? {
              ...state.currentTask,
              comments: [...state.currentTask.comments, newComment],
            }
          : state.currentTask,
      }));
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      set({ error: 'Error al agregar comentario' });
    }
  },

  addTaskAttachment: (taskId: string, attachmentUri: string) => {
    set(state => ({
      tasks: state.tasks.map(task =>
        task.id === taskId
          ? { 
              ...task, 
              attachments: [...task.attachments, attachmentUri],
              updatedAt: new Date().toISOString(),
              syncStatus: 'pending' as const,
            }
          : task
      ),
      currentTask: state.currentTask?.id === taskId
        ? { 
            ...state.currentTask, 
            attachments: [...state.currentTask.attachments, attachmentUri] 
          }
        : state.currentTask,
    }));
  },

  requestApproval: async (taskId: string, approverIds: string[]) => {
    try {
      const approvals: TaskApproval[] = approverIds.map((approverId, index) => ({
        id: `approval-${Date.now()}-${index}`,
        taskId,
        approverId,
        approverName: `Aprobador ${index + 1}`, // In real app, get from user data
        status: 'pending',
        level: index + 1,
      }));

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                approvals: [...(task.approvals || []), ...approvals],
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const,
              }
            : task
        ),
      }));
    } catch (error) {
      console.error('Error al solicitar aprobación:', error);
      set({ error: 'Error al solicitar aprobación' });
    }
  },

  processApproval: async (taskId: string, approvalId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      const updated = applyApprovalToTasks(get().tasks, taskId, approvalId, status, notes);
      set({ tasks: updated });
    } catch (error) {
      console.error('Error al procesar aprobación:', error);
      set({ error: 'Error al procesar aprobación' });
    }
  },

  setCurrentTask: (task: KanbanTask | null) => {
    set({ currentTask: task });
  },

  clearError: () => {
    set({ error: null });
  },
}));

// --- Helpers de mapeo desde tickets a tareas Kanban ---
function mapTicketTypeToTaskType(ticketType: Ticket['type']): KanbanTask['type'] {
  switch (ticketType) {
    case 'maintenance':
      return 'maintenance';
    case 'inspection':
      return 'inspection';
    case 'delivery':
    case 'pickup':
      return 'route';
    case 'repair':
      return 'maintenance';
    default:
      return 'it_ticket';
  }
}

function mapTicketStatusToTaskStatus(status: Ticket['status']): KanbanTask['status'] {
  switch (status) {
    case 'in_progress':
      return 'in_progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
}

function computeProgressFromTicket(t: Ticket): number {
  if (t.status === 'completed') return 100;
  if (t.actualDuration && t.estimatedDuration > 0) {
    return Math.max(1, Math.min(99, Math.round((t.actualDuration / t.estimatedDuration) * 100)));
  }
  return t.status === 'in_progress' ? 50 : 0;
}

function mapTicketToTask(t: Ticket): KanbanTask {
  const dueDateIso = t.scheduledDate ? new Date(t.scheduledDate).toISOString() : undefined;
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    type: mapTicketTypeToTaskType(t.type),
    priority: t.priority,
    status: mapTicketStatusToTaskStatus(t.status),
    assignedTo: t.assignedTo || '',
    assignedBy: t.assignedBy || '',
    dueDate: dueDateIso,
    estimatedHours: t.estimatedDuration ? Math.round(t.estimatedDuration / 60) : undefined,
    actualHours: t.actualDuration ? Math.round(t.actualDuration / 60) : undefined,
    tags: [],
    relatedEntityId: t.id,
    relatedEntityType: 'it_ticket',
    progress: computeProgressFromTicket(t),
    attachments: t.photos || [],
    comments: [],
    approvals: undefined,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    completedAt: t.endTime,
    syncStatus: 'synced',
  };
}

function mapTicketsToTasks(tickets: Ticket[]): KanbanTask[] {
  return tickets.map(mapTicketToTask);
}