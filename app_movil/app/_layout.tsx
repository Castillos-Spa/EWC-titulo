import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import LoginScreen from './screens/LoginScreen';

export default function RootLayout() {
  useFrameworkReady();
  
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const { loadTheme, getColors, isDarkMode } = useThemeStore();

  useEffect(() => {
    loadStoredAuth();
    loadTheme();
  }, [loadStoredAuth, loadTheme]);

  const colors = getColors();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Loading screen */}
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LoginScreen />
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
    </View>
  );
}
