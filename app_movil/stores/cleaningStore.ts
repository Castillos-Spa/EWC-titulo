import { create } from 'zustand';
import { CleaningApi, type CleaningRecord, type CreateCleaningInput } from '../services/CleaningApi';
import { useAuthStore } from './authStore';

export interface CleaningArea {
  id: string;
  name: string;
  type: 'office' | 'bathroom' | 'warehouse' | 'exterior' | 'common_area';
  floor?: string;
  building?: string;
  estimatedTime: number; // minutes
}

export interface CleaningTask {
  id: string;
  areaId: string;
  description: string;
  completed: boolean;
  notes?: string;
  photoRequired: boolean;
  photoPath?: string;
  completedAt?: string;
}

export interface CleaningReport {
  id: string;
  date: string;
  shift: 'morning' | 'afternoon' | 'night';
  crewMembers: string[];
  areas: CleaningArea[];
  tasks: CleaningTask[];
  startTime: string;
  endTime?: string;
  status: 'pending' | 'in_progress' | 'completed';
  photos: string[];
  notes?: string;
  supervisorApproval?: {
    approved: boolean;
    approvedBy: string;
    approvedAt: string;
    notes?: string;
  };
  supplies: SupplyUsage[];
  incidents: string[]; // incident IDs
  createdBy: string;
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SupplyUsage {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'cleaning' | 'safety' | 'tools';
}

export interface SupplyRequest {
  id: string;
  requestedBy: string;
  requestedAt: string;
  items: SupplyRequestItem[];
  justification: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  estimatedCost?: number;
  deliveryDate?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface SupplyRequestItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'cleaning' | 'safety' | 'tools';
  estimatedPrice?: number;
  supplier?: string;
}

interface CleaningState {
  reports: CleaningReport[];
  supplyRequests: SupplyRequest[];
  currentReport: CleaningReport | null;
  currentSupplyRequest: SupplyRequest | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  loadCleaningReports: (dateRange?: { start: string; end: string }) => Promise<void>;
  createCleaningReport: (reportData: Omit<CleaningReport, 'id' | 'createdAt' | 'syncStatus'>) => Promise<void>;
  updateReportStatus: (reportId: string, status: CleaningReport['status']) => Promise<void>;
  completeTask: (reportId: string, taskId: string, notes?: string, photoPath?: string) => Promise<void>;
  addReportPhoto: (reportId: string, photoUri: string) => void;
  createSupplyRequest: (requestData: Omit<SupplyRequest, 'id' | 'requestedAt' | 'syncStatus'>) => Promise<void>;
  loadSupplyRequests: () => Promise<void>;
  setCurrentReport: (report: CleaningReport | null) => void;
  setCurrentSupplyRequest: (request: SupplyRequest | null) => void;
  clearError: () => void;
}

const completeTaskInReports = (
  reports: CleaningReport[],
  reportId: string,
  taskId: string,
  notes?: string,
  photoPath?: string
): CleaningReport[] =>
  reports.map(report =>
    report.id === reportId
      ? {
          ...report,
          tasks: report.tasks.map(task =>
            task.id === taskId
              ? { ...task, completed: true, notes, photoPath, completedAt: new Date().toISOString() }
              : task
          ),
          syncStatus: 'pending',
        }
      : report
  );

const addPhotoToReports = (
  reports: CleaningReport[],
  reportId: string,
  photoUri: string
): CleaningReport[] =>
  reports.map(report =>
    report.id === reportId ? { ...report, photos: [...report.photos, photoUri] } : report
  );

const addPhotoToCurrentReport = (
  current: CleaningReport | null,
  reportId: string,
  photoUri: string
): CleaningReport | null => {
  if (current?.id !== reportId) return current;
  return { ...current, photos: [...current.photos, photoUri] };
};

export const useCleaningStore = create<CleaningState>((set, get) => ({
  reports: [],
  supplyRequests: [],
  currentReport: null,
  currentSupplyRequest: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  loadCleaningReports: async (_dateRange?: { start: string; end: string }) => {
    set({ isLoading: true, error: null });
    try {
      const { items } = await CleaningApi.list(1, 50);
      // Mapear registros del backend a modelo de UI; por ahora mostramos como una lista simple
      const mapped: CleaningReport[] = items.map((r: CleaningRecord) => {
        let statusUi: CleaningReport['status'] = 'in_progress';
        if (r.status === 'COMPLETED') statusUi = 'completed';
        else if (r.status === 'PENDING') statusUi = 'pending';
        return {
          id: String(r.id),
          date: new Date(r.date).toISOString().split('T')[0],
          shift: 'morning', // sin campo en backend; asumimos 'morning' por defecto
          crewMembers: r.responsibleStaff ? [r.responsibleStaff] : [],
          areas: [],
          tasks: [],
          startTime: new Date(r.date).toISOString(),
          status: statusUi,
          photos: [],
          supplies: [],
          incidents: [],
          createdBy: r.responsibleStaff || 'Desconocido',
          createdAt: new Date(r.date).toISOString(),
          syncStatus: 'synced',
        };
      });
      set({ reports: mapped, isLoading: false });
    } catch (error) {
      console.error('Error al cargar reportes de limpieza:', error);
      set({ error: 'Error al cargar reportes de limpieza', isLoading: false });
    }
  },

  createCleaningReport: async (reportData) => {
    set({ isSubmitting: true, error: null });
    try {
      // Mapear a DTO del backend
      const { user } = useAuthStore.getState();
      const input: CreateCleaningInput = {
        date: new Date().toISOString(),
        area: reportData.areas?.[0]?.name || 'General',
        tasks: reportData.tasks?.map(t => t.description) || [],
        responsibleStaff: user?.name || 'Usuario',
        timeSpent: 60,
        issues: [],
        status: 'PENDING',
        observations: reportData.notes,
      };
      const created = await CleaningApi.create(input);
      const ui: CleaningReport = {
        ...reportData,
        id: String(created.id),
        createdAt: new Date().toISOString(),
        syncStatus: 'synced',
      };
      set(state => ({ reports: [ui, ...state.reports], isSubmitting: false }));
    } catch (error) {
      console.error('Error al crear reporte de limpieza:', error);
      set({ error: 'Error al crear reporte de limpieza', isSubmitting: false });
    }
  },

  updateReportStatus: async (reportId: string, status: CleaningReport['status']) => {
    try {
      let backendStatus: 'COMPLETED' | 'PENDING' | 'PARTIAL' = 'PARTIAL';
      if (status === 'completed') backendStatus = 'COMPLETED';
      else if (status === 'pending') backendStatus = 'PENDING';
      await CleaningApi.update(Number(reportId), { status: backendStatus });
      set(state => ({
        reports: state.reports.map(report =>
          report.id === reportId 
            ? { ...report, status }
            : report
        ),
      }));
    } catch (error) {
      console.error('Error al actualizar reporte:', error);
      set({ error: 'Error al actualizar reporte' });
    }
  },

  completeTask: async (reportId: string, taskId: string, notes?: string, photoPath?: string) => {
    try {
      set(state => ({
        reports: completeTaskInReports(state.reports, reportId, taskId, notes, photoPath),
      }));
    } catch (error) {
      console.error('Error al completar tarea:', error);
      set({ error: 'Error al completar tarea' });
    }
  },

  addReportPhoto: (reportId: string, photoUri: string) => {
    set(state => ({
      reports: addPhotoToReports(state.reports, reportId, photoUri),
      currentReport: addPhotoToCurrentReport(state.currentReport, reportId, photoUri),
    }));
  },

  createSupplyRequest: async (requestData) => {
    set({ isSubmitting: true, error: null });
    try {
      const newRequest: SupplyRequest = {
        ...requestData,
        id: `supply-req-${Date.now()}`,
        requestedAt: new Date().toISOString(),
        syncStatus: 'pending',
      };

      set(state => ({
        supplyRequests: [newRequest, ...state.supplyRequests],
        isSubmitting: false,
      }));
    } catch (error) {
      console.error('Error al crear solicitud de insumos:', error);
      set({ error: 'Error al crear solicitud de insumos', isSubmitting: false });
    }
  },

  loadSupplyRequests: async () => {
    try {
      // Mock data for supply requests
      const mockRequests: SupplyRequest[] = [
        {
          id: 'supply-req-001',
          requestedBy: 'Rosa Martínez',
          requestedAt: new Date().toISOString(),
          items: [
            {
              id: 'item-001',
              name: 'Detergente Industrial',
              quantity: 5,
              unit: 'litros',
              category: 'cleaning',
              estimatedPrice: 150,
            },
          ],
          justification: 'Stock bajo en detergente para limpieza de oficinas',
          urgency: 'medium',
          status: 'pending',
          syncStatus: 'pending',
        },
      ];

      set({ supplyRequests: mockRequests });
    } catch (error) {
      console.error('Error al cargar solicitudes de insumos:', error);
      set({ error: 'Error al cargar solicitudes de insumos' });
    }
  },

  setCurrentReport: (report: CleaningReport | null) => {
    set({ currentReport: report });
  },

  setCurrentSupplyRequest: (request: SupplyRequest | null) => {
    set({ currentSupplyRequest: request });
  },

  clearError: () => {
    set({ error: null });
  },
}));