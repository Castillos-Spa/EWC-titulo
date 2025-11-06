import type { ClientAuthSession } from "../types/User";
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from "./authSessionStorage";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

let isRefreshing = false;
type PendingRequest = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

let failedQueue: PendingRequest[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  for (const pending of failedQueue) {
    if (error) {
      pending.reject(error);
      continue;
    }
    if (token) {
      pending.resolve(token);
    }
  }
  failedQueue = [];
};

type RefreshSessionPayload = {
  user?: ClientAuthSession["user"];
  tenant?: ClientAuthSession["tenant"];
  companyId?: number | null;
  companies?: ClientAuthSession["companies"];
  modules?: ClientAuthSession["modules"];
};

const applyRefreshedSession = (payload: RefreshSessionPayload) => {
  if (!payload.user) {
    globalThis.dispatchEvent?.(
      new CustomEvent("session-refreshed", { detail: undefined })
    );
    return;
  }

  const previousSession = loadAuthSession();
  const nextSession: ClientAuthSession = {
    user: payload.user,
    tenant: payload.tenant ?? previousSession?.tenant ?? null,
    companyId: payload.companyId ?? previousSession?.companyId ?? null,
    companies: Array.isArray(payload.companies)
      ? payload.companies
      : previousSession?.companies ?? [],
    modules:
      payload.modules ?? payload.user.modules ?? previousSession?.modules ?? [],
  };

  saveAuthSession(nextSession);
  globalThis.dispatchEvent?.(
    new CustomEvent("session-refreshed", { detail: nextSession })
  );
};

const handleLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  clearAuthSession();
  // Disparamos un evento global para que la UI reaccione (AuthContext lo escucha).
  globalThis.dispatchEvent?.(new Event("session-expired"));
};

const parseJsonResponse = async (response: Response) => {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const err: ApiError = new Error(data?.message || response.statusText);
    err.status = response.status;
    err.body = data;
    throw err;
  }

  return data;
};

async function apiFetch(path: string, options?: RequestInit) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options?.headers) {
    Object.assign(headers, options.headers as Record<string, string>);
  }

  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const init: RequestInit = options ? { ...options, headers } : { headers };
  let res = await fetch(url, init);

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      handleLogout();
      throw new Error("Session expired. No refresh token found.");
    }

    if (isRefreshing) {
      // Si ya se está refrescando, encolamos la petición para reintentarla después.
      return new Promise<Response>((resolve, reject) => {
        failedQueue.push({
          resolve: (newAccessToken) => {
            headers["Authorization"] = `Bearer ${newAccessToken}`;
            resolve(fetch(url, { ...init, headers }));
          },
          reject,
        });
      }).then(parseJsonResponse);
    }

    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!refreshRes.ok) throw new Error("Session expired");

      const refreshPayload = await refreshRes.json();
      const {
        access_token: newAccessToken,
        user: refreshedUser,
        tenant,
        companyId,
        companies,
        modules,
      } = refreshPayload as {
        access_token?: string;
        user?: ClientAuthSession["user"];
        tenant?: ClientAuthSession["tenant"];
        companyId?: number | null;
        companies?: ClientAuthSession["companies"];
        modules?: ClientAuthSession["modules"];
      };
      if (!newAccessToken) throw new Error("Session expired");
      localStorage.setItem("authToken", newAccessToken);
      headers["Authorization"] = `Bearer ${newAccessToken}`;

      applyRefreshedSession({
        user: refreshedUser,
        tenant,
        companyId,
        companies,
        modules,
      });

      processQueue(null, newAccessToken); // Procesamos la cola de peticiones pendientes.
      res = await fetch(url, { ...init, headers }); // Reintentamos la petición original.
    } catch (error) {
      processQueue(error as Error, null);
      handleLogout();
      throw error;
    } finally {
      isRefreshing = false;
    }
  }

  return parseJsonResponse(res);
}

export default apiFetch;

type ApiError = Error & {
  status?: number;
  body?: unknown;
};
