import { create } from 'zustand';
import { CivilWorksApi, CivilWorkStatus as BStatus, CivilWorkType as BType, CivilWork } from '@/services/CivilWorksApi';

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
  if (current?.id !== orderId) return current;
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
  if (current?.id !== orderId) return current;
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
  // paginación
  page: number;
  pageSize: number;
  total: number;
  isLoadingMore: boolean;
  
  // Actions
  loadWorkOrders: (status?: string, dateRange?: { start: string; end: string }) => Promise<void>;
  fetchAndSetCurrentWorkOrder: (orderId: string) => Promise<void>;
  loadMoreWorkOrders: (status?: string, dateRange?: { start: string; end: string }) => Promise<void>;
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

// Mapeos backend -> UI centralizados
const mapStatusToUi = (s: BStatus): WorkOrder['status'] => {
  switch (s) {
    case 'COMPLETED': return 'completed';
    case 'IN_PROGRESS': return 'in_progress';
    case 'ON_HOLD': return 'on_hold';
    case 'PENDING':
    default: return 'assigned';
  }
};
const mapTypeToUi = (t: BType): WorkOrder['type'] => {
  switch (t) {
    case 'CONSTRUCTION': return 'construction';
    case 'REPAIR': return 'repair';
    case 'MAINTENANCE': return 'maintenance';
    case 'INSPECTION':
    default: return 'inspection';
  }
};

export const useCivilWorksStore = create<CivilWorksState>((set, get) => ({
  workOrders: [],
  currentWorkOrder: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  page: 1,
  pageSize: 20,
  total: 0,
  isLoadingMore: false,

  // Helpers de mapeo backend -> UI
  
  loadWorkOrders: async (status?: string, dateRange?: { start: string; end: string }) => {
    set({ isLoading: true, error: null });
    try {
      // 1) Obtener lista paginada desde backend
      const { pageSize } = get();
      const { items, total } = await CivilWorksApi.list(1, pageSize);

      const mapStatus = mapStatusToUi;
      const mapType = mapTypeToUi;

      const mapped: WorkOrder[] = items.map(it => ({
        id: String(it.id),
        orderNumber: `OC-${String(it.id).padStart(4, '0')}`,
        title: it.project,
        description: '',
        type: mapType(it.workType),
        priority: 'medium',
        status: mapStatus(it.status),
        assignedTo: it.responsibleStaff?.map(String) ?? [],
        assignedBy: '',
        location: {
          latitude: 0,
          longitude: 0,
          address: it.location,
          site: it.location,
        },
        estimatedDuration: 8,
        actualDuration: undefined,
        scheduledDate: it.date,
        materials: [],
        safetyChecklist: [],
        progressPhotos: [],
        notes: undefined,
        completionNotes: undefined,
        supervisorApproval: undefined,
        createdAt: it.date,
        updatedAt: it.date,
        syncStatus: 'synced',
      }));

      // 3) Filtro en cliente si se especifica
      const filtered = mapped.filter(order => {
        if (status && status !== 'all' && order.status !== status) return false;
        if (dateRange) {
          const d = new Date(order.scheduledDate).getTime();
          const s = new Date(dateRange.start).getTime();
          const e = new Date(dateRange.end).getTime();
          if (d < s || d > e) return false;
        }
        return true;
      });

      set({ workOrders: filtered, isLoading: false, page: 1, total });
    } catch (error) {
      console.error('Error al cargar órdenes de trabajo:', error);
      set({ error: 'Error al cargar órdenes de trabajo', isLoading: false });
    }
  },

  loadMoreWorkOrders: async (status?: string, dateRange?: { start: string; end: string }) => {
    const { isLoading, isLoadingMore, workOrders, page, pageSize, total } = get();
    if (isLoading || isLoadingMore) return;
    if (workOrders.length >= total) return; // no hay más
    const nextPage = page + 1;
    set({ isLoadingMore: true });
    try {
      const { items } = await CivilWorksApi.list(nextPage, pageSize);
      const mapped: WorkOrder[] = items.map(it => ({
        id: String(it.id),
        orderNumber: `OC-${String(it.id).padStart(4, '0')}`,
        title: it.project,
        description: '',
        type: mapTypeToUi(it.workType),
        priority: 'medium',
        status: mapStatusToUi(it.status),
        assignedTo: it.responsibleStaff?.map(String) ?? [],
        assignedBy: '',
        location: {
          latitude: 0,
          longitude: 0,
          address: it.location,
          site: it.location,
        },
        estimatedDuration: 8,
        actualDuration: undefined,
        scheduledDate: it.date,
        materials: [],
        safetyChecklist: [],
        progressPhotos: [],
        notes: undefined,
        completionNotes: undefined,
        supervisorApproval: undefined,
        createdAt: it.date,
        updatedAt: it.date,
        syncStatus: 'synced',
      }));

      // filtro del lado cliente si aplica
      const appended = [...workOrders, ...mapped].filter(order => {
        if (status && status !== 'all' && order.status !== status) return false;
        if (dateRange) {
          const d = new Date(order.scheduledDate).getTime();
          const s = new Date(dateRange.start).getTime();
          const e = new Date(dateRange.end).getTime();
          if (d < s || d > e) return false;
        }
        return true;
      });

      set({ workOrders: appended, page: nextPage, isLoadingMore: false });
    } catch (error) {
      console.error('Error al cargar más obras civiles:', error);
      set({ isLoadingMore: false });
    }
  },

  fetchAndSetCurrentWorkOrder: async (orderId: string) => {
    try {
      const idNum = Number(orderId);
      if (Number.isNaN(idNum)) return;
      const cw: CivilWork = await CivilWorksApi.get(idNum);

      const mapStatus = mapStatusToUi;
      const mapType = mapTypeToUi;
      const parseMaterial = (s: string, idx: number): WorkMaterial => {
        // Intento de parseo: "Nombre: 10 sacos" o "Nombre 10 sacos"
        const [left, right] = s.includes(':') ? s.split(':', 2).map(x => x.trim()) : [s, ''];
  const re = /(\d+(?:\.\d+)?)/;
  const exec = re.exec(right);
  const quantity = exec ? Number.parseFloat(exec[1]) : 1;
  const unit = exec ? right.slice(exec.index + exec[1].length).trim() : '';
        return {
          id: `mat-${idx}`,
          name: left || s,
          quantity: Number.isFinite(quantity) ? quantity : 1,
          unit: unit || '',
          category: 'other',
        };
      };

      const wo: WorkOrder = {
        id: String(cw.id),
        orderNumber: `OC-${String(cw.id).padStart(4, '0')}`,
        title: cw.project,
        description: cw.observations || '',
        type: mapType(cw.workType),
        priority: 'medium',
        status: mapStatus(cw.status),
        assignedTo: cw.responsibleStaff?.map(String) ?? [],
        assignedBy: '',
        location: {
          latitude: 0,
          longitude: 0,
          address: cw.location,
          site: cw.location,
        },
        estimatedDuration: cw.timeSpent ?? 8,
        actualDuration: cw.status === 'COMPLETED' ? (cw.timeSpent ?? undefined) : undefined,
        scheduledDate: cw.date,
        startTime: undefined,
        endTime: undefined,
        materials: cw.materialsUsed?.map(parseMaterial) ?? [],
        safetyChecklist: [],
        progressPhotos: cw.photos?.map((p, idx) => ({
          id: `photo-${cw.id}-${idx}`,
          uri: p,
          description: '',
          takenAt: new Date().toISOString(),
          takenBy: 'Sistema',
          stage: 'during',
        })) ?? [],
        notes: cw.observations || undefined,
        completionNotes: undefined,
        supervisorApproval: undefined,
        createdAt: (cw as any).createdAt || cw.date,
        updatedAt: (cw as any).updatedAt || cw.date,
        syncStatus: 'synced',
      };

      set({ currentWorkOrder: wo });
    } catch (error) {
      console.error('Error al obtener detalle de obra civil:', error);
      set({ error: 'Error al obtener detalle de obra civil' });
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
      // Mapear estado UI -> backend
      const toBackend = (s: WorkOrder['status']): BStatus => {
        switch (s) {
          case 'completed': return 'COMPLETED';
          case 'in_progress': return 'IN_PROGRESS';
          case 'on_hold': return 'ON_HOLD';
          case 'assigned':
          default: return 'PENDING';
        }
      };
      const idNum = Number(orderId);
      if (!Number.isNaN(idNum)) {
        await CivilWorksApi.update(idNum, { status: toBackend(status) });
      }
      set(state => ({
        workOrders: state.workOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status, 
                updatedAt: new Date().toISOString(),
                syncStatus: 'synced' as const 
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
      await get().updateWorkOrderStatus(orderId, 'in_progress');
      set(state => ({
        workOrders: state.workOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                startTime: new Date().toISOString(),
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

      await get().updateWorkOrderStatus(orderId, 'completed');
      set(state => ({
        workOrders: state.workOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                endTime: new Date().toISOString(),
                actualDuration,
                updatedAt: new Date().toISOString(),
                syncStatus: 'synced' as const,
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