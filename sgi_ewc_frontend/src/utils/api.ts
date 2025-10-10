const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

let isRefreshing = false;
let failedQueue: ((token: string) => void)[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((resolve) => {
    if (error || !token) {
      // No reintentamos si el refresh falla
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

const handleLogout = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
  // Disparamos un evento global para que la UI reaccione (AuthContext lo escucha).
  window.dispatchEvent(new Event("session-expired"));
};

async function apiFetch(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      handleLogout();
      throw new Error("Session expired. No refresh token found.");
    }

    if (isRefreshing) {
      // Si ya se está refrescando, encolamos la petición para reintentarla después.
      return new Promise((resolve, reject) => {
        failedQueue.push((newAccessToken) => {
          headers["Authorization"] = `Bearer ${newAccessToken}`;
          // Reintentamos la petición y resolvemos la promesa con el resultado.
          resolve(fetch(url, { ...options, headers }));
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

      res = await fetch(url, { ...options, headers }); // Reintentamos la petición original.
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
    const err = new Error(data?.message || res.statusText);
    (err as any).status = res.status;
    (err as any).body = data;
    throw err;
  }
  return data;
}

export default apiFetch;
