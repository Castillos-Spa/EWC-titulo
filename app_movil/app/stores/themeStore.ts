import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getBrandPalette } from '@/app/theme/palette';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  getColors: () => ColorScheme;
}

export interface ColorScheme {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

function buildLightColors(): ColorScheme {
  const brand = getBrandPalette();
  return {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    primary: brand.primary,
    secondary: brand.secondary,
    accent: brand.accent,
    border: brand.border ?? '#E2E8F0',
    success: brand.success,
    warning: brand.warning,
    error: brand.error,
  };
}

function buildDarkColors(): ColorScheme {
  const brand = getBrandPalette();
  // Mantener la misma marca (primary/secondary) en oscuro para coherencia con web
  return {
    background: '#0F172A',
    surface: '#1E293B',
    card: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    primary: brand.primary,
    secondary: brand.secondary,
    accent: brand.accent,
    border: '#475569',
    success: brand.success,
    warning: brand.warning,
    error: '#EF4444',
  };
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,

  toggleTheme: async () => {
    const newMode = !get().isDarkMode;
    set({ isDarkMode: newMode });
    
    try {
      await SecureStore.setItemAsync('darkMode', newMode.toString());
    } catch (error) {
      console.warn('Error saving theme preference:', error);
    }
  },

  loadTheme: async () => {
    try {
      const savedTheme = await SecureStore.getItemAsync('darkMode');
      if (savedTheme !== null) {
        set({ isDarkMode: savedTheme === 'true' });
      }
    } catch (error) {
      console.warn('Error loading theme preference:', error);
    }
  },

  getColors: () => {
    return get().isDarkMode ? buildDarkColors() : buildLightColors();
  },
}));