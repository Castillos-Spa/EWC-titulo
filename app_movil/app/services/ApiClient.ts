import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { SafeStorage } from './SafeStorage';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestInit extends RequestInit {
  method?: HttpMethod;
  authenticate?: boolean; // si true, adjunta Bearer y auto-refresh en 401
  timeoutMs?: number; // tiempo máximo antes de abortar la solicitud
}

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
      return u.toString().replace(/\/+$/, '');
    } catch {
      return url.replace('://localhost', '://10.0.2.2').replace(/\/+$/, '');
    }
  }

  private async buildHeaders(init?: ApiRequestInit): Promise<Record<string, string>> {
    const base: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (init?.authenticate) {
      const token = await SafeStorage.getItem('accessToken');
      if (token) base['Authorization'] = `Bearer ${token}`;
    }
    return base;
  }

  private async doFetch(url: string, init?: ApiRequestInit): Promise<Response> {
    const headers = await this.buildHeaders(init);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init?.timeoutMs ?? 15000);
    try {
      return await fetch(url, { ...(init || {}), headers, signal: controller.signal });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const toErr = new Error('La solicitud excedió el tiempo máximo. Intenta nuevamente.');
        (toErr as any).code = 'ETIMEOUT';
        throw toErr;
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
      } catch (refreshErr) {
        // Si falla el refresh o el reintento, forzar logout y propagar error 401 amigable
        try { await useAuthStore.getState().logout(); } catch { /* ignore */ }
        const err = new Error('Sesión expirada. Inicia sesión nuevamente.');
        (err as any).status = 401;
        (err as any).cause = refreshErr;
        throw err;
      }
    }

  const text = await res.text();
    const data = text ? (() => { try { return JSON.parse(text); } catch { return text as any; } })() : null;
    if (!res.ok) {
      const err = new Error((data && (data.message || data.error)) || res.statusText);
      (err as any).status = res.status;
      (err as any).body = data;
      throw err;
    }
    // marcar éxito de API para el estado de sincronización
    try { useSyncStore.getState().markApiOk(); } catch {}
    return data as T;
  }

  get<T>(path: string, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'GET', authenticate });
  }
  post<T>(path: string, body?: any, authenticate = true): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, authenticate });
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

export const ApiClient = new ApiClientClass();
