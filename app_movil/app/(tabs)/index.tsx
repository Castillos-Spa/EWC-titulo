import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { Route, TriangleAlert as AlertTriangle, Fuel, Ticket, LogOut, User, Sparkles as Cleaning, HardHat, Kanban, Bell, TrendingUp, CircleCheck as CheckCircle, Clock, Map, Car, Wrench, Settings } from 'lucide-react-native';
import { useNotificationsStore } from '../stores/notificationsStore';
import { NotificationsDrawer } from '../components/NotificationsDrawer';
import { useSyncStore } from '../stores/syncStore';
import { useAuthz } from '@/hooks/useAuthz';
import { useNavigationStore } from '../stores/navigationStore';
import { DashboardApi, type DaySummary } from '../services/DashboardApi';
import { fetchDashboardInsights, loadCachedDashboardInsights, getDashboardInsightsCacheInfo, type DashboardInsightData } from '../services/DashboardInsights';
import { SafeStorage } from '../services/SafeStorage';
import { DashboardAlertsCard } from '../components/DashboardAlertsCard';
import { buildPrioritizedAlerts, mapNotificationsToAlertSource } from '@/app/utils/dashboard';
import { SectionHeader } from '../components/ui/SectionHeader';

function getRoleDisplayName(role: string) {
  const roles = {
    driver: 'Conductor',
    supervisor: 'Supervisor',
    technician: 'Técnico',
    admin: 'Administrador',
    cleaning_crew: 'Personal de Aseo',
    civil_works: 'Obras Civiles',
    it_support: 'Soporte TIC',
    manager: 'Gerente',
    finance: 'Finanzas',
  } as const;
  return (roles as any)[role] || role;
}

function SummarySection({
  role,
  colors,
  summary,
  loading,
}: Readonly<{
  role?: string;
  colors: any;
  summary: DaySummary | null;
  loading: boolean;
}>) {
  return (
    <>
      {role === 'driver' && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <Route size={16} color="#2563EB" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Rutas Completadas</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.routesCompleted ?? 0} / ${summary?.routesAssigned ?? 0}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <Fuel size={16} color="#16A34A" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Combustible Registrado</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.fuelRecords ?? 0} registros`}
            </Text>
          </View>
        </>
      )}

      {role === 'cleaning_crew' && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <Cleaning size={16} color="#06B6D4" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Áreas Limpiadas</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.cleaningAreas ?? 0}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <CheckCircle size={16} color="#16A34A" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Checklist Completado</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.checklistCompletion ?? 0}%`}
            </Text>
          </View>
        </>
      )}

      {role === 'civil_works' && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <HardHat size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Órdenes Activas</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.workOrdersActive ?? 0}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <TrendingUp size={16} color="#16A34A" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avance Promedio</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.progressAvg ?? 0}%`}
            </Text>
          </View>
        </>
      )}

      {role === 'it_support' && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <Kanban size={16} color="#8B5CF6" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tickets Asignados</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.ticketsAssigned ?? 0}`}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <Clock size={16} color="#F59E0B" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tiempo Promedio</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>—</Text>
          </View>
        </>
      )}

      {(role === 'supervisor' || role === 'manager' || role === 'admin') && (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <Ticket size={16} color="#7C3AED" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pendientes Aprobación</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>—</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <AlertTriangle size={16} color="#EA580C" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Incidentes Abiertos</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {loading ? '...' : `${summary?.incidentsOpen ?? 0}`}
            </Text>
          </View>
        </>
      )}
    </>
  );
}

type StatusChipInfo = {
  label: string;
  value: string;
  tone: string;
  meta: string;
};

type QuickAccessTile = {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  bgColor: string;
  onPress: () => void;
};

function HeroHeader({
  paddingTop,
  colors,
  statusChips,
  greeting,
  roleLabel,
  onLogout,
  onRefresh,
  loading,
  onOpenNotifications,
  compact = false,
}: Readonly<{
  paddingTop: number;
  colors: any;
  statusChips: StatusChipInfo[];
  greeting: string;
  roleLabel: string;
  onLogout: () => void;
  onRefresh: () => void;
  loading: boolean;
  onOpenNotifications: () => void;
  compact?: boolean;
}>) {
  return (
    <View style={[styles.heroWrapper, { paddingTop }, compact && styles.heroWrapperCompact]}>
      <LinearGradient
        colors={[colors.primary + 'EE', colors.primary + 'AA', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroGradient, compact && styles.heroGradientCompact]}
      >
        <View style={[styles.heroHeaderRow, compact && styles.heroHeaderRowCompact]}>
          <View style={[styles.heroUser, compact && styles.heroUserCompact]}>
            <View style={[styles.heroAvatar, compact && styles.heroAvatarCompact]}>
              <User size={20} color={colors.surface} />
            </View>
            <View style={styles.heroTexts}>
              <Text style={[styles.heroGreeting, { color: colors.surface }]}>{greeting}</Text>
              <Text style={[styles.heroRole, { color: colors.surface + 'CC' }]}>{roleLabel}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.heroLogout, compact && styles.heroLogoutCompact]} onPress={onLogout}>
            <LogOut size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.statusRow, compact && styles.statusRowCompact]}>
          {statusChips.map((chip) => (
            <View
              key={chip.label}
              style={[
                styles.statusChip,
                compact && styles.statusChipCompact,
                { backgroundColor: colors.surface + '15', borderColor: chip.tone },
              ]}
            >
              <Text style={[styles.statusChipLabel, { color: colors.surface + 'CC' }]}>{chip.label}</Text>
              <Text style={[styles.statusChipValue, { color: colors.surface }]}>{chip.value}</Text>
              <Text style={[styles.statusChipMeta, { color: colors.surface + 'AA' }]}>{chip.meta}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.heroActionsRow, compact && styles.heroActionsRowCompact]}>
          <TouchableOpacity
            style={[styles.heroButton, compact && styles.heroButtonCompact, { backgroundColor: colors.surface }]}
            onPress={onRefresh}
          >
            <Text style={[styles.heroButtonText, { color: colors.primary }]}>
              {loading ? 'Actualizando…' : 'Actualizar datos'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.heroButton,
              compact && styles.heroButtonCompact,
              compact && styles.heroButtonLastCompact,
              { borderColor: colors.surface, borderWidth: 1 },
            ]}
            onPress={onOpenNotifications}
          >
            <Text style={[styles.heroButtonText, { color: colors.surface }]}>Notificaciones</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

function QuickPulseGrid({ colors, data, compact }: Readonly<{ colors: any; data: { id: string; label: string; value: string; trend?: string }[]; compact?: boolean }>) {
  return (
    <View style={[styles.kpiGrid, compact && styles.kpiGridCompact]}>
      {data.map((kpi) => (
        <View
          key={kpi.id}
          style={[
            compact ? styles.kpiCardFullCompact : styles.kpiCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]} numberOfLines={2}>
            {kpi.label}
          </Text>
          <Text style={[styles.kpiValue, { color: colors.text }]}>{kpi.value}</Text>
          {!!kpi.trend && <Text style={[styles.kpiTrend, { color: colors.textSecondary }]}>{kpi.trend}</Text>}
        </View>
      ))}
    </View>
  );
}

function QuickAccessCarousel({ colors, tiles, compact }: Readonly<{ colors: any; tiles: QuickAccessTile[]; compact?: boolean }>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.quickAccessScroll, compact && styles.quickAccessScrollCompact]}
    >
      {tiles.map((tile) => (
        <TouchableOpacity
          key={`qa-${tile.title}`}
          style={[styles.quickAccessChip, compact && styles.quickAccessChipCompact, { backgroundColor: tile.bgColor }]}
          onPress={tile.onPress}
          activeOpacity={0.85}
        >
          <View style={[styles.quickAccessIcon, compact && styles.quickAccessIconCompact]}>
            <tile.icon size={22} color={tile.color} />
          </View>
          <View>
            <Text
              style={[styles.quickAccessTitle, compact && styles.quickAccessTitleCompact, { color: colors.text }]}
              numberOfLines={1}
            >
              {tile.title}
            </Text>
            <Text
              style={[styles.quickAccessSubtitle, compact && styles.quickAccessSubtitleCompact, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {tile.subtitle}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function AlertsSection({
  colors,
  alerts,
  secondary,
  loading,
  filter,
  onFilterChange,
  compact,
  sectionStyle,
}: Readonly<{
  colors: any;
  alerts: any[];
  secondary: any[];
  loading: boolean;
  filter: 'critical' | 'all';
  onFilterChange: (v: 'critical' | 'all') => void;
  compact?: boolean;
  sectionStyle?: any;
}>) {
  return (
    <View style={[styles.section, sectionStyle]}>
      <SectionHeader title="Alertas priorizadas" subtitle="Incidentes, tickets y OTs críticos" />
      <View
        style={[
          styles.cardSurface,
          compact && styles.cardSurfaceCompact,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <DashboardAlertsCard
          alerts={alerts}
          secondary={secondary}
          loading={loading}
          filter={filter}
          onFilterChange={onFilterChange}
          colors={colors}
        />
      </View>
    </View>
  );
}

function NotificationsPanel({ colors, notifications, onOpenDrawer, sectionStyle }: Readonly<{ colors: any; notifications: any[]; onOpenDrawer: () => void; sectionStyle?: any }>) {
  return (
    <View style={[styles.section, sectionStyle]}>
      <SectionHeader title="Notificaciones recientes" subtitle="Sincronizadas con el centro web" />
      <View style={[styles.notificationsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {notifications.length === 0 ? (
          <View style={[styles.notificationItem, { borderBottomWidth: 0 }]}>
            <View style={[styles.notificationIcon, { backgroundColor: colors.background }]}>
              <Bell size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationTitle, { color: colors.textSecondary }]}>Sin notificaciones recientes</Text>
              <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>Todo funcionando</Text>
            </View>
          </View>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <View key={n.id} style={styles.notificationItem}>
              <View style={[styles.notificationIcon, { backgroundColor: colors.primary + '15' }]}>
                <Bell size={16} color={colors.primary} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, { color: colors.text }]} numberOfLines={1}>
                  {n.message || n.type || 'Notificación'}
                </Text>
                <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                  {new Date(n.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
      <TouchableOpacity onPress={onOpenDrawer} style={styles.notificationsButton}>
        <Text style={[styles.notificationsButtonText, { color: colors.primary }]}>Ver todas</Text>
      </TouchableOpacity>
    </View>
  );
}

// NOTE: pendiente dividir en hooks dedicados cuando la arquitectura del dashboard móvil esté estable.
export default function HomeScreen() { // NOSONAR
  const { user, logout } = useAuthStore();
  const { getColors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { items: notifications } = useNotificationsStore();
  const { width } = useWindowDimensions();
  const isCompactScreen = width < 380;

  const colors = getColors();
  const sectionSpacingStyle = isCompactScreen ? styles.sectionCompact : undefined;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { online, lastApiOk, syncing, checkNow, dbOk } = useSyncStore();
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [insights, setInsights] = useState<DashboardInsightData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [alertsFilter, setAlertsFilter] = useState<'critical' | 'all'>('critical');
  const [cacheTs, setCacheTs] = useState<number | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      setInsightsLoading(true);
      const data = await fetchDashboardInsights();
      setInsights(data);
      setUsingCache(false);
    } catch (err) {
      console.warn('dashboard insights load failed', err);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Hidratar con caché offline si existe
    let cancelled = false;
    (async () => {
      const cached = await loadCachedDashboardInsights();
      if (!cancelled) {
        const info = await getDashboardInsightsCacheInfo();
        if (info.ts) setCacheTs(info.ts);
      }
      if (!cancelled && cached) { setInsights(cached); setUsingCache(true); }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    // Conectar WS al montar o cuando cambia el usuario
    useNotificationsStore.getState().connect();
    // Chequear estado de sincronización al entrar
    useSyncStore.getState().checkNow();
    return () => {
      useNotificationsStore.getState().disconnect();
    };
  }, [user?.id]);

  // Cargar preferencia de filtro de alertas (persistencia)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const saved = await SafeStorage.getItem('dashboard_alerts_filter');
        if (!cancelled && (saved === 'critical' || saved === 'all')) {
          setAlertsFilter(saved);
        }
      } catch {}
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  // Guardar preferencia cuando cambie
  useEffect(() => {
    void SafeStorage.setItem('dashboard_alerts_filter', alertsFilter).catch(() => {});
  }, [alertsFilter]);

  useEffect(() => {
    // cargar resumen del día cuando haya usuario
    const load = async () => {
      if (!user?.id) return;
      try {
        setSummaryLoading(true);
        const s = await DashboardApi.myDaySummary();
        setSummary(s);
      } finally {
        setSummaryLoading(false);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void loadInsights();
  }, [user?.id, loadInsights]);

  const handleLogout = async () => {
    await logout();
  };

  const navigateToTab = (tabName: string) => {
    router.push(`/(tabs)/${tabName}` as any);
  };

  const handleRefresh = async () => {
    try {
      setSummaryLoading(true);
      await Promise.allSettled([
        checkNow(),
        DashboardApi.myDaySummary().then(setSummary).catch(() => {}),
        loadInsights(),
      ]);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Acciones rápidas: atajos a módulos visibles para el usuario que NO están en la barra de navegación
  const {
    canRoutes,
    canFuel,
    canMaintenance,
    canCleaning,
    canCivilWorks,
    canTickets,
    canIncidents,
  } = useAuthz();
  const usage = useNavigationStore((s) => s.usage);
  const { getTop, markUsed } = useNavigationStore();

  const allRoutes = [
    { name: 'index', title: 'Inicio', icon: Map, visible: true, fixed: true, candidate: false },
    { name: 'work', title: 'Sistema de Tickets', icon: Ticket, visible: canTickets, candidate: true },
    { name: 'routes', title: 'Gestión de Rutas', icon: Map, visible: canRoutes, candidate: true },
    { name: 'notifications', title: 'Notificaciones', icon: Bell, visible: true, fixed: true, candidate: false },
    { name: 'apps', title: 'Aplicaciones', icon: Map, visible: true, fixed: true, candidate: false },
    { name: 'fuel', title: 'Combustible', icon: Fuel, visible: canFuel, candidate: false },
    { name: 'fleet', title: 'Registro de Flota', icon: Car, visible: canRoutes, candidate: false },
    { name: 'cleaning', title: 'Aseo', icon: Cleaning, visible: canCleaning, candidate: false },
    { name: 'settings', title: 'Configuración', icon: Settings, visible: true, candidate: false },
    { name: 'incidents', title: 'Incidentes', icon: AlertTriangle, visible: canIncidents, candidate: false },
    { name: 'civil-works', title: 'Obras Civiles', icon: HardHat, visible: canCivilWorks, candidate: false },
    { name: 'maintenance', title: 'Mantenimiento', icon: Wrench, visible: canMaintenance, candidate: false },
  ] as const;

  const dynamicCandidates = allRoutes.filter(r => r.candidate && r.visible).map(r => r.name as string);
  const topDyn = getTop(dynamicCandidates, 2);
  const chosenDyn = topDyn.length > 0 ? topDyn : dynamicCandidates.slice(0, 2);
  const primarySet = new Set<string>(['index', 'notifications', 'apps', ...chosenDyn]);

  const nonPrimaryVisible = allRoutes.filter(r => r.visible && !primarySet.has(r.name as string));
  const recentOrder = Object.entries(usage)
    .sort((a, b) => (b[1].lastVisited || 0) - (a[1].lastVisited || 0))
    .map(([route]) => route);
  const recentModules = recentOrder
    .map(n => nonPrimaryVisible.find(r => r.name === n))
    .filter((x): x is typeof nonPrimaryVisible[number] => !!x)
    .slice(0, 6) // limitar a 6 recientes
    .map(r => ({
      title: r.title,
      subtitle: 'Reciente',
      icon: r.icon,
      color: '#2563EB',
      bgColor: '#EFF6FF',
      onPress: () => { markUsed(r.name as string); navigateToTab(r.name as string); },
    }));

  

  const generalHighlights = useMemo(() => insights?.modules.general?.highlights ?? [], [insights]);

  const prioritizedAlerts = useMemo(() => {
    if (!insights) {
      return { critical: [], all: [] };
    }
    const notificationsSource = mapNotificationsToAlertSource(notifications);
    return buildPrioritizedAlerts({
      tickets: insights.alertSources.tickets,
      ots: insights.alertSources.ots,
      incidents: insights.alertSources.incidents,
      civil: insights.alertSources.civil,
      aseos: insights.alertSources.aseos,
      notifications: notificationsSource,
    });
  }, [insights, notifications]);

  let dbStatusLabel = '—';
  if (dbOk === true) dbStatusLabel = 'OK';
  else if (dbOk === false) dbStatusLabel = 'Error';

  const apiMeta = lastApiOk
    ? `Últ. ${new Date(lastApiOk).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
    : 'Sin datos';
  let dbMeta = 'Sin verificación';
  if (dbOk === false) dbMeta = 'Revisar replicación';
  else if (dbOk === true) dbMeta = 'Sincronizada';
  let syncMeta = '—';
  if (cacheTs) {
    syncMeta = usingCache ? 'Datos desde caché' : 'Datos online';
  }

  const statusChips: StatusChipInfo[] = [
    {
      label: 'API',
      value: online ? 'Online' : 'Offline',
      tone: online ? colors.success : colors.warning,
      meta: apiMeta,
    },
    {
      label: 'Base de datos',
      value: dbStatusLabel,
      tone: dbOk === false ? colors.warning : colors.success,
      meta: dbMeta,
    },
    {
      label: 'Sincronización',
      value: syncing ? 'En curso' : 'Al día',
      tone: syncing ? colors.warning : colors.success,
      meta: syncMeta,
    },
  ];

  const quickPulse = (generalHighlights.length > 0 ? generalHighlights.slice(0, 4) : [
    { label: 'Incidentes abiertos', value: `${summary?.incidentsOpen ?? 0}`, trend: summaryLoading ? 'Actualizando…' : 'Hoy', trendTone: summary?.incidentsOpen ? 'negative' : 'positive' },
    { label: 'Rutas completadas', value: `${summary?.routesCompleted ?? 0}/${summary?.routesAssigned ?? 0}`, trend: 'Operación diaria', trendTone: 'neutral' },
    { label: 'Tickets asignados', value: `${summary?.ticketsAssigned ?? 0}`, trend: 'Últimas 24h', trendTone: 'neutral' },
    { label: 'Checklist aseo', value: `${summary?.checklistCompletion ?? 0}%`, trend: 'Cumplimiento', trendTone: 'neutral' },
  ]).map((item, idx) => ({
    id: `${item.label}-${idx}`,
    label: item.label,
    value: item.value,
    trend: item.trend,
    trendTone: item.trendTone ?? 'neutral',
  }));

  const quickAccessTiles: QuickAccessTile[] = (recentModules.length > 0 ? recentModules : nonPrimaryVisible.slice(0, 5).map((r) => ({
    title: r.title,
    subtitle: 'Disponible',
    icon: r.icon,
    color: colors.primary,
    bgColor: colors.primary + '12',
    onPress: () => { markUsed(r.name as string); navigateToTab(r.name as string); },
  })));

  const greeting = `Hola, ${user?.name?.split(' ')[0] || 'equipo'}`;
  const roleLabel = getRoleDisplayName(user?.role || '');

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 80 }]}
      showsVerticalScrollIndicator={false}
    >
      <HeroHeader
        paddingTop={insets.top + 16}
        colors={colors}
        statusChips={statusChips}
        greeting={greeting}
        roleLabel={roleLabel}
        onLogout={handleLogout}
        onRefresh={handleRefresh}
        loading={syncing || summaryLoading}
        onOpenNotifications={() => setDrawerOpen(true)}
        compact={isCompactScreen}
      />

      <View style={[styles.section, sectionSpacingStyle]}>
        <SectionHeader title="Indicadores clave" subtitle="Métricas alineadas al panel web" />
        <QuickPulseGrid colors={colors} data={quickPulse} compact={isCompactScreen} />
      </View>

      <View style={[styles.section, sectionSpacingStyle]}>
        <SectionHeader title="Resumen del día" subtitle="Actividad personalizada por rol" />
        <View
          style={[
            styles.summaryCard,
            isCompactScreen && styles.cardSurfaceCompact,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <SummarySection role={user?.role} colors={colors} summary={summary} loading={summaryLoading} />
        </View>
      </View>

      <View style={[styles.section, sectionSpacingStyle]}>
        <SectionHeader title="Accesos rápidos" subtitle="Tus módulos prioritarios" />
        <QuickAccessCarousel colors={colors} tiles={quickAccessTiles} compact={isCompactScreen} />
      </View>

      <AlertsSection
        colors={colors}
        alerts={prioritizedAlerts.critical}
        secondary={prioritizedAlerts.all}
        loading={insightsLoading}
        filter={alertsFilter}
        onFilterChange={setAlertsFilter}
        compact={isCompactScreen}
        sectionStyle={sectionSpacingStyle}
      />

      <NotificationsPanel
        colors={colors}
        notifications={notifications}
        onOpenDrawer={() => setDrawerOpen(true)}
        sectionStyle={sectionSpacingStyle}
      />

      <NotificationsDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </ScrollView>
  );
}

const styles: any = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  heroGradient: {
    borderRadius: 28,
    padding: 20,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroTexts: {
    flex: 1,
    minWidth: 0,
  },
  heroGreeting: {
    fontSize: 20,
    fontWeight: '700',
  },
  heroRole: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  heroLogout: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 20,
    marginHorizontal: -6,
    flexWrap: 'wrap',
  },
  statusChip: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 6,
    marginBottom: 12,
    minWidth: 150,
  },
  statusChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statusChipValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusChipMeta: {
    fontSize: 12,
  },
  heroActionsRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
  },
  heroButton: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  kpiCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  kpiTrend: {
    fontSize: 12,
    marginTop: 6,
  },
  quickAccessScroll: {
    paddingHorizontal: 20,
    paddingVertical: 4,
  },
  quickAccessChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    marginRight: 12,
    minWidth: 220,
  },
  quickAccessIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickAccessTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  quickAccessSubtitle: {
    fontSize: 13,
  },
  cardSurface: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  cacheBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  analyticsStack: {
    marginTop: 20,
  },
  notificationsButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  notificationsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.select({
      ios: 60,
      android: 40,
      default: 60,
    }),
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  companySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  companyLogo: {
    width: 56,
    height: 56,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  companySubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  userRole: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '600',
    flexShrink: 1,
  },
  userDepartment: {
    fontSize: 12,
    marginTop: 1,
    flexShrink: 1,
  },
  logoutButton: {
    padding: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexShrink: 0,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    backgroundColor: '#16A34A',
    borderRadius: 4,
    marginRight: 8,
  },
  syncText: {
    fontSize: 14,
    flex: 1,
  },
  quickActions: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: '48%',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    minHeight: 120,
  },
  actionIcon: {
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
  },
  dailySummary: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  operationalSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  insightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  insightCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  insightValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  insightTrend: {
    fontSize: 12,
    marginTop: 6,
  },
  analyticsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    marginLeft: 8,
  },
  modulesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  summaryLabel: {
    fontSize: 15,
    flex: 1,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  notificationsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationsList: {
    borderRadius: 16,
    borderWidth: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationText: {
    fontSize: 13,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
  },
  sectionCompact: {
    paddingHorizontal: 16,
  },
  heroWrapperCompact: {
    paddingHorizontal: 16,
  },
  heroGradientCompact: {
    padding: 16,
  },
  heroHeaderRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroUserCompact: {
    width: '100%',
    marginBottom: 12,
  },
  heroAvatarCompact: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  heroLogoutCompact: {
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
  statusRowCompact: {
    marginHorizontal: 0,
  },
  statusChipCompact: {
    width: '100%',
    marginHorizontal: 0,
  },
  heroActionsRowCompact: {
    flexDirection: 'column',
    marginHorizontal: 0,
  },
  heroButtonCompact: {
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 10,
  },
  heroButtonLastCompact: {
    marginBottom: 0,
  },
  kpiGridCompact: {
    flexDirection: 'column',
  },
  kpiCardFullCompact: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  quickAccessScrollCompact: {
    paddingHorizontal: 16,
  },
  quickAccessChipCompact: {
    minWidth: 180,
    paddingVertical: 12,
  },
  quickAccessIconCompact: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  quickAccessTitleCompact: {
    fontSize: 14,
  },
  quickAccessSubtitleCompact: {
    fontSize: 12,
  },
  cardSurfaceCompact: {
    padding: 16,
  },
});

