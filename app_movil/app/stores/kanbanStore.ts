import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';

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

export const useKanbanStore = create<KanbanState>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadUserTasks: async (userId: string, filters?: { type?: string; status?: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Mock data for user tasks - this would come from API based on user role and assignments
      const mockTasks: KanbanTask[] = [
        {
          id: 'task-001',
          title: 'Ruta Matutina - Zona Norte',
          description: 'Completar entregas en zona norte, 3 paradas programadas',
          type: 'route',
          priority: 'high',
          status: 'in_progress',
          assignedTo: userId,
          assignedBy: 'Supervisor García',
          dueDate: new Date().toISOString(),
          estimatedHours: 4,
          tags: ['transporte', 'zona-norte'],
          relatedEntityId: 'route-001',
          relatedEntityType: 'route',
          progress: 33,
          attachments: [],
          comments: [],
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced',
        },
        {
          id: 'task-002',
          title: 'Limpieza Oficinas Administrativas',
          description: 'Limpieza completa de oficinas del segundo piso',
          type: 'cleaning',
          priority: 'medium',
          status: 'pending',
          assignedTo: userId,
          assignedBy: 'Supervisor Limpieza',
          dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          estimatedHours: 2,
          tags: ['aseo', 'oficinas'],
          relatedEntityId: 'cleaning-001',
          relatedEntityType: 'cleaning_report',
          progress: 0,
          attachments: [],
          comments: [],
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          syncStatus: 'pending',
        },
        {
          id: 'task-003',
          title: 'Reparación Acera Principal',
          description: 'Reparar grietas en acera del edificio administrativo',
          type: 'civil_work',
          priority: 'high',
          status: 'pending',
          assignedTo: userId,
          assignedBy: 'Supervisor Obras',
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          estimatedHours: 8,
          tags: ['obras', 'reparación'],
          relatedEntityId: 'work-001',
          relatedEntityType: 'work_order',
          progress: 0,
          attachments: [],
          comments: [],
          approvals: [
            {
              id: 'approval-001',
              taskId: 'task-003',
              approverId: 'user-004',
              approverName: 'Ana Martínez',
              status: 'pending',
              level: 1,
            },
          ],
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          syncStatus: 'pending',
        },
        {
          id: 'task-004',
          title: 'Configurar Nueva Impresora',
          description: 'Instalar y configurar impresora HP en oficina de ventas',
          type: 'it_ticket',
          priority: 'medium',
          status: 'completed',
          assignedTo: userId,
          assignedBy: 'Andrea González',
          dueDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          estimatedHours: 1,
          actualHours: 0.75,
          tags: ['hardware', 'instalación'],
          relatedEntityId: 'it-ticket-003',
          relatedEntityType: 'it_ticket',
          progress: 100,
          attachments: [],
          comments: [
            {
              id: 'comment-003',
              taskId: 'task-004',
              authorId: userId,
              authorName: 'Usuario Actual',
              content: 'Impresora instalada y funcionando correctamente. Usuarios capacitados.',
              attachments: [],
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
          ],
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          syncStatus: 'synced',
        },
      ];

      // Filter by user role and permissions
      const userTasks = mockTasks.filter(task => task.assignedTo === userId);

      set({ tasks: userTasks, isLoading: false });
    } catch (error) {
      set({ error: 'Error al cargar tareas', isLoading: false });
    }
  },

  updateTaskStatus: async (taskId: string, status: KanbanTask['status']) => {
    try {
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending' as const,
      };

      if (status === 'completed') {
        updateData.completedAt = new Date().toISOString();
        updateData.progress = 100;
      } else if (status === 'in_progress') {
        updateData.progress = Math.max(1, updateData.progress || 0);
      }

      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId ? { ...task, ...updateData } : task
        ),
      }));
    } catch (error) {
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
      set({ error: 'Error al solicitar aprobación' });
    }
  },

  processApproval: async (taskId: string, approvalId: string, status: 'approved' | 'rejected', notes?: string) => {
    try {
      set(state => ({
        tasks: state.tasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                approvals: task.approvals?.map(approval =>
                  approval.id === approvalId
                    ? {
                        ...approval,
                        status,
                        notes,
                        approvedAt: new Date().toISOString(),
                      }
                    : approval
                ),
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const,
              }
            : task
        ),
      }));
    } catch (error) {
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