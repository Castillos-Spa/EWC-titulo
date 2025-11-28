import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle,
  ClipboardCheck,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Truck,
  Wrench,
} from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { useFleetStore } from '@/stores/fleetStore';
import { FleetVehicleCard } from '@/components/FleetVehicleCard';
import { VehicleDetailModal } from '@/components/VehicleDetailModal';
import { CreateVehicleModal } from '@/components/CreateVehicleModal';
import { AccessGuard } from '@/components/AccessGuard';
import { useAuthz } from '@/hooks/useAuthz';

type StatusFilter = 'all' | 'disponible' | 'en_mantenimiento' | 'inactivo' | 'en_uso';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'disponible', label: 'Disponibles' },
  { value: 'en_uso', label: 'En uso' },
  { value: 'en_mantenimiento', label: 'Mantención' },
  { value: 'inactivo', label: 'Inactivos' },
];

const MAINTENANCE_INTERVAL_DAYS = 180;
const MS_IN_DAY = 1000 * 60 * 60 * 24;

function daysSince(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date).getTime();
  if (Number.isNaN(parsed)) return null;
  return Math.floor((Date.now() - parsed) / MS_IN_DAY);
}

export default function FleetScreen() {
  const { canFuel } = useAuthz();
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { vehicles, isLoading, error, loadVehicles, setCurrentVehicle, clearError, currentVehicle } = useFleetStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadVehicles();
    } finally {
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const total = vehicles.length;
    const available = vehicles.filter((v) => v.estado === 'disponible').length;
    const inUse = vehicles.filter((v) => v.estado === 'en_uso').length;
    const maintenance = vehicles.filter((v) => v.estado === 'en_mantenimiento').length;
    const inactive = vehicles.filter((v) => v.estado === 'inactivo').length;
    const maintenanceDue = vehicles.filter((v) => {
      const days = daysSince(v.lastMaintenanceDate);
      return days !== null && days >= MAINTENANCE_INTERVAL_DAYS;
    }).length;
    const avgOdometer = total
      ? Math.round(vehicles.reduce((sum, v) => sum + (v.odometro ?? 0), 0) / total)
      : 0;
    return { total, available, inUse, maintenance, inactive, maintenanceDue, avgOdometer };
  }, [vehicles]);

  const maintenanceAlerts = useMemo(() => {
    return vehicles
      .filter((v) => {
        const since = daysSince(v.lastMaintenanceDate);
        return since !== null && since >= MAINTENANCE_INTERVAL_DAYS;
      })
      .sort((a, b) => (daysSince(b.lastMaintenanceDate) ?? 0) - (daysSince(a.lastMaintenanceDate) ?? 0))
      .slice(0, 3);
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (statusFilter !== 'all' && vehicle.estado !== statusFilter) {
        return false;
      }
      if (!term) return true;
      const haystack = [vehicle.patente, vehicle.marca ?? '', vehicle.modelo ?? '', vehicle.areaAsignada ?? '']
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [vehicles, statusFilter, searchTerm]);

  const hasActiveFilters = statusFilter !== 'all' || searchTerm.trim().length > 0;

  let listContent: React.ReactNode;
  if (isLoading && vehicles.length === 0) {
    listContent = (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Sincronizando flota…</Text>
      </View>
    );
  } else if (filteredVehicles.length === 0) {
    listContent = (
      <View style={styles.emptyState}>
        <Truck size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No encontramos vehículos</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Ajusta los filtros o registra un nuevo vehículo.</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Agregar vehículo</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    listContent = filteredVehicles.map((vehicle) => (
      <FleetVehicleCard key={vehicle.id} vehicle={vehicle} onPress={() => setCurrentVehicle(vehicle)} />
    ));
  }

  return (
    <AccessGuard allowed={canFuel}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient colors={[colors.primary + '22', '#00000000']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.heroGradient} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: insets.bottom + 140 }}
          refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={handleRefresh} />}
        >
          <View style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
            <View style={[styles.heroBadge, { borderColor: colors.border, backgroundColor: colors.surface + 'AA' }]}>
              <Shield size={14} color={colors.primary} />
              <Text style={[styles.heroBadgeText, { color: colors.primary }]}>Operaciones de flota</Text>
            </View>
            <View style={styles.heroHeaderRow}>
              <View style={[styles.heroIconBox, { backgroundColor: colors.primary + '18' }]}>
                <Truck size={28} color={colors.primary} />
              </View>
              <View style={styles.heroTextColumn}>
                <Text style={[styles.heroTitle, { color: colors.text }]}>Registro de flota</Text>
                <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Monitorea disponibilidad, mantenciones y documentación en una sola vista.</Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]} onPress={handleRefresh}>
                  <RefreshCw size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
                  <Plus size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statsGrid}>
              <View style={styles.statBlock}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Disponibles</Text>
                <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.available}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En uso</Text>
                <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.inUse}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mantención</Text>
                <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.maintenance}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Inactivos</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.inactive}</Text>
              </View>
              <View style={styles.statBlock}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Odómetro prom.</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.avgOdometer.toLocaleString('es-CL')} km</Text>
              </View>
            </View>

            <View style={styles.filterToggleRow}>
              <TouchableOpacity
                style={[styles.filterToggleButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                onPress={() => setShowFilters((prev) => !prev)}
              >
                <Filter size={16} color={colors.primary} />
                <Text style={[styles.filterToggleText, { color: colors.text }]}>{showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}</Text>
              </TouchableOpacity>
              {stats.maintenanceDue > 0 ? (
                <View style={[styles.alertBadge, { backgroundColor: colors.error + '18' }]}> 
                  <AlertTriangle size={14} color={colors.error} />
                  <Text style={[styles.alertBadgeText, { color: colors.error }]}>{stats.maintenanceDue} mantenciones vencidas</Text>
                </View>
              ) : null}
            </View>

            {showFilters ? (
              <View style={styles.filterArea}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.filterRow}>
                    {STATUS_FILTERS.map((filter) => {
                      const active = filter.value === statusFilter;
                      return (
                        <TouchableOpacity
                          key={filter.value}
                          style={[
                            styles.filterChip,
                            { borderColor: colors.border },
                            active && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                          onPress={() => setStatusFilter(filter.value)}
                        >
                          <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
                <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background }]}
                >
                  <Search size={16} color={colors.textSecondary} />
                  <TextInput
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                    placeholder="Buscar por patente, marca o área"
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.text }]}
                    autoCorrect={false}
                  />
                  {hasActiveFilters ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                      }}
                    >
                      <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Limpiar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          {maintenanceAlerts.length > 0 ? (
            <View style={[styles.alertCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.alertHeader}>
                <View style={[styles.alertIcon, { backgroundColor: colors.error + '15' }]}>
                  <Wrench size={20} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertTitle, { color: colors.text }]}>Mantenciones pendientes</Text>
                  <Text style={[styles.alertSubtitle, { color: colors.textSecondary }]}>Últimos vehículos que superaron los {MAINTENANCE_INTERVAL_DAYS} días.</Text>
                </View>
              </View>
              {maintenanceAlerts.map((vehicle) => (
                <View key={vehicle.id} style={[styles.alertItem, { borderColor: colors.border }]}>
                  <Text style={[styles.alertVehicle, { color: colors.text }]}>{vehicle.patente}</Text>
                  <Text style={[styles.alertMeta, { color: colors.textSecondary }]}>
                    Último servicio: {vehicle.lastMaintenanceDate ? new Date(vehicle.lastMaintenanceDate).toLocaleDateString('es-CL') : 'Sin registro'}
                  </Text>
                  <TouchableOpacity onPress={() => setCurrentVehicle(vehicle)} style={[styles.alertAction, { backgroundColor: colors.primary + '15' }]}>
                    <ClipboardCheck size={14} color={colors.primary} />
                    <Text style={[styles.alertActionText, { color: colors.primary }]}>Revisar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {error ? (
            <View style={[styles.errorBanner, { borderColor: colors.error + '40', backgroundColor: colors.error + '15' }]}>
              <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Text style={[styles.errorBannerLink, { color: colors.error }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.listSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Inventario vehicular</Text>
            {listContent}
          </View>
        </ScrollView>

        <CreateVehicleModal visible={showCreate} onClose={() => setShowCreate(false)} />
        <VehicleDetailModal vehicle={currentVehicle} visible={!!currentVehicle} onClose={() => setCurrentVehicle(null)} />
      </SafeAreaView>
    </AccessGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  heroSection: { paddingHorizontal: 20, gap: 12 },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconBox: { padding: 14, borderRadius: 16 },
  heroTextColumn: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 24, fontWeight: '700' },
  heroSubtitle: { fontSize: 13 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 10, borderRadius: 10 },
  primaryButton: { borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', marginLeft: 8 },
  summaryCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 20, padding: 16, borderWidth: 1, gap: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBlock: { flexBasis: '30%' },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  filterToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterToggleButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  filterToggleText: { fontWeight: '600' },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  alertBadgeText: { fontSize: 12, fontWeight: '600' },
  filterArea: { gap: 12 },
  filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  filterChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  searchBox: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  clearFiltersText: { fontSize: 13, fontWeight: '600' },
  alertCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  alertIcon: { padding: 10, borderRadius: 12 },
  alertTitle: { fontSize: 16, fontWeight: '700' },
  alertSubtitle: { fontSize: 13 },
  alertItem: { borderTopWidth: 1, paddingTop: 12, marginTop: 12, gap: 6 },
  alertVehicle: { fontSize: 15, fontWeight: '600' },
  alertMeta: { fontSize: 12 },
  alertAction: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  alertActionText: { fontSize: 12, fontWeight: '600' },
  errorBanner: { marginHorizontal: 20, marginTop: 16, borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorBannerText: { fontSize: 13, fontWeight: '600' },
  errorBannerLink: { fontWeight: '700' },
  listSection: { marginHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  loadingText: { fontSize: 13 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
});
