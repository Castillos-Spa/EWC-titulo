import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, useWindowDimensions } from 'react-native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthz } from '@/hooks/useAuthz';
import { useNavigationStore } from '../stores/navigationStore';
import {
  Home,
  Ticket,
  Bell,
  Map,
  Grid2x2,
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
const routeTabIcon = makeTabBarIcon(Map, 'RouteTabIcon');
const workTabIcon = makeTabBarIcon(Ticket, 'WorkTabIcon');
const bellTabIcon = makeTabBarIcon(Bell, 'BellTabIcon');
const appsTabIcon = makeTabBarIcon(Grid2x2, 'AppsTabIcon');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const {
    canRoutes,
    canKanban,
    canTickets,
    canFuel,
    canMaintenance,
    canCleaning,
    canCivilWorks,
  } = useAuthz();
  const { getTop } = useNavigationStore();
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
      {(() => {
        // Definimos todas las rutas que existen en (tabs)
        const allRoutes = [
          { name: 'index', title: 'Inicio', icon: homeTabIcon, visible: true, fixed: true, candidate: false },
          { name: 'work', title: 'Sistema de Tickets', icon: workTabIcon, visible: canTickets || canKanban, candidate: true },
          { name: 'routes', title: 'Gestión de Rutas', icon: routeTabIcon, visible: canRoutes, candidate: true },
          { name: 'notifications', title: 'Notificaciones', icon: bellTabIcon, visible: canNotifications, fixed: true, candidate: false },
          { name: 'apps', title: 'Aplicaciones', icon: appsTabIcon, visible: true, fixed: true, candidate: false },
          // Rutas adicionales que deben quedar ocultas del tab bar y disponibles desde el Hub
          { name: 'fuel', title: 'Combustible', icon: routeTabIcon, visible: canFuel, candidate: false },
          { name: 'fleet', title: 'Flota', icon: routeTabIcon, visible: canRoutes, candidate: false },
          { name: 'cleaning', title: 'Aseo', icon: routeTabIcon, visible: canCleaning, candidate: false },
          { name: 'settings', title: 'Configuración', icon: routeTabIcon, visible: true, candidate: false },
          { name: 'incidents', title: 'Incidencias', icon: routeTabIcon, visible: true, candidate: false },
          { name: 'civil-works', title: 'Obras Civiles', icon: routeTabIcon, visible: canCivilWorks, candidate: false },
          { name: 'maintenance', title: 'Mantenimiento', icon: routeTabIcon, visible: canMaintenance, candidate: false },
        ] as const;

        // Selección dinámica de 2 candidatos (además de Inicio/Notificaciones/Aplicaciones)
        const dynamicCandidates = allRoutes.filter(r => r.candidate && r.visible).map(r => r.name as string);
        const top = getTop(dynamicCandidates, 2);
        const chosenNames = top.length > 0 ? top : dynamicCandidates.slice(0, 2);

        const primarySet = new Set<string>(['index', 'notifications', 'apps', ...chosenNames]);

        return allRoutes.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name as any}
            options={{
              title: tab.title,
              tabBarIcon: tab.icon,
              // Mostrar en la barra solo si es primaria y visible; el resto se oculta del tab bar
              href: tab.visible && primarySet.has(tab.name as string) ? undefined : null,
            }}
          />
        ));
      })()}
    </Tabs>
  );
}