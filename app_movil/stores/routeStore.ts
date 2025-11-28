import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';
import { useAuthStore } from './authStore';
import { ApiClient } from '../services/ApiClient';

// Type aliases to reduce repetition and satisfy S4323
type RouteStatus = 'planned' | 'in_progress' | 'completed';
type TripStatus = 'planned' | 'in_progress' | 'completed';
type SyncStatus = 'pending' | 'synced' | 'failed';

export interface Stop {
  id: string;
  routeId: string;
  clientName: string;
  jobDescription: string;
  address: string;
  timeSlot: string;
  status: RouteStatus;
  order: number;
}

export interface Trip {
  id: string;
  routeId: string;
  stopId: string;
  fuelConsumption?: number;
  recipient?: string;
  signaturePath?: string;
  photos: string[];
  notes?: string;
  startTime?: string;
  endTime?: string;
  status: TripStatus;
  syncStatus: SyncStatus;
}

export interface Route {
  id: string;
  date: string;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  driverId?: string | number;
  code?: string;
  origin?: string;
  destination?: string;
  status: RouteStatus;
  stops: Stop[];
  trips: Trip[];
}

interface RouteState {
  routes: Route[];
  currentRoute: Route | null;
  selectedTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadRoutes: (date: string) => Promise<void>;
  selectRoute: (route: Route) => void;
  startTrip: (stopId: string) => Promise<void>;
  completeTrip: (tripData: Partial<Trip>) => Promise<void>;
  updateTripStatus: (tripId: string, status: Trip['status']) => void;
  addTripPhoto: (tripId: string, photoUri: string) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  clearError: () => void;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  routes: [],
  currentRoute: null,
  selectedTrip: null,
  isLoading: false,
  error: null,

  loadRoutes: async (date: string) => {
    set({ isLoading: true, error: null });
    try {
      // Obtener asignaciones desde el backend y mapear al tipo Route
      const user = useAuthStore.getState().user;
      const uid = user?.id === undefined || user?.id === null ? null : Number(user.id);
      const day = date.slice(0, 10);

      type Assignment = {
        id: number;
        truckId: number;
        routeId: number;
        driverId: number;
        date: string;
        status?: string;
        truck?: { id: number; patente?: string | null; codigo?: string | null; marca?: string | null; modelo?: string | null };
        route?: { id: number; code?: string | null; origin?: string | null; destination?: string | null };
        driver?: { id: number; username?: string | null };
      };

      // Paginación: acumular todas las páginas necesarias (hasta un límite razonable)
      const allAssignments: Assignment[] = [];
      let page = 1;
      const pageSize = 100; // tamaño moderado
      let totalPages = 1;
      const maxPages = 10; // salvaguarda para no sobrecargar

      while (page <= totalPages && page <= maxPages) {
        const res = await ApiClient.get<{ items: Assignment[]; total: number; page: number; pageSize: number; totalPages: number }>(
          `/routes/assignments?page=${page}&pageSize=${pageSize}`
        );
        const items = Array.isArray(res?.items) ? res.items : [];
        allAssignments.push(...items);
        totalPages = res.totalPages || 1;
        page += 1;
      }

      const normalizeStatus = (s?: string): RouteStatus => {
        const val = (s || '').toString().toLowerCase();
        if (val.includes('curso') || val.includes('progress') || val.includes('activa')) return 'in_progress';
        if (val.includes('complet') || val.includes('done') || val.includes('finaliz')) return 'completed';
        return 'planned';
      };

      const mapPlate = (a: Assignment): string => {
        const code = a.truck?.codigo?.trim();
        const plate = a.truck?.patente?.trim();
        return (code || plate || `VEH-${a.truckId}`).toString().toUpperCase();
      };

      const mapped: Route[] = allAssignments
        .filter(a => {
          const aDay = new Date(a.date).toISOString().slice(0, 10);
          const byDate = aDay === day;
          const byDriver = uid == null ? true : Number(a.driverId) === uid;
          return byDate && byDriver;
        })
        .map(a => ({
          id: `assignment-${a.id}`,
          date: new Date(a.date).toISOString().slice(0, 10),
          vehicleId: String(a.truckId),
          vehiclePlate: mapPlate(a),
          driverName: (a.driver?.username || '').toString(),
          driverId: a.driverId,
          code: (a.route?.code || undefined) ?? undefined,
          origin: (a.route?.origin || undefined) ?? undefined,
          destination: (a.route?.destination || undefined) ?? undefined,
          status: normalizeStatus(a.status),
          stops: [],
          trips: [],
        }));

      await DatabaseService.saveRoutes(mapped);
      set({ routes: mapped, isLoading: false });
    } catch (error) {
      console.error('Error al cargar rutas desde API, intentando fallback local:', error);
      try {
        const offline = await DatabaseService.getRoutesByDate(date);
        set({ routes: offline, isLoading: false, error: null });
      } catch (error_) {
        console.error('Fallback local también falló:', error_);
        const message = (error as any)?.message || 'Error al cargar rutas';
        set({ error: message, isLoading: false });
      }
    }
  },

  selectRoute: (route: Route) => {
    set({ currentRoute: route });
  },

  startTrip: async (stopId: string) => {
    const { currentRoute } = get();
    if (!currentRoute) return;

    const effectiveStopId = stopId || `${currentRoute.id}-leg-1`;

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      routeId: currentRoute.id,
      stopId: effectiveStopId,
      photos: [],
      status: 'in_progress',
      syncStatus: 'pending',
      startTime: new Date().toISOString(),
    };

    const updatedRoute = {
      ...currentRoute,
      trips: [...currentRoute.trips, newTrip],
      status: 'in_progress' as const,
    };

    // Save to database
    try {
      await DatabaseService.saveTrip(newTrip);
    } catch (dbError) {
      console.warn('Database save failed, continuing with local state:', dbError);
    }
    
    set(state => ({
      currentRoute: updatedRoute,
      routes: state.routes.map(r => r.id === updatedRoute.id ? updatedRoute : r),
      selectedTrip: newTrip,
    }));
  },

  completeTrip: async (tripData: Partial<Trip>) => {
    const { currentRoute, selectedTrip } = get();
    if (!currentRoute || !selectedTrip) return;

    const completedTrip: Trip = {
      ...selectedTrip,
      ...tripData,
      status: 'completed',
      endTime: new Date().toISOString(),
      syncStatus: 'pending',
    };

    const updatedTrips = currentRoute.trips.map(trip =>
      trip.id === selectedTrip.id ? completedTrip : trip
    );
    const updatedRoute = {
      ...currentRoute,
      trips: updatedTrips,
      status: 'completed' as const,
    };

    // Save to database
    try {
      await DatabaseService.updateTrip(completedTrip);
    } catch (dbError) {
      console.warn('Database save failed, continuing with local state:', dbError);
    }

    set(state => ({
      currentRoute: updatedRoute,
      routes: state.routes.map(r => r.id === updatedRoute.id ? updatedRoute : r),
      selectedTrip: null,
    }));
  },

  updateTripStatus: (tripId: string, status: Trip['status']) => {
    set(state => ({
      currentRoute: state.currentRoute ? {
        ...state.currentRoute,
        trips: state.currentRoute.trips.map(trip =>
          trip.id === tripId ? { ...trip, status } : trip
        ),
      } : null,
    }));
  },

  addTripPhoto: (tripId: string, photoUri: string) => {
    set(state => ({
      currentRoute: state.currentRoute ? {
        ...state.currentRoute,
        trips: state.currentRoute.trips.map(trip =>
          trip.id === tripId ? { ...trip, photos: [...trip.photos, photoUri] } : trip
        ),
      } : null,
      selectedTrip: state.selectedTrip?.id === tripId ? {
        ...state.selectedTrip,
        photos: [...state.selectedTrip.photos, photoUri],
      } : state.selectedTrip,
    }));
  },

  setSelectedTrip: (trip: Trip | null) => {
    set({ selectedTrip: trip });
  },

  clearError: () => {
    set({ error: null });
  },
}));