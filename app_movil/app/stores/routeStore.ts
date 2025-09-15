import { create } from 'zustand';
import { DatabaseService } from '../services/DatabaseService';

export interface Stop {
  id: string;
  routeId: string;
  clientName: string;
  jobDescription: string;
  address: string;
  timeSlot: string;
  status: 'planned' | 'in_progress' | 'completed';
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
  status: 'planned' | 'in_progress' | 'completed';
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Route {
  id: string;
  date: string;
  vehicleId: string;
  vehiclePlate: string;
  driverName: string;
  status: 'planned' | 'in_progress' | 'completed';
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
      // Simulate API call - in real app this would fetch from server
      const mockRoutes: Route[] = [
        {
          id: 'route-001',
          date: date,
          vehicleId: 'truck-001',
          vehiclePlate: 'ABC-123',
          driverName: 'Juan Pérez',
          status: 'planned',
          stops: [
            {
              id: 'stop-001',
              routeId: 'route-001',
              clientName: 'Empresa ABC',
              jobDescription: 'Entrega de materiales',
              address: 'Av. Principal 123, Ciudad',
              timeSlot: '08:00 - 10:00',
              status: 'planned',
              order: 1,
            },
            {
              id: 'stop-002',
              routeId: 'route-001',
              clientName: 'Constructora XYZ',
              jobDescription: 'Recogida de equipos',
              address: 'Calle Secundaria 456, Ciudad',
              timeSlot: '11:00 - 13:00',
              status: 'planned',
              order: 2,
            },
            {
              id: 'stop-003',
              routeId: 'route-001',
              clientName: 'Almacén Central',
              jobDescription: 'Devolución de herramientas',
              address: 'Zona Industrial 789, Ciudad',
              timeSlot: '14:00 - 16:00',
              status: 'planned',
              order: 3,
            },
          ],
          trips: [],
        },
      ];

      // Save to local database
      await DatabaseService.saveRoutes(mockRoutes);
      set({ routes: mockRoutes, isLoading: false });
    } catch (error) {
      set({ error: 'Error al cargar rutas', isLoading: false });
    }
  },

  selectRoute: (route: Route) => {
    set({ currentRoute: route });
  },

  startTrip: async (stopId: string) => {
    const { currentRoute } = get();
    if (!currentRoute) return;

    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      routeId: currentRoute.id,
      stopId,
      photos: [],
      status: 'in_progress',
      syncStatus: 'pending',
      startTime: new Date().toISOString(),
    };

    const updatedStops = currentRoute.stops.map(stop =>
      stop.id === stopId ? { ...stop, status: 'in_progress' as const } : stop
    );

    const updatedRoute = {
      ...currentRoute,
      stops: updatedStops,
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

    const updatedStops = currentRoute.stops.map(stop =>
      stop.id === selectedTrip.stopId ? { ...stop, status: 'completed' as const } : stop
    );

    const updatedTrips = currentRoute.trips.map(trip =>
      trip.id === selectedTrip.id ? completedTrip : trip
    );

    const allStopsCompleted = updatedStops.every(stop => stop.status === 'completed');
    const updatedRoute = {
      ...currentRoute,
      stops: updatedStops,
      trips: updatedTrips,
      status: allStopsCompleted ? 'completed' as const : 'in_progress' as const,
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