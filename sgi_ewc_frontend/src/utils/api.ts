const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  for (const resolve of failedQueue) {
    if (!error && token) {
      resolve(token);
    }
    // Si hay error, simplemente no resolvemos con nuevo token; los callers manejarán su propio error.
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
      return new Promise((resolve) => {
        failedQueue.push((newAccessToken) => {
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          // Reintentamos la petición y resolvemos la promesa con el resultado.
          resolve(fetch(url, { ...init, headers }));
        });
      }).then(async (newResponse) => {
        // Una vez que la promesa se resuelve, procesamos la respuesta.
        if (!(newResponse as Response).ok)
          throw new Error((newResponse as Response).statusText);
        const text = await (newResponse as Response).text();
        return text ? JSON.parse(text) : null;
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

      const { access_token: newAccessToken } = await refreshRes.json();
      localStorage.setItem("authToken", newAccessToken);
      headers["Authorization"] = `Bearer ${newAccessToken}`;
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

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err: ApiError = new Error(data?.message || res.statusText);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

export default apiFetch;

type ApiError = Error & {
  status?: number;
  body?: unknown;
};
