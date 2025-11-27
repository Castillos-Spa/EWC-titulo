import { create } from 'zustand';
import ApiClient, { registerApiSuccessCallback } from '../services/ApiClient';
import { DatabaseService } from '../services/DatabaseService';

interface SyncState {
  online: boolean;
  lastApiOk?: number;
  lastChecked?: number;
  syncing: boolean;
  error?: string;
  dbOk?: boolean;
  lastDbOk?: number;
  dbMessage?: string;
  checkNow: () => Promise<boolean>;
  markApiOk: () => void;
  setSyncing: (v: boolean) => void;
  checkDb: () => Promise<boolean>;
}

export const useSyncStore = create<SyncState>((set) => ({
  online: false,
  lastApiOk: undefined,
  lastChecked: undefined,
  syncing: false,
  error: undefined,
  dbOk: undefined,
  lastDbOk: undefined,
  dbMessage: undefined,
  async checkNow() {
    try {
      set({ syncing: true });
      // consulta rápida autenticada; si no hay token válido fallará
      await ApiClient.get('/auth/profile', true);
      const db = await DatabaseService.healthCheck();
      set({ online: true, lastChecked: Date.now(), error: undefined, syncing: false, dbOk: db.ok, lastDbOk: db.ok ? Date.now() : undefined, dbMessage: db.message });
      return true;
    } catch (e: any) {
      const db = await DatabaseService.healthCheck();
      set({ online: false, lastChecked: Date.now(), error: e?.message || 'Offline', syncing: false, dbOk: db.ok, lastDbOk: db.ok ? Date.now() : undefined, dbMessage: db.message });
      return false;
    }
  },
  markApiOk() {
    set({ online: true, lastApiOk: Date.now(), error: undefined });
  },
  setSyncing(v: boolean) {
    set({ syncing: v });
  },
  async checkDb() {
    const res = await DatabaseService.healthCheck();
    if (res.ok) {
      set({ dbOk: true, lastDbOk: Date.now(), dbMessage: res.message });
      return true;
    }
    set({ dbOk: false, dbMessage: res.message });
    return false;
  },
}));

// Registrar callback de éxito de API sin crear un ciclo de imports.
registerApiSuccessCallback(() => {
  try {
    useSyncStore.getState().markApiOk();
  } catch {
    // ignorar errores para no romper el flujo de red
  }
});

export default useSyncStore;
