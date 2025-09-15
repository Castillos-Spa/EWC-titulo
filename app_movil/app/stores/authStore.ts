import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthService, User, LoginCredentials, AuthTokens } from '../services/AuthService';
import { BiometricService } from '../services/BiometricService';
import { NotificationService } from '../services/NotificationService';

export type { User } from '../services/AuthService';

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
      await SecureStore.setItemAsync('accessToken', tokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
      await SecureStore.setItemAsync('expiresAt', tokens.expiresAt);
      await SecureStore.setItemAsync('userData', JSON.stringify(user));

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
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      await SecureStore.deleteItemAsync('expiresAt');
      await SecureStore.deleteItemAsync('userData');
      
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
      // Try biometric authentication first if enabled
      const biometricCredentials = await BiometricService.authenticateWithBiometric();
      if (biometricCredentials) {
        try {
          const { user, tokens } = await AuthService.login(biometricCredentials);
          set({ 
            user, 
            tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
          return;
        } catch (biometricLoginError) {
          console.warn('Biometric login failed, falling back to stored tokens:', biometricLoginError);
        }
      }

      const accessToken = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const expiresAt = await SecureStore.getItemAsync('expiresAt');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (accessToken && refreshToken && expiresAt && userData) {
        const user = JSON.parse(userData);
        const tokens: AuthTokens = { accessToken, refreshToken, expiresAt };
        
        set({ 
          user, 
          tokens,
          isAuthenticated: true, 
          isLoading: false 
        });
        
        // Verificar si el token ha expirado
        const now = new Date().getTime();
        const expiration = new Date(expiresAt).getTime();
        
        if (now >= expiration) {
          // Token expirado, intentar refresh
          try {
            const newTokens = await AuthService.refreshToken(refreshToken);
            await SecureStore.setItemAsync('accessToken', newTokens.accessToken);
            await SecureStore.setItemAsync('refreshToken', newTokens.refreshToken);
            await SecureStore.setItemAsync('expiresAt', newTokens.expiresAt);
            
            set({ 
              user, 
              tokens: newTokens,
              isAuthenticated: true, 
              isLoading: false 
            });
          } catch (refreshError) {
            // Refresh falló, hacer logout
            await get().logout();
            set({ isLoading: false });
          }
        } else {
          // Token válido
          set({ 
            user, 
            tokens,
            isAuthenticated: true, 
            isLoading: false 
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false });
    }
  },

  refreshAuth: async () => {
    const { tokens } = get();
    if (!tokens?.refreshToken) return;
    
    try {
      const newTokens = await AuthService.refreshToken(tokens.refreshToken);
      await SecureStore.setItemAsync('accessToken', newTokens.accessToken);
      await SecureStore.setItemAsync('refreshToken', newTokens.refreshToken);
      await SecureStore.setItemAsync('expiresAt', newTokens.expiresAt);
      
      set({ tokens: newTokens });
    } catch (error) {
      // Refresh falló, hacer logout
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

  clearError: () => set({ error: null })
}));