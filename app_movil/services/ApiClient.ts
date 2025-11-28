import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SafeStorage } from './SafeStorage';
import { useAuthStore } from '../stores/authStore';
// Nota: evitamos importar directamente el store de sincronización aquí para no
// crear un ciclo de dependencias. En su lugar, permitimos que el store se
// registre opcionalmente a través de una función de callback.
import { TimeoutError, mapStatusToError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestInit extends RequestInit {
  method?: HttpMethod;
  authenticate?: boolean; // si true, adjunta Bearer y auto-refresh en 401
  timeoutMs?: number; // tiempo máximo antes de abortar la solicitud
}

// Callback opcional para notificar éxito de llamadas API sin crear ciclos.
export type ApiSuccessCallback = () => void;

let onApiSuccess: ApiSuccessCallback | undefined;

export const registerApiSuccessCallback = (cb: ApiSuccessCallback) => {
  onApiSuccess = cb;
};

class ApiClientClass {
  private getBaseUrl(): string {
    const envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL;
    const extra: any = Constants?.expoConfig?.extra;
    const extraUrl: string | undefined = typeof extra?.apiUrl === 'string' ? extra.apiUrl : undefined;
    let url = envUrl && envUrl.length > 0 ? envUrl : extraUrl;
    if (!url) {
      url = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
    }
    try {
      const u = new URL(url);
      if (Platform.OS === 'android' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) {
        u.hostname = '10.0.2.2';
      }
      let base = u.toString().replace(/\/+$/, '');
      if (!/\/api\/v\d+$/i.test(base)) {
        base = `${base}/api/v1`;
      }
      return base.replace(/\/+$/, '');
    } catch {
      let base = url.replace('://localhost', '://10.0.2.2').replace(/\/+$/, '');
      if (!/\/api\/v\d+$/i.test(base)) {
        base = `${base}/api/v1`;
      }
      return base.replace(/\/+$/, '');
    }
  }

  private async buildHeaders(init?: ApiRequestInit): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    const source = init?.headers;
    if (source instanceof Headers) {
      source.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(source)) {
      for (const [key, value] of source) {
        headers[String(key)] = String(value);
      }
    } else if (source && typeof source === 'object') {
      Object.assign(headers, source as Record<string, string>);
    }

    const hasContentType = Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    if (!hasContentType && !isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (init?.authenticate) {
      const token = await SafeStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async doFetch(url: string, init?: ApiRequestInit): Promise<Response> {
    const headers = await this.buildHeaders(init);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 15000);
    try {
      return await fetch(url, { ...init, headers, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new TimeoutError('La solicitud excedió el tiempo máximo. Intenta nuevamente.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  async request<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
    const base = this.getBaseUrl();
    const url = `${base}${path.startsWith('/') ? '' : '/'}${path}`;

    // Primer intento
  let res = await this.doFetch(url, init);
    if (res.status === 401 && init.authenticate) {
      // Intentar refresh y reintentar una vez
      try {
        const auth = useAuthStore.getState();
        await auth.refreshAuth();
        res = await this.doFetch(url, init);
      } catch (error_) {
        // Fallback: cerrar sesión segura y propagar error controlado
        // Intentar logout; si falla simplemente continuamos.
        await useAuthStore.getState().logout().catch(() => {});
        const mapped = mapStatusToError(401, 'Sesión expirada. Inicia sesión nuevamente.');
        (mapped as any).cause = error_;
        throw mapped;
      }
    }

  const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text as any; } })() : null;
    if (!res.ok) {
      const message = (data && (data.message || data.error)) || res.statusText;
      throw mapStatusToError(res.status, message, data);
    }
    // marcar éxito de API para el estado de sincronización sin dependencias cíclicas
    try { onApiSuccess?.(); } catch {}
    return data as T;
  }

  get<T>(path: string, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'GET', authenticate });
  }
  post<T>(path: string, body?: any, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, authenticate });
  }
  upload<T>(path: string, formData: FormData, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: formData, authenticate });
  }
  patch<T>(path: string, body?: any, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, authenticate });
  }
  put<T>(path: string, body?: any, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined, authenticate });
  }
  delete<T>(path: string, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', authenticate });
  }
}

const ApiClient = new ApiClientClass();

export default ApiClient;
export { ApiClient };
