import { create } from 'zustand';
import { SafeStorage } from '../services/SafeStorage';
import { AuthService, User, AuthTokens } from '../services/AuthService';
import { BiometricService } from '../services/BiometricService';
import { NotificationService } from '../services/NotificationService';

export type { User } from '../services/AuthService';

type StoredAuth = { user: User; tokens: AuthTokens };

const isExpired = (expiresAt: string): boolean => {
  const now = Date.now();
  const exp = new Date(expiresAt).getTime();
  return now >= exp;
};

async function tryBiometricLogin(): Promise<StoredAuth | null> {
  const biometricData = await BiometricService.authenticateWithBiometric();
  if (!biometricData) return null;
  try {
    if ('refreshToken' in biometricData) {
      const newTokens = await AuthService.refreshToken(biometricData.refreshToken);
      const validatedUser = await AuthService.validateToken(newTokens.accessToken);
      if (!validatedUser) throw new Error('No se pudo validar sesión biométrica');
      return { user: validatedUser, tokens: newTokens };
    }
    const res = await AuthService.login(biometricData);
    return { user: res.user, tokens: res.tokens };
  } catch (err) {
    console.warn('Biometric login failed, fallback to stored tokens:', err);
    return null;
  }
}

async function readStoredAuthFromStorage(): Promise<StoredAuth | null> {
  const accessToken = await SafeStorage.getItem('accessToken');
  const refreshToken = await SafeStorage.getItem('refreshToken');
  const expiresAt = await SafeStorage.getItem('expiresAt');
  const userData = await SafeStorage.getItem('userData');
  if (!accessToken || !refreshToken || !expiresAt || !userData) return null;
  try {
    const user: User = JSON.parse(userData);
    const tokens: AuthTokens = { accessToken, refreshToken, expiresAt };
    return { user, tokens };
  } catch (err) {
    console.error('Failed to parse stored user data:', err);
    return null;
  }
}

async function refreshTokensIfNeeded(tokens: AuthTokens): Promise<AuthTokens | null> {
  if (!isExpired(tokens.expiresAt)) return tokens;
  try {
    const newTokens = await AuthService.refreshToken(tokens.refreshToken);
    return newTokens;
  } catch (err) {
    console.warn('Token refresh failed:', err);
    return null;
  }
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: AuthTokens | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
  setupNotifications: () => Promise<void>;
  enableBiometricForCurrentSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  tokens: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { user, tokens } = await AuthService.login({ email, password });

      // Guardar tokens de forma segura
  await SafeStorage.setItem('accessToken', tokens.accessToken);
  await SafeStorage.setItem('refreshToken', tokens.refreshToken);
  await SafeStorage.setItem('expiresAt', tokens.expiresAt);
  await SafeStorage.setItem('userData', JSON.stringify(user));

      set({ 
        user, 
        tokens,
        isAuthenticated: true, 
        isLoading: false 
      });
      
      // Setup notifications after successful login
      await get().setupNotifications();
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Error de autenticación', 
        isLoading: false 
      });
    }
  },

  logout: async () => {
    try {
      await AuthService.logout();
      
      // Limpiar tokens seguros
  await SafeStorage.deleteItem('accessToken');
  await SafeStorage.deleteItem('refreshToken');
  await SafeStorage.deleteItem('expiresAt');
  await SafeStorage.deleteItem('userData');
      
      set({ 
        user: null, 
        tokens: null,
        isAuthenticated: false, 
        error: null 
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  },

  loadStoredAuth: async () => {
    set({ isLoading: true });
    try {
      const bio = await tryBiometricLogin();
      if (bio) {
        await SafeStorage.setItem('accessToken', bio.tokens.accessToken);
        await SafeStorage.setItem('refreshToken', bio.tokens.refreshToken);
        await SafeStorage.setItem('expiresAt', bio.tokens.expiresAt);
        await SafeStorage.setItem('userData', JSON.stringify(bio.user));
        set({ user: bio.user, tokens: bio.tokens, isAuthenticated: true, isLoading: false });
        return;
      }

      const stored = await readStoredAuthFromStorage();
      if (!stored) {
        set({ isLoading: false });
        return;
      }

      set({ user: stored.user, tokens: stored.tokens, isAuthenticated: true, isLoading: false });

      const refreshed = await refreshTokensIfNeeded(stored.tokens);
      if (!refreshed) {
        console.warn('Stored tokens invalid or refresh failed. Logging out.');
        await get().logout();
        set({ isLoading: false, error: 'La sesión ha expirado. Por favor, inicia sesión nuevamente.' });
        return;
      }

      if (refreshed.expiresAt !== stored.tokens.expiresAt || refreshed.accessToken !== stored.tokens.accessToken) {
        await SafeStorage.setItem('accessToken', refreshed.accessToken);
        await SafeStorage.setItem('refreshToken', refreshed.refreshToken);
        await SafeStorage.setItem('expiresAt', refreshed.expiresAt);
        // Validar perfil con el nuevo token para sincronizar roles/permisos
        const validated = await AuthService.validateToken(refreshed.accessToken);
        if (validated) {
          await SafeStorage.setItem('userData', JSON.stringify(validated));
          set({ tokens: refreshed, user: validated });
        } else {
          set({ tokens: refreshed });
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      set({ isLoading: false, error: 'No se pudo restaurar la sesión.' });
    }
  },

  refreshAuth: async () => {
    const { tokens } = get();
    if (!tokens?.refreshToken) return;
    
    try {
      const newTokens = await AuthService.refreshToken(tokens.refreshToken);
      await SafeStorage.setItem('accessToken', newTokens.accessToken);
      await SafeStorage.setItem('refreshToken', newTokens.refreshToken);
      await SafeStorage.setItem('expiresAt', newTokens.expiresAt);
      // Sincronizar perfil (roles/permisos) con el nuevo token
      const validated = await AuthService.validateToken(newTokens.accessToken);
      if (validated) {
        await SafeStorage.setItem('userData', JSON.stringify(validated));
        set({ tokens: newTokens, user: validated });
      } else {
        set({ tokens: newTokens });
      }
    } catch (error) {
      console.warn('Refresh auth failed, logging out:', error);
      await get().logout();
    }
  },

  setupNotifications: async () => {
    try {
      await NotificationService.requestPermissions();
      await NotificationService.setupNotificationChannels();
    } catch (error) {
      console.warn('Failed to setup notifications:', error);
    }
  },

  clearError: () => set({ error: null }),

  enableBiometricForCurrentSession: async () => {
    try {
      const success = await BiometricService.enableBiometricUsingSession();
      return success;
    } catch (e) {
      console.warn('Failed to enable biometric for session:', e);
      return false;
    }
  }
}));

export default useAuthStore;