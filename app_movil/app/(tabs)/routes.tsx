import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Navigation2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouteStore } from '@/stores/routeStore';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { RouteCard } from '@/components/RouteCard';
import RouteDetailModal from '@/components/RouteDetailModal';
import TripModal from '@/components/TripModal';
import { AccessGuard } from '@/components/AccessGuard';
import { useAuthz } from '@/hooks/useAuthz';

type RouteLayout = {
  isSmall: boolean;
  isTablet: boolean;
  horizontalPadding: number;
  verticalPadHeader: number;
  columns: number;
  cardGap: number;
  cardWidth: number;
  titleFontSize: number;
  subtitleFontSize: number;
  statNumberFont: number;
  statIconBox: number;
  addBtnSize: number;
};

function computeRouteLayout(width: number): RouteLayout {
  const isSmall = width < 400;
  const isTablet = width >= 768;

  let horizontalPadding = 20;
  if (isSmall) horizontalPadding = 12; else if (isTablet) horizontalPadding = 24;

  const verticalPadHeader = isSmall ? 12 : 16;

  let columns = 3;
  if (isTablet) columns = 4; else if (isSmall) columns = 2;

  const cardGap = 12;
  const totalGaps = (columns - 1) * cardGap;
  const cardWidth = (width - horizontalPadding * 2 - totalGaps) / columns;

  let titleFontSize = 24;
  if (isSmall) titleFontSize = 20; else if (isTablet) titleFontSize = 26;

  const subtitleFontSize = isSmall ? 12 : 14;
  const statNumberFont = isSmall ? 18 : 20;
  const statIconBox = isSmall ? 36 : 40;
  const addBtnSize = isSmall ? 40 : 44;

  return { isSmall, isTablet, horizontalPadding, verticalPadHeader, columns, cardGap, cardWidth, titleFontSize, subtitleFontSize, statNumberFont, statIconBox, addBtnSize };
}

export default function RoutesScreen() {
  const { width } = useWindowDimensions();
  const { hasAnyRole, hasPerm, canRoutes } = useAuthz();
    const { routes, loadRoutes, selectedTrip, selectRoute } = useRouteStore();
    const { getColors } = useThemeStore();
    const colors = getColors();
    const insets = useSafeAreaInsets();
    const { horizontalPadding, verticalPadHeader, titleFontSize, subtitleFontSize } = useMemo(() => computeRouteLayout(width), [width]);

    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState('');
    const [onlyActive, setOnlyActive] = useState(false);
    const [selectedDate, setSelectedDate] = useState(() => new Date());
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [showRouteDetail, setShowRouteDetail] = useState(false);
    const [showTripModal, setShowTripModal] = useState(false);
    const user = useAuthStore(state => state.user);
    const isDriver = (
      !!user && ['driver','conductor'].includes(String(user.role).toLowerCase())
    ) || hasAnyRole('Driver','Conductor') || hasPerm('ROUTES_DRIVER');

    const onRefresh = async () => {
      setRefreshing(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      await loadRoutes(dateStr);
      setRefreshing(false);
    };

    useEffect(() => {
      const dateStr = selectedDate.toISOString().split('T')[0];
      void loadRoutes(dateStr);
    }, [loadRoutes, selectedDate]);

    const handleRoutePress = (route: any) => {
      selectRoute(route);
      setSelectedRoute(route);
      setShowRouteDetail(true);
    };

    const assignedRoutes = useMemo(() => {
      const uname = (user?.name || '').toLowerCase();
      const uid = user?.id === undefined || user?.id === null ? null : String(user.id);
      return routes.filter(r => {
        const routeDriverName = String(r.driverName || '').toLowerCase();
        const routeDriverId = r.driverId === undefined || r.driverId === null ? null : String(r.driverId);
        if (uid && routeDriverId && routeDriverId === uid) return true;
        return routeDriverName === uname;
      });
    }, [routes, user]);

    const { activeRoutes, pendingRoutes } = useMemo(() => ({
      activeRoutes: assignedRoutes.filter(route => route.status === 'in_progress'),
      pendingRoutes: assignedRoutes.filter(route => route.status === 'planned'),
    }), [assignedRoutes]);

    const filteredRoutes = useMemo(() => {
      const q = query.trim().toLowerCase();
      return assignedRoutes.filter(route => {
        if (onlyActive && route.status !== 'in_progress') return false;
        if (!q) return true;
        const code = String(route.code ?? '').toLowerCase();
        const origin = String(route.origin ?? '').toLowerCase();
        const destination = String(route.destination ?? '').toLowerCase();
        return code.includes(q) || origin.includes(q) || destination.includes(q);
      });
    }, [assignedRoutes, query, onlyActive]);

    useEffect(() => {
      if (selectedTrip) {
        setShowTripModal(true);
        setShowRouteDetail(false);
      }
    }, [selectedTrip]);

    return (
      <AccessGuard allowed={isDriver || canRoutes}>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={[colors.primary + '22', '#00000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.heroGradient}
          />
          <View pointerEvents="none" style={styles.halosContainer}>
            <View style={[styles.haloTop, { backgroundColor: colors.primary + '33' }]} />
            <View style={[styles.haloBottom, { backgroundColor: colors.secondary + '33' }]} />
          </View>

          <View style={[styles.heroSection, { paddingHorizontal: horizontalPadding, paddingTop: verticalPadHeader + insets.top }]}>
            <View style={[styles.heroBadge, { backgroundColor: colors.surface + 'AA', borderColor: colors.border }]}> 
              <Navigation2 size={14} color={colors.primary} />
              <Text style={[styles.heroBadgeText, { color: colors.textSecondary }]}>Rutas</Text>
            </View>
            <Text style={[styles.heroTitle, { color: colors.text, fontSize: titleFontSize }]}>Rutas asignadas</Text>
            <Text style={[styles.heroText, { color: colors.textSecondary, fontSize: subtitleFontSize }]}>Inicia y gestiona tus rutas. Cambia de día para revisar asignaciones anteriores o próximas.</Text>
          </View>

          <View style={[styles.kpiContainer, { paddingHorizontal: horizontalPadding, gap: 12 }]}>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}> 
              <View style={styles.kpiHeaderRow}>
                <View>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Total rutas</Text>
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.text }]}>{assignedRoutes.length}</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}> 
              <View style={styles.kpiHeaderRow}>
                <View>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Rutas En curso</Text>
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.text }]}>{activeRoutes.length}</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface }]}> 
              <View style={styles.kpiHeaderRow}>
                <View>
                  <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Pendientes por Iniciar</Text>
                </View>
              </View>
              <Text style={[styles.kpiValue, { color: colors.text }]}>{pendingRoutes.length}</Text>
            </View>
          </View>

          <View style={[styles.filtersCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: horizontalPadding }]}> 
            <View style={styles.filtersHeaderRow}>
              <View style={styles.filtersTitleRow}>
                <MapPin size={18} color={colors.primary} />
                <Text style={[styles.filtersTitle, { color: colors.textSecondary }]}>Panel del conductor</Text>
              </View>
            </View>
            <View style={[styles.filtersRow, { alignItems: 'flex-end' }]}>
              <View style={styles.searchContainer}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Buscar</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Ej. Planta Quilicura"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                />
              </View>
              <View style={styles.toggleRow}>
                <TouchableOpacity style={[styles.toggleChip, !onlyActive && styles.toggleChipActive]} onPress={() => setOnlyActive(false)}>
                  <Text style={[styles.toggleChipText, !onlyActive && styles.toggleChipTextActive]}>Todas</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toggleChip, onlyActive && styles.toggleChipActive]} onPress={() => setOnlyActive(true)}>
                  <Text style={[styles.toggleChipText, onlyActive && styles.toggleChipTextActive]}>Sólo activas</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={[styles.dateRow, { borderTopColor: colors.border }]}> 
              <TouchableOpacity onPress={() => setSelectedDate(d => new Date(d.getTime() - 86400000))} style={styles.dateBtn}>
                <Text style={styles.dateBtnText}>Anterior</Text>
              </TouchableOpacity>
              <Text style={[styles.dateLabel, { color: colors.text }]}>
                {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDate(d => new Date(d.getTime() + 86400000))} style={styles.dateBtn}>
                <Text style={styles.dateBtnText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={[styles.content, { paddingHorizontal: horizontalPadding }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            showsVerticalScrollIndicator={false}
          >
            {filteredRoutes.length > 0 ? (
              filteredRoutes.map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onPress={() => handleRoutePress(route)}
                  progress={`${route.stops.filter((s: any) => s.status === 'completed').length}/${route.stops.length}`}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <MapPin size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No hay rutas asignadas</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Cambia de día o ajusta los filtros</Text>
              </View>
            )}
          </ScrollView>

          {showRouteDetail && selectedRoute && (
            <RouteDetailModal
              visible={showRouteDetail}
              route={selectedRoute}
              onClose={() => { setShowRouteDetail(false); setSelectedRoute(null); }}
            />
          )}

          {showTripModal && selectedTrip && (
            <TripModal
              trip={selectedTrip}
              visible={showTripModal}
              onClose={() => setShowTripModal(false)}
            />
          )}
        </SafeAreaView>
      </AccessGuard>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 220 },
  halosContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  haloTop: { position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 9999, opacity: 0.5 },
  haloBottom: { position: 'absolute', bottom: -80, right: -40, width: 260, height: 260, borderRadius: 9999, opacity: 0.5 },
  heroSection: { paddingBottom: 12, gap: 8 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4, textTransform: 'uppercase' },
  heroTitle: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  heroText: { fontSize: 13, lineHeight: 18 },
  kpiContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 12 },
  kpiCard: { flex: 1, borderRadius: 20, padding: 14, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  kpiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  kpiIconBox: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  kpiLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  kpiSubLabel: { fontSize: 11, marginTop: 2 },
  kpiValue: { fontSize: 22, fontWeight: '700' },
  filtersCard: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  filtersHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  filtersTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtersTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  primaryActionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  primaryActionText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filtersRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  searchContainer: { flex: 1 },
  inputLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 4 },
  searchBox: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center' },
  searchPlaceholder: { fontSize: 13 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#CBD5F5', backgroundColor: '#EFF6FF' },
  toggleChipActive: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  toggleChipText: { fontSize: 12, fontWeight: '600', color: '#1D4ED8' },
  toggleChipTextActive: { color: '#FFFFFF' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  dateBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E2E8F0' },
  dateBtnText: { fontWeight: '700', color: '#0F172A' },
  dateLabel: { fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
  content: { flex: 1, paddingHorizontal: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});