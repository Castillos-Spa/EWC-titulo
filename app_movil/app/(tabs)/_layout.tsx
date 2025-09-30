import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, useWindowDimensions } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthz } from '@/hooks/useAuthz';
import {
  Home,
  Route,
  TriangleAlert as AlertTriangle,
  Fuel,
  Briefcase,
  Sparkles as Cleaning,
  HardHat,
  Bell,
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
const workTabIcon = makeTabBarIcon(Briefcase, 'WorkTabIcon');
const fuelTabIcon = makeTabBarIcon(Fuel, 'FuelTabIcon');
const alertTabIcon = makeTabBarIcon(AlertTriangle, 'AlertTabIcon');
const settingsTabIcon = makeTabBarIcon(Settings, 'SettingsTabIcon');
const bellTabIcon = makeTabBarIcon(Bell, 'BellTabIcon');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { canRoutes, canCleaning, canCivilWorks, canKanban, canFuel, canIncidents, canTickets } = useAuthz();
  const canNotifications = true; // Asumimos visible para todos; ajustar si hay control de permisos
  
  // Breakpoints básicos
  const isSmall = width < 400;
  const isTablet = width >= 768;

  // Altura y labels según tamaño (sin ternarios anidados)
  let baseHeight = 64;
  if (isSmall) baseHeight = 56;
  else if (isTablet) baseHeight = 72;
  const tabBarHeight = Platform.select({
    ios: baseHeight + insets.bottom,
    android: Math.max(baseHeight, baseHeight + insets.bottom),
    default: baseHeight,
  });

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(isSmall ? 4 : 8, insets.bottom),
          paddingTop: isSmall ? 4 : 8,
          height: tabBarHeight,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarShowLabel: !isSmall,
        tabBarLabelStyle: !isSmall
          ? {
              fontSize: isTablet ? 12 : 11,
              fontWeight: '600',
              marginTop: 4,
              marginBottom: Platform.OS === 'android' ? 4 : 0,
            }
          : undefined,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarItemStyle: {
          paddingVertical: isSmall ? 2 : 6,
          minHeight: isSmall ? 48 : 56,
        },
      }}
    >
      {[
        { name: 'index', title: 'Inicio', icon: homeTabIcon, visible: true },
  { name: 'routes', title: 'Rutas', icon: routeTabIcon, visible: canRoutes },
  { name: 'cleaning', title: 'Aseo', icon: cleaningTabIcon, visible: canCleaning },
  { name: 'civil-works', title: 'Obras', icon: hardHatTabIcon, visible: canCivilWorks },
  { name: 'work', title: 'Trabajo', icon: workTabIcon, visible: canTickets || canKanban },
        { name: 'fuel', title: 'Combustible', icon: fuelTabIcon, visible: canFuel },
        { name: 'incidents', title: 'Incidentes', icon: alertTabIcon, visible: canIncidents },
        
  { name: 'notifications', title: 'Notificaciones', icon: bellTabIcon, visible: canNotifications },
        { name: 'settings', title: 'Config', icon: settingsTabIcon, visible: true },
      ].map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name as any}
          options={{
            title: tab.title,
            tabBarIcon: tab.icon as any,
            href: tab.visible ? undefined : null,
          }}
        />
      ))}
    </Tabs>
  );
}