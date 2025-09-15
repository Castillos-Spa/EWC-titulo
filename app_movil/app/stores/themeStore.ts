import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
  getColors: () => ColorScheme;
}

interface ColorScheme {
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

const lightColors: ColorScheme = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  primary: '#2563EB',
  secondary: '#7C3AED',
  accent: '#06B6D4',
  border: '#E2E8F0',
  success: '#16A34A',
  warning: '#F59E0B',
  error: '#DC2626',
};

const darkColors: ColorScheme = {
  background: '#0F172A',
  surface: '#1E293B',
  card: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#06B6D4',
  border: '#475569',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

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
    return get().isDarkMode ? darkColors : lightColors;
  },
}));