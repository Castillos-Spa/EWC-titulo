export type RouteStatus = "planned" | "in_progress" | "completed" | "cancelled";

export type Stop = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: "pending" | "completed" | "skipped";
};

export interface Route {
  id: number;
  name: string;
  status: RouteStatus;
  stops: Stop[];
  createdAt: string;
  updatedAt: string;
}
