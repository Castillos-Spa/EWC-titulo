import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.window ? globalThis.window.localStorage.getItem(key) : null;
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (globalThis.window) globalThis.window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }
    try {
      // SecureStore en Android tiene límite de ~2048 bytes por valor.
      // Evitamos guardar valores muy grandes para prevenir warnings/errores.
      const MAX_BYTES = 2000; // margen de seguridad
      if (typeof value === 'string' && value.length > MAX_BYTES) {
        // Silenciosamente no persistimos valores grandes (p.ej., caches voluminosos).
        // Los consumidores deben contemplar la ausencia del dato (fallback a recomputar/fetch).
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.debug(`SafeStorage: omitido setItem para '${key}' por tamaño (${value.length} bytes)`);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (globalThis.window) globalThis.window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};
