import apiFetch from "./api";
import { fetchWithCache, invalidateCacheByPrefix } from "./requestCache";
import type { FetchWithCacheOptions } from "./requestCache";
import type { Vehiculo } from "../types/Vehiculo";
import type { OrdenTrabajo } from "../types/OrdenTrabajo";
import type { Ticket } from "../types/Ticket";
import type { Aseo } from "../types/Aseo";
import type { CivilWork } from "../types/CivilWork";
import type { Incident } from "../types/Incident";
import type { User } from "../types/User";
import type { RawNotification } from "../types/Notification";

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages?: number;
};

export type DashboardModuleKey =
  | "transport"
  | "maintenance"
  | "tickets"
  | "cleaning"
  | "civilWorks"
  | "incidents"
  | "notifications"
  | "users";

export type DashboardTransportPayload = {
  vehicles: Paginated<Vehiculo>;
  drivers: Paginated<User>;
};

export type DashboardMaintenancePayload = {
  workOrders: Paginated<OrdenTrabajo>;
};

export type DashboardOverviewResponse = {
  transport?: DashboardTransportPayload;
  maintenance?: DashboardMaintenancePayload;
  tickets?: Paginated<Ticket>;
  cleaning?: Paginated<Aseo>;
  civilWorks?: Paginated<Partial<CivilWork>>;
  incidents?: Paginated<Incident>;
  notifications?: Paginated<RawNotification>;
  users?: Paginated<User>;
};

type DashboardOverviewParams = {
  modules?: DashboardModuleKey[];
  vehiclesPage?: number;
  vehiclesPageSize?: number;
  driversPageSize?: number;
  workOrdersPage?: number;
  workOrdersPageSize?: number;
  ticketsPage?: number;
  ticketsPageSize?: number;
  cleaningPage?: number;
  cleaningPageSize?: number;
  civilWorksPage?: number;
  civilWorksPageSize?: number;
  incidentsPage?: number;
  incidentsPageSize?: number;
  notificationsPage?: number;
  notificationsPageSize?: number;
  usersPage?: number;
  usersPageSize?: number;
};

const DASHBOARD_OVERVIEW_CACHE_PREFIX = "dashboard:overview";

const numericParams: Array<keyof DashboardOverviewParams> = [
  "vehiclesPage",
  "vehiclesPageSize",
  "driversPageSize",
  "workOrdersPage",
  "workOrdersPageSize",
  "ticketsPage",
  "ticketsPageSize",
  "cleaningPage",
  "cleaningPageSize",
  "civilWorksPage",
  "civilWorksPageSize",
  "incidentsPage",
  "incidentsPageSize",
  "notificationsPage",
  "notificationsPageSize",
  "usersPage",
  "usersPageSize",
];

export async function fetchDashboardOverview(
  params: DashboardOverviewParams = {},
  options: FetchWithCacheOptions = {}
): Promise<DashboardOverviewResponse> {
  const normalizedModules = params.modules
    ? Array.from(new Set(params.modules)).sort((a, b) => a.localeCompare(b))
    : undefined;

  const normalizedParams: DashboardOverviewParams = {
    ...params,
    modules: normalizedModules,
  };

  const cacheKey = `${DASHBOARD_OVERVIEW_CACHE_PREFIX}:${JSON.stringify(
    normalizedParams
  )}`;

  return fetchWithCache(
    cacheKey,
    async () => {
      const search = new URLSearchParams();
      if (normalizedModules && normalizedModules.length > 0) {
        search.set("modules", normalizedModules.join(","));
      }

      for (const key of numericParams) {
        const value = params[key];
        if (typeof value === "number" && Number.isFinite(value)) {
          search.set(String(key), String(value));
        }
      }

      const query = search.toString();
      const url = query
        ? `/dashboard/overview?${query}`
        : "/dashboard/overview";
      return apiFetch(url) as Promise<DashboardOverviewResponse>;
    },
    options
  );
}

export function invalidateDashboardOverviewCache(): void {
  invalidateCacheByPrefix(DASHBOARD_OVERVIEW_CACHE_PREFIX);
}
