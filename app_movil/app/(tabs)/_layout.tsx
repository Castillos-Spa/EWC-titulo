import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthz } from '@/hooks/useAuthz';
import {
  Home,
  Route,
  TriangleAlert as AlertTriangle,
  Fuel,
  Ticket,
  Sparkles as Cleaning,
  HardHat,
  Monitor,
  Kanban,
  Settings,
  type LucideIcon,
} from 'lucide-react-native';

const makeTabBarIcon = (Icon: LucideIcon, name: string) => {
  const TabIcon = ({ size, color }: { size: number; color: string }) => (
    <Icon size={size} color={color} strokeWidth={2} />
  );
  TabIcon.displayName = name;
  return TabIcon;
};

const homeTabIcon = makeTabBarIcon(Home, 'HomeTabIcon');
const routeTabIcon = makeTabBarIcon(Route, 'RouteTabIcon');
const cleaningTabIcon = makeTabBarIcon(Cleaning, 'CleaningTabIcon');
const hardHatTabIcon = makeTabBarIcon(HardHat, 'HardHatTabIcon');
const monitorTabIcon = makeTabBarIcon(Monitor, 'MonitorTabIcon');
const kanbanTabIcon = makeTabBarIcon(Kanban, 'KanbanTabIcon');
const fuelTabIcon = makeTabBarIcon(Fuel, 'FuelTabIcon');
const alertTabIcon = makeTabBarIcon(AlertTriangle, 'AlertTabIcon');
const ticketTabIcon = makeTabBarIcon(Ticket, 'TicketTabIcon');
const settingsTabIcon = makeTabBarIcon(Settings, 'SettingsTabIcon');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { canRoutes, canCleaning, canCivilWorks, canIT, canKanban, canFuel, canIncidents, canTickets } = useAuthz();
  
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
          tabBarIcon: homeTabIcon,
        }}
      />
      <Tabs.Screen
        name="routes"
        options={{
          title: 'Rutas',
          tabBarIcon: routeTabIcon,
          href: canRoutes ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="cleaning"
        options={{
          title: 'Aseo',
          tabBarIcon: cleaningTabIcon,
          href: canCleaning ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="civil-works"
        options={{
          title: 'Obras',
          tabBarIcon: hardHatTabIcon,
          href: canCivilWorks ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="it-support"
        options={{
          title: 'TIC',
          tabBarIcon: monitorTabIcon,
          href: canIT ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="kanban"
        options={{
          title: 'Kanban',
          tabBarIcon: kanbanTabIcon,
          href: canKanban ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="fuel"
        options={{
          title: 'Combustible',
          tabBarIcon: fuelTabIcon,
          href: canFuel ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="incidents"
        options={{
          title: 'Incidentes',
          tabBarIcon: alertTabIcon,
          href: canIncidents ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: 'Tickets',
          tabBarIcon: ticketTabIcon,
          href: canTickets ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: settingsTabIcon,
        }}
      />
    </Tabs>
  );
}