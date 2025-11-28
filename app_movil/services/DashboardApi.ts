import { ApiClient } from './ApiClient';

export type DaySummary = {
  routesCompleted?: number;
  routesAssigned?: number;
  fuelRecords?: number;
  cleaningAreas?: number;
  checklistCompletion?: number; // 0-100
  workOrdersActive?: number;
  progressAvg?: number; // 0-100
  ticketsAssigned?: number;
  incidentsOpen?: number;
};

export const DashboardApi = {
  async myDaySummary(): Promise<DaySummary> {
    // Nota: Endpoint provisional. Ajustar cuando exista en backend.
    // Intentar distintos módulos para construir un resumen mínimo.
    try {
      // ejemplo: contar tickets asignados
      const tickets = await ApiClient.get<any[]>('/ticket/mine', true).catch(() => []);
      const incidents = await ApiClient.get<any[]>('/incident/mine', true).catch(() => []);
      // placeholders para otras áreas
      return {
        routesCompleted: undefined,
        routesAssigned: undefined,
        fuelRecords: undefined,
        cleaningAreas: undefined,
        checklistCompletion: undefined,
        workOrdersActive: undefined,
        progressAvg: undefined,
        ticketsAssigned: Array.isArray(tickets) ? tickets.length : undefined,
        incidentsOpen: Array.isArray(incidents) ? incidents.length : undefined,
      };
    } catch {
      return {};
    }
  },
};
