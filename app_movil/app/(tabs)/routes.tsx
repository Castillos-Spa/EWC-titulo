import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MapPin, Clock, Truck, Plus } from 'lucide-react-native';
import { useRouteStore } from '../stores/routeStore';
import { useThemeStore } from '../stores/themeStore';
import { RouteCard } from '../components/RouteCard';
import RouteDetailModal from '../components/RouteDetailModal';
import TripModal from '../components/TripModal';

export default function RoutesScreen() {
  const { routes, loadRoutes, selectedTrip } = useRouteStore();
  const { getColors } = useThemeStore();
  const colors = getColors();
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteDetail, setShowRouteDetail] = useState(false);
  const [showTripModal, setShowTripModal] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    const today = new Date().toISOString().split('T')[0];
    await loadRoutes(today);
    setRefreshing(false);
  };

  const handleRoutePress = (route: any) => {
    setSelectedRoute(route);
    setShowRouteDetail(true);
  };

  const handleStartTrip = () => {
    setShowTripModal(true);
  };

  const activeRoutes = routes.filter(route => route.status === 'in_progress');
  const completedRoutes = routes.filter(route => route.status === 'completed');
  const pendingRoutes = routes.filter(route => route.status === 'planned');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>Rutas</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Gestión de rutas y viajes
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleStartTrip}
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: '#3B82F620' }]}>
            <Truck size={20} color="#3B82F6" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{activeRoutes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Activas</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: '#10B98120' }]}>
            <MapPin size={20} color="#10B981" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{completedRoutes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.statIcon, { backgroundColor: '#F59E0B20' }]}>
            <Clock size={20} color="#F59E0B" />
          </View>
          <Text style={[styles.statNumber, { color: colors.text }]}>{pendingRoutes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
        </View>
      </View>

      {/* Routes List */}
      <ScrollView
        style={styles.content}
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
    </View>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
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