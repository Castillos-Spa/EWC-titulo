const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

type FetchOptions = RequestInit & { authenticate?: boolean };

async function apiFetch(path: string, options: FetchOptions = {}) {
  const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401 && localStorage.getItem("refreshToken")) {
    // Intenta refrescar el token
    const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: localStorage.getItem("refreshToken"),
      }),
    });
    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json();
      localStorage.setItem("authToken", access_token);
      // Reintenta la petición original con el nuevo token
      headers["Authorization"] = `Bearer ${access_token}`;
      const retryRes = await fetch(url, { ...options, headers });
      if (!retryRes.ok) {
        // Si el reintento también falla, es un logout definitivo.
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new Event("force-logout"));
        throw new Error(retryRes.statusText);
      }
      return await retryRes.json();
    } else {
      // Si el refresh token es inválido o expiró, limpiamos todo y forzamos el logout.
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      // Disparamos un evento global para que la UI reaccione.
      window.dispatchEvent(new Event("force-logout"));
      throw new Error("Unauthorized: Session expired");
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
