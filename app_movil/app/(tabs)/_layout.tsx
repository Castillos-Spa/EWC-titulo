import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { 
  Chrome as Home, 
  Route, 
  TriangleAlert as AlertTriangle, 
  Fuel, 
  Ticket, 
  Sparkles as Cleaning,
  HardHat,
  Monitor,
  Kanban,
  Settings 
} from 'lucide-react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const colors = getColors();
  
  // Calculate tab bar height based on device and safe area
  const tabBarHeight = Platform.select({
    ios: 80 + insets.bottom,
    android: Math.max(80, 80 + insets.bottom),
    default: 80,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(8, insets.bottom),
          paddingTop: 8,
          height: tabBarHeight,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'android' ? 4 : 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarItemStyle: {
          paddingVertical: 6,
          minHeight: 56,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rutas',
          tabBarIcon: ({ size, color }) => (
            <Route size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="cleaning"
        options={{
          title: 'Aseo',
          tabBarIcon: ({ size, color }) => (
            <Cleaning size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="civil-works"
        options={{
          title: 'Obras',
          tabBarIcon: ({ size, color }) => (
            <HardHat size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="it-support"
        options={{
          title: 'TIC',
          tabBarIcon: ({ size, color }) => (
            <Monitor size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="kanban"
        options={{
          title: 'Kanban',
          tabBarIcon: ({ size, color }) => (
            <Kanban size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Combustible',
          tabBarIcon: ({ size, color }) => (
            <Fuel size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incidentes',
          tabBarIcon: ({ size, color }) => (
            <AlertTriangle size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ size, color }) => (
            <Ticket size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="Configuración"
        options={{
          title: 'Config',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}