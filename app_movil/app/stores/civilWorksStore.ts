import { create } from 'zustand';

export interface WorkOrder {
  id: string;
  orderNumber: string;
  title: string;
  description: string;
  type: 'maintenance' | 'construction' | 'repair' | 'inspection' | 'installation';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assignedTo: string[];
  assignedBy: string;
  clientName?: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    site?: string;
  };
  estimatedDuration: number; // hours
  actualDuration?: number;
  scheduledDate: string;
  startTime?: string;
  endTime?: string;
  materials: WorkMaterial[];
  safetyChecklist: SafetyChecklistItem[];
  progressPhotos: ProgressPhoto[];
  notes?: string;
  completionNotes?: string;
  supervisorApproval?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  };
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface WorkMaterial {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'cement' | 'steel' | 'tools' | 'electrical' | 'plumbing' | 'other';
  used?: number;
  cost?: number;
  supplier?: string;
  notes?: string;
}

export interface SafetyChecklistItem {
  id: string;
  description: string;
  category: 'ppe' | 'site_conditions' | 'equipment' | 'procedures';
  completed: boolean;
  notes?: string;
  photoRequired: boolean;
  photoPath?: string;
  completedBy?: string;
  completedAt?: string;
}

export interface ProgressPhoto {
  id: string;
  uri: string;
  description: string;
  takenAt: string;
  takenBy: string;
  stage: 'before' | 'during' | 'after' | 'issue';
}

const updateOrderMaterialUsage = (
  orders: WorkOrder[],
  orderId: string,
  materialId: string,
  used: number
): WorkOrder[] =>
  orders.map(order =>
    order.id === orderId
      ? {
          ...order,
          materials: order.materials.map(material =>
            material.id === materialId ? { ...material, used } : material
          ),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        }
      : order
  );

const updateCurrentOrderMaterialUsage = (
  current: WorkOrder | null,
  orderId: string,
  materialId: string,
  used: number
): WorkOrder | null => {
  if (!current || current.id !== orderId) return current;
  return {
    ...current,
    materials: current.materials.map(material =>
      material.id === materialId ? { ...material, used } : material
    ),
  };
};

const updateOrderSafetyChecklist = (
  orders: WorkOrder[],
  orderId: string,
  itemId: string,
  completed: boolean,
  notes?: string,
  photoPath?: string
): WorkOrder[] =>
  orders.map(order =>
    order.id === orderId
      ? {
          ...order,
          safetyChecklist: order.safetyChecklist.map(item =>
            item.id === itemId
              ? {
                  ...item,
                  completed,
                  notes,
                  photoPath,
                  completedAt: completed ? new Date().toISOString() : undefined,
                }
              : item
          ),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        }
      : order
  );

const updateCurrentOrderSafetyChecklist = (
  current: WorkOrder | null,
  orderId: string,
  itemId: string,
  completed: boolean,
  notes?: string,
  photoPath?: string
): WorkOrder | null => {
  if (!current || current.id !== orderId) return current;
  return {
    ...current,
    safetyChecklist: current.safetyChecklist.map(item =>
      item.id === itemId
        ? {
            ...item,
            completed,
            notes,
            photoPath,
            completedAt: completed ? new Date().toISOString() : undefined,
          }
        : item
    ),
  };
};

interface CivilWorksState {
  workOrders: WorkOrder[];
  currentWorkOrder: WorkOrder | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadWorkOrders: (status?: string, dateRange?: { start: string; end: string }) => Promise<void>;
  createWorkOrder: (orderData: Omit<WorkOrder, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => Promise<void>;
  updateWorkOrderStatus: (orderId: string, status: WorkOrder['status']) => Promise<void>;
  startWorkOrder: (orderId: string) => Promise<void>;
  completeWorkOrder: (orderId: string, completionData: {
    completionNotes?: string;
    materials?: WorkMaterial[];
    safetyChecklist?: SafetyChecklistItem[];
  }) => Promise<void>;
  addProgressPhoto: (orderId: string, photo: Omit<ProgressPhoto, 'id'>) => void;
  updateMaterialUsage: (orderId: string, materialId: string, used: number) => void;
  updateSafetyChecklist: (orderId: string, itemId: string, completed: boolean, notes?: string, photoPath?: string) => void;
  setCurrentWorkOrder: (workOrder: WorkOrder | null) => void;
  clearError: () => void;
}

export const useCivilWorksStore = create<CivilWorksState>((set, get) => ({
  workOrders: [],
  currentWorkOrder: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadWorkOrders: async (status?: string, dateRange?: { start: string; end: string }) => {
    set({ isLoading: true, error: null });
    try {
      // Mock data for work orders
      const mockWorkOrders: WorkOrder[] = [
        {
          id: 'work-001',
          orderNumber: 'OT-2025-001',
          title: 'Reparación de Acera Principal',
          description: 'Reparar grietas en la acera principal del edificio administrativo',
          type: 'repair',
          priority: 'high',
          status: 'assigned',
          assignedTo: ['Miguel Rodríguez', 'Fernando Silva'],
          assignedBy: 'Supervisor García',
          location: {
            latitude: -34.6037,
            longitude: -58.3816,
            address: 'Av. Principal 123, Buenos Aires',
            site: 'Edificio Administrativo',
          },
          estimatedDuration: 8,
          scheduledDate: new Date().toISOString().split('T')[0],
          materials: [
            {
              id: 'mat-001',
              name: 'Cemento Portland',
              quantity: 10,
              unit: 'bolsas',
              category: 'cement',
              cost: 50,
            },
            {
              id: 'mat-002',
              name: 'Arena Fina',
              quantity: 2,
              unit: 'm³',
              category: 'other',
              cost: 80,
            },
          ],
          safetyChecklist: [
            {
              id: 'safety-001',
              description: 'Uso de casco de seguridad',
              category: 'ppe',
              completed: false,
              photoRequired: true,
            },
            {
              id: 'safety-002',
              description: 'Verificar condiciones del terreno',
              category: 'site_conditions',
              completed: false,
              photoRequired: true,
            },
            {
              id: 'safety-003',
              description: 'Inspeccionar herramientas',
              category: 'equipment',
              completed: false,
              photoRequired: false,
            },
          ],
          progressPhotos: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'synced',
        },
        {
          id: 'work-002',
          orderNumber: 'OT-2025-002',
          title: 'Instalación de Luminarias LED',
          description: 'Reemplazar luminarias tradicionales por LED en área de almacén',
          type: 'installation',
          priority: 'medium',
          status: 'in_progress',
          assignedTo: ['Miguel Rodríguez'],
          assignedBy: 'Supervisor García',
          location: {
            latitude: -34.6118,
            longitude: -58.3960,
            address: 'Zona Industrial 456, Buenos Aires',
            site: 'Almacén Norte',
          },
          estimatedDuration: 4,
          scheduledDate: new Date().toISOString().split('T')[0],
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          materials: [
            {
              id: 'mat-003',
              name: 'Luminarias LED 40W',
              quantity: 12,
              unit: 'unidades',
              category: 'electrical',
              used: 8,
              cost: 120,
            },
          ],
          safetyChecklist: [
            {
              id: 'safety-004',
              description: 'Cortar energía eléctrica',
              category: 'procedures',
              completed: true,
              photoRequired: false,
              completedBy: 'Miguel Rodríguez',
              completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
            },
          ],
          progressPhotos: [
            {
              id: 'photo-001',
              uri: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg',
              description: 'Estado inicial del área',
              takenAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              takenBy: 'Miguel Rodríguez',
              stage: 'before',
            },
          ],
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        },
      ];

      set({ workOrders: mockWorkOrders, isLoading: false });
    } catch (error) {
      console.error('Error al cargar órdenes de trabajo:', error);
      set({ error: 'Error al cargar órdenes de trabajo', isLoading: false });
    }
  },

  createWorkOrder: async (orderData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newWorkOrder: WorkOrder = {
        ...orderData,
        id: `work-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      set(state => ({
        workOrders: [newWorkOrder, ...state.workOrders],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('Error al crear orden de trabajo:', error);
      set({ error: 'Error al crear orden de trabajo', isSubmitting: false });
    }
  },

  updateWorkOrderStatus: async (orderId: string, status: WorkOrder['status']) => {
    try {
      set(state => ({
        workOrders: state.workOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status, 
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const 
              }
            : order
        ),
      }));
    } catch (error) {
      console.error('Error al actualizar orden de trabajo:', error);
      set({ error: 'Error al actualizar orden de trabajo' });
    }
  },

  startWorkOrder: async (orderId: string) => {
    try {
      set(state => ({
        workOrders: state.workOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status: 'in_progress' as const,
                startTime: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const 
              }
            : order
        ),
      }));
    } catch (error) {
      console.error('Error al iniciar orden de trabajo:', error);
      set({ error: 'Error al iniciar orden de trabajo' });
    }
  },

  completeWorkOrder: async (orderId: string, completionData) => {
    try {
      const order = get().workOrders.find(o => o.id === orderId);
      if (!order) return;

      const actualDuration = order.startTime 
        ? Math.round((Date.now() - new Date(order.startTime).getTime()) / (1000 * 60 * 60))
        : undefined;

      set(state => ({
        workOrders: state.workOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status: 'completed' as const,
                endTime: new Date().toISOString(),
                actualDuration,
                updatedAt: new Date().toISOString(),
                syncStatus: 'pending' as const,
                ...completionData,
              }
            : order
        ),
        currentWorkOrder: null,
      }));
    } catch (error) {
      console.error('Error al completar orden de trabajo:', error);
      set({ error: 'Error al completar orden de trabajo' });
    }
  },

  addProgressPhoto: (orderId: string, photo: Omit<ProgressPhoto, 'id'>) => {
    const newPhoto: ProgressPhoto = {
      ...photo,
      id: `photo-${Date.now()}`,
    };

    set(state => ({
      workOrders: state.workOrders.map(order =>
        order.id === orderId
          ? { 
              ...order, 
              progressPhotos: [...order.progressPhotos, newPhoto],
              updatedAt: new Date().toISOString(),
              syncStatus: 'pending' as const,
            }
          : order
      ),
      currentWorkOrder: state.currentWorkOrder?.id === orderId
        ? { 
            ...state.currentWorkOrder, 
            progressPhotos: [...state.currentWorkOrder.progressPhotos, newPhoto] 
          }
        : state.currentWorkOrder,
    }));
  },

  updateMaterialUsage: (orderId: string, materialId: string, used: number) => {
    set(state => ({
      workOrders: updateOrderMaterialUsage(state.workOrders, orderId, materialId, used),
      currentWorkOrder: updateCurrentOrderMaterialUsage(state.currentWorkOrder, orderId, materialId, used),
    }));
  },

  updateSafetyChecklist: (orderId: string, itemId: string, completed: boolean, notes?: string, photoPath?: string) => {
    set(state => ({
      workOrders: updateOrderSafetyChecklist(state.workOrders, orderId, itemId, completed, notes, photoPath),
      currentWorkOrder: updateCurrentOrderSafetyChecklist(state.currentWorkOrder, orderId, itemId, completed, notes, photoPath),
    }));
  },

  setCurrentWorkOrder: (workOrder: WorkOrder | null) => {
    set({ currentWorkOrder: workOrder });
  },

  clearError: () => {
    set({ error: null });
  },
}));