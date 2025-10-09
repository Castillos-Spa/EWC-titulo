import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
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

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { getColors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { items: notifications } = useNotificationsStore();

  const colors = getColors();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { online, lastApiOk, syncing, checkNow, dbOk, checkDb } = useSyncStore();
  const [dbChecking, setDbChecking] = useState(false);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    // Conectar WS al montar o cuando cambia el usuario
    useNotificationsStore.getState().connect();
    // Chequear estado de sincronización al entrar
    useSyncStore.getState().checkNow();
    return () => {
      useNotificationsStore.getState().disconnect();
    };
  }, [user?.id]);

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

  const handleLogout = async () => {
    await logout();
  };

  const navigateToTab = (tabName: string) => {
    router.push(`/(tabs)/${tabName}` as any);
  };

  const handleRefresh = async () => {
    try {
      setSummaryLoading(true);
      await Promise.all([
        checkNow(),
        DashboardApi.myDaySummary().then(setSummary).catch(() => {}),
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

  const getDepartmentName = (department: string) => {
    const departments = {
      transport: 'Transporte',
      cleaning: 'Aseo',
      civil_works: 'Obras Civiles',
      it: 'Tecnología',
      management: 'Gerencia',
      finance: 'Finanzas',
    };
    return departments[department as keyof typeof departments] || department;
  };

  const getRoleDisplayName = (role: string) => {
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
    };
    return roles[role as keyof typeof roles] || role;
  };
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={20} color="#2563EB" />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
              <Text style={[styles.userRole, { color: colors.primary }]}>{getRoleDisplayName(user?.role || '')}</Text>
              <Text style={[styles.userDepartment, { color: colors.textSecondary }]}>{getDepartmentName(user?.department || '')}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.background }]} onPress={handleLogout}>
            <LogOut size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Estado de sincronización */}
      <View style={[styles.syncStatus, { backgroundColor: (online ? colors.success : colors.warning) + '15', borderBottomColor: colors.border }]}> 
        <View style={[styles.syncIndicator, { backgroundColor: online ? '#16A34A' : '#EA580C' }]} />
        <Text style={[styles.syncText, { color: online ? colors.success : colors.warning }]}> 
          {online ? 'API: Online' : 'API: Offline'} • Últ. API: {lastApiOk ? new Date(lastApiOk).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'}
          {'  '}• BD: {dbOk === undefined ? '—' : (dbOk ? 'OK' : 'Error')}
        </Text>
        <TouchableOpacity onPress={handleRefresh} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background, marginRight: 8 }}>
          <Text style={{ color: colors.textSecondary }}>{(syncing || summaryLoading) ? 'Actualizando…' : 'Actualizar'}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={async () => { setDbChecking(true); await checkDb().catch(() => {}); setDbChecking(false); }} 
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background }}
        >
          <Text style={{ color: colors.textSecondary }}>{dbChecking ? 'Chequeando BD…' : 'BD'}</Text>
        </TouchableOpacity>
      </View>

      {/* Recientes */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recientes</Text>
        <View style={styles.actionsGrid}>
          {recentModules.length === 0 ? (
            <View style={[styles.actionCard, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }]}>
              <Text style={{ color: colors.textSecondary }}>Aún no hay módulos recientes</Text>
            </View>
          ) : recentModules.map((action) => (
            <TouchableOpacity key={`qa-${action.title}`} style={[styles.actionCard, { backgroundColor: action.bgColor }]} onPress={action.onPress}>
              <View style={styles.actionIcon}>
                <action.icon size={28} color={action.color} strokeWidth={2} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resumen del día conectado */}
      <View style={styles.dailySummary}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen del Día</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SummarySection role={user?.role} colors={colors} summary={summary} loading={summaryLoading} />
        </View>
      </View>

      {/* Notificaciones recientes */}
      <View style={styles.notificationsSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notificaciones Recientes</Text>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.background }}>
            <Text style={{ color: colors.textSecondary }}>Ver todas</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.notificationsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {notifications.length === 0 ? (
            <View style={[styles.notificationItem, { borderBottomWidth: 0 }]}>
              <View style={[styles.notificationIcon, { backgroundColor: colors.background }]}>
                <Bell size={16} color={colors.textSecondary} />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationText, { color: colors.textSecondary }]}>Sin notificaciones recientes</Text>
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
      </View>

      <NotificationsDrawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
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
});