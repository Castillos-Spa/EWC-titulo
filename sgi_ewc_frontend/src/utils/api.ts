//
const DEMO_MODE: boolean = String(import.meta.env.VITE_DEMO_MODE || "false").toLowerCase() === "true";
const DEMO_API_URL: string | undefined = import.meta.env.VITE_DEMO_API_URL as string | undefined;
const API_BASE = (DEMO_MODE && DEMO_API_URL) ? DEMO_API_URL : (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1");

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

const handleLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
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

// Helpers para modo demo y refresco de token, para reducir complejidad en apiFetch
const isRuntimeDemoActive = (): boolean => {
  try { return globalThis?.localStorage?.getItem("demoMode") === "true"; } catch { return false; }
};

const isForcedDemoLogin = (path: string, options?: RequestInit): boolean => {
  const p = typeof path === 'string' ? path : '';
  const clean = p.startsWith('/') ? p : `/${p}`;
  const hasQueryDemo = /\bdemo=1\b/.test(clean);
  const hasHeaderDemo = !!(options?.headers && (options.headers as Record<string, string>)["X-Demo-Login"]);
  const isLoginPath = clean.replace(/\?.*$/, '') === '/auth/login';
  return isLoginPath && (hasQueryDemo || hasHeaderDemo);
};

async function refreshAndRetry(url: string, init: RequestInit, headers: Record<string, string>) {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    handleLogout();
    throw new Error("Session expired. No refresh token found.");
  }

  if (isRefreshing) {
    // Encolar y reintentar cuando termine el refresh en curso
    return new Promise((resolve, reject) => {
      failedQueue.push({
        resolve: (newAccessToken) => {
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          resolve(fetch(url, { ...init, headers }).then(parseJsonResponse));
        },
        reject,
      });
    });
  }

  isRefreshing = true;

  try {
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) throw new Error("Session expired");

    const { access_token: newAccessToken, user: refreshedUser } = await refreshRes.json();
    if (!newAccessToken) throw new Error("Session expired");
    localStorage.setItem("authToken", newAccessToken);
    if (refreshedUser) {
      localStorage.setItem("userData", JSON.stringify(refreshedUser));
      globalThis.dispatchEvent?.(new CustomEvent("session-refreshed", { detail: refreshedUser }));
    }
    headers["Authorization"] = `Bearer ${newAccessToken}`;
    processQueue(null, newAccessToken);
    const retried = await fetch(url, { ...init, headers });
    return parseJsonResponse(retried);
  } catch (error) {
    processQueue(error as Error, null);
    handleLogout();
    throw error;
  } finally {
    isRefreshing = false;
  }
}

async function apiFetch(path: string, options?: RequestInit) {
  // Modo demo interno (sin backend demo). Si DEMO_MODE y no hay DEMO_API_URL, o si está activo por runtime (localStorage), interceptamos aquí.
  const runtimeDemo = isRuntimeDemoActive();
  // Permitir forzar demo desde el login añadiendo ?demo=1 o header X-Demo-Login
  const forcedDemoLogin = isForcedDemoLogin(path, options);

  if ((DEMO_MODE && !DEMO_API_URL) || runtimeDemo || forcedDemoLogin) {
    return demoHandle(path, options);
  }
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
    return refreshAndRetry(url, init, headers);
  }

  return parseJsonResponse(res);
}

export default apiFetch;

type ApiError = Error & {
  status?: number;
  body?: unknown;
};

// --- Implementación de modo demo (frontend-only) ---
import { demoHandle } from "./demo/mockServer";
