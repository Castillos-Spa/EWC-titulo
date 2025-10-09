import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Clock, Truck, Plus } from 'lucide-react-native';
import { useRouteStore } from '../stores/routeStore';
import { useThemeStore } from '../stores/themeStore';
import { RouteCard } from '../components/RouteCard';
import RouteDetailModal from '../components/RouteDetailModal';
import TripModal from '../components/TripModal';
import { AccessGuard } from '../components/AccessGuard';
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
  const { canRoutes } = useAuthz();
  const { routes, loadRoutes, selectedTrip, selectRoute } = useRouteStore();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const insets = useSafeAreaInsets();
  const { isSmall, horizontalPadding, verticalPadHeader, cardGap, cardWidth, titleFontSize, subtitleFontSize, statNumberFont, statIconBox, addBtnSize } = useMemo(() => computeRouteLayout(width), [width]);
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showRouteDetail, setShowRouteDetail] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    await loadRoutes(today);
    setRefreshing(false);
  };

  // Cargar rutas al montar la pantalla
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    void loadRoutes(today);
  }, [loadRoutes]);

  const handleRoutePress = (route: any) => {
    // Guardar la ruta seleccionada en el store para que startTrip funcione
    selectRoute(route);
    setSelectedRoute(route);
    setShowRouteDetail(true);
  };

  const handleStartTrip = () => {
    // En web el TripModal requiere selectedTrip; abrimos el detalle de la primera ruta para seleccionar parada
    const firstRoute = routes[0];
    if (firstRoute) {
      selectRoute(firstRoute);
      setSelectedRoute(firstRoute);
      setShowRouteDetail(true);
    }
  };

  const { activeRoutes, completedRoutes, pendingRoutes } = useMemo(() => ({
    activeRoutes: routes.filter(route => route.status === 'in_progress'),
    completedRoutes: routes.filter(route => route.status === 'completed'),
    pendingRoutes: routes.filter(route => route.status === 'planned'),
  }), [routes]);

  // Abrir TripModal automáticamente cuando se selecciona un trip desde el store
  useEffect(() => {
    if (selectedTrip) {
      setShowTripModal(true);
      // Opcional: cerrar el detalle de ruta para evitar modales superpuestos
      setShowRouteDetail(false);
    }
  }, [selectedTrip]);

  return (
    <AccessGuard allowed={canRoutes}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
            paddingHorizontal: horizontalPadding,
            paddingVertical: verticalPadHeader,
          },
        ]}
      >
        <View style={styles.headerTitle}>
          <MapPin size={isSmall ? 22 : 26} color={colors.primary} />
          <View>
            <Text style={[styles.title, { color: colors.text, fontSize: titleFontSize }]}>Rutas</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: subtitleFontSize }]}>Gestión de rutas y viajes</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: colors.primary,
              width: addBtnSize,
              height: addBtnSize,
              borderRadius: addBtnSize / 2,
            },
          ]}
          onPress={handleStartTrip}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles.statsContainer, { paddingHorizontal: horizontalPadding, gap: cardGap, flexWrap: 'wrap' }]}>
        <View style={[styles.statCard, { backgroundColor: colors.surface, width: cardWidth }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.primary}20`, width: statIconBox, height: statIconBox, borderRadius: statIconBox / 2 }]}>
            <Truck size={isSmall ? 18 : 20} color={colors.primary} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text, fontSize: statNumberFont }]}>{activeRoutes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activas</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, width: cardWidth }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.success}20`, width: statIconBox, height: statIconBox, borderRadius: statIconBox / 2 }]}>
            <MapPin size={isSmall ? 18 : 20} color={colors.success} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text, fontSize: statNumberFont }]}>{completedRoutes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface, width: cardWidth }]}>
          <View style={[styles.statIcon, { backgroundColor: `${colors.warning}20`, width: statIconBox, height: statIconBox, borderRadius: statIconBox / 2 }]}>
            <Clock size={isSmall ? 18 : 20} color={colors.warning} />
          </View>
          <Text style={[styles.statNumber, { color: colors.text, fontSize: statNumberFont }]}>{pendingRoutes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
        </View>
      </View>

      {/* Routes List */}
      <ScrollView
        style={[styles.content, { paddingHorizontal: horizontalPadding }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {routes.length > 0 ? (
          routes.map((route) => (
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
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No hay rutas disponibles
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Las rutas aparecerán aquí cuando estén disponibles
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {showRouteDetail && selectedRoute && (
        <RouteDetailModal
          visible={showRouteDetail}
          route={selectedRoute}
          onClose={() => {
            setShowRouteDetail(false);
            setSelectedRoute(null);
          }}
        />
      )}

      {/* Trip modal requiere un trip desde el store (selectedTrip) */}
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
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});