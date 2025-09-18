import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const SafeStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
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
        if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },

  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined') window.localStorage.removeItem(key);
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
