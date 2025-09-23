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
import { Route, TriangleAlert as AlertTriangle, Fuel, Ticket, LogOut, User, Sparkles as Cleaning, HardHat, Monitor, Kanban, Bell, TrendingUp, CircleCheck as CheckCircle, Clock, Building2 } from 'lucide-react-native';
import { useNotificationsStore } from '../stores/notificationsStore';
import { NotificationsDrawer } from '../components/NotificationsDrawer';

export default function HomeScreen() {
  const { user, logout } = useAuthStore();
  const { getColors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { items: notifications } = useNotificationsStore();

  const colors = getColors();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Conectar WS al montar o cuando cambia el usuario
    useNotificationsStore.getState().connect();
    return () => {
      useNotificationsStore.getState().disconnect();
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
  };

  const navigateToTab = (tabName: string) => {
    router.push(`/(tabs)/${tabName}` as any);
  };

  // Acciones rápidas basadas en el rol del usuario
  const getQuickActionsForRole = () => {
    const baseActions = [
      {
        title: 'Kanban Personal',
        subtitle: 'Ver mis tareas',
        icon: Kanban,
        color: '#7C3AED',
        bgColor: '#F3E8FF',
        onPress: () => navigateToTab('kanban'),
        roles: ['all'],
      },
      {
        title: 'Incidentes',
        subtitle: 'Reportar problema',
        icon: AlertTriangle,
        color: '#EA580C',
        bgColor: '#FFF7ED',
        onPress: () => navigateToTab('incidents'),
        roles: ['all'],
      },
    ];

    const roleSpecificActions = [
      // Transporte
      {
        title: 'Rutas del Día',
        subtitle: '3 rutas asignadas',
        icon: Route,
        color: '#2563EB',
        bgColor: '#EFF6FF',
        onPress: () => navigateToTab('routes'),
        roles: ['driver', 'supervisor'],
      },
      {
        title: 'Combustible',
        subtitle: 'Registrar consumo',
        icon: Fuel,
        color: '#16A34A',
        bgColor: '#F0FDF4',
        onPress: () => navigateToTab('fuel'),
        roles: ['driver', 'supervisor'],
      },
      
      // Aseo
      {
        title: 'Parte Diario',
        subtitle: 'Reportar limpieza',
        icon: Cleaning,
        color: '#06B6D4',
        bgColor: '#F0F9FF',
        onPress: () => navigateToTab('cleaning'),
        roles: ['cleaning_crew'],
      },
      
      // Obras Civiles
      {
        title: 'Órdenes de Trabajo',
        subtitle: 'Ver asignaciones',
        icon: HardHat,
        color: '#F59E0B',
        bgColor: '#FFFBEB',
        onPress: () => navigateToTab('civil-works'),
        roles: ['civil_works'],
      },
      
      // TIC
      {
        title: 'Tickets TIC',
        subtitle: 'Gestionar soporte',
        icon: Monitor,
        color: '#8B5CF6',
        bgColor: '#F5F3FF',
        onPress: () => navigateToTab('it-support'),
        roles: ['it_support'],
      },
      
      // Supervisores y Gerencia
      {
        title: 'Tickets',
        subtitle: 'Gestionar tickets',
        icon: Ticket,
        color: '#7C3AED',
        bgColor: '#F3E8FF',
        onPress: () => navigateToTab('tickets'),
        roles: ['supervisor', 'admin', 'manager', 'technician'],
      },
    ];

    return [...baseActions, ...roleSpecificActions].filter(action => 
      action.roles.includes('all') || action.roles.includes(user?.role || '')
    );
  };

  const quickActions = getQuickActionsForRole();

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
      contentContainerStyle={[
        styles.contentContainer,
        { paddingBottom: insets.bottom + 100 }
      ]}
    >
      {/* Header corporativo */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.companySection}>
          <View style={styles.companyLogo}>
            <Building2 size={32} color="#2563EB" />
          </View>
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, { color: colors.text }]}>Wilson Castillo</Text>
            <Text style={[styles.companySubtitle, { color: colors.textSecondary }]}>Hub Corporativo Móvil</Text>
          </View>
        </View>
        
        <View style={styles.userSection}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={20} color="#2563EB" />
            </View>
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
              <Text style={[styles.userRole, { color: colors.primary }]}>
                {getRoleDisplayName(user?.role || '')}
              </Text>
              <Text style={[styles.userDepartment, { color: colors.textSecondary }]}>
                {getDepartmentName(user?.department || '')}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.background }]}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Estado de sincronización */}
      <View style={[styles.syncStatus, { backgroundColor: colors.success + '15', borderBottomColor: colors.border }]}>
        <View style={styles.syncIndicator} />
        <Text style={[styles.syncText, { color: colors.success }]}>
          Sincronizado • Última actualización: hace 5 min
        </Text>
        <Bell size={16} color="#16A34A" />
      </View>

      {/* Acciones rápidas personalizadas por rol */}
      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acciones Rápidas</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity 
              key={`qa-${action.title}`} 
              style={[styles.actionCard, { backgroundColor: action.bgColor }]}
              onPress={action.onPress}
            >
              <View style={styles.actionIcon}>
                <action.icon size={28} color={action.color} strokeWidth={2} />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>{action.title}</Text>
              <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Resumen del día personalizado */}
      <View style={styles.dailySummary}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen del Día</Text>
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {user?.role === 'driver' && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <Route size={16} color="#2563EB" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Rutas Completadas</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>1 / 3</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <Fuel size={16} color="#16A34A" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Combustible Registrado</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>2 registros</Text>
              </View>
            </>
          )}
          
          {user?.role === 'cleaning_crew' && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <Cleaning size={16} color="#06B6D4" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Áreas Limpiadas</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>5 / 8</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <CheckCircle size={16} color="#16A34A" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Checklist Completado</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>85%</Text>
              </View>
            </>
          )}
          
          {user?.role === 'civil_works' && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <HardHat size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Órdenes Activas</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>3</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <TrendingUp size={16} color="#16A34A" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avance Promedio</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>67%</Text>
              </View>
            </>
          )}
          
          {user?.role === 'it_support' && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <Monitor size={16} color="#8B5CF6" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tickets Asignados</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>12</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <Clock size={16} color="#F59E0B" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tiempo Promedio</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>2.5h</Text>
              </View>
            </>
          )}

          {(user?.role === 'supervisor' || user?.role === 'manager' || user?.role === 'admin') && (
            <>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <Ticket size={16} color="#7C3AED" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pendientes Aprobación</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>8</Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
                  <AlertTriangle size={16} color="#EA580C" />
                </View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Incidentes Abiertos</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>2</Text>
              </View>
            </>
          )}

          {/* Fila común para todos */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.background }]}>
              <CheckCircle size={16} color="#16A34A" />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tareas Completadas</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>12</Text>
          </View>
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
                    {n.type || 'Notificación'}
                  </Text>
                  <Text style={[styles.notificationText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {n.message}
                  </Text>
                  <Text style={[styles.notificationTime, { color: colors.textSecondary }]}>
                    {new Date(n.timestamp).toLocaleTimeString()}
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