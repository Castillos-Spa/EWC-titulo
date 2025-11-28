import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Fuel,
  RefreshCw,
  Plus,
  Filter,
  Calendar as CalendarDays,
  Droplet,
  ChartBar as BarChart3,
} from 'lucide-react-native';
import { AccessGuard } from '@/components/AccessGuard';
import { FuelCard } from '@/components/FuelCard';
import { FuelAnalytics } from '@/components/FuelAnalytics';
import { CreateFuelRecordModal } from '@/components/CreateFuelRecordModal';
import { FuelDetailModal } from '@/components/FuelDetailModal';
import { useFuelStore } from '@/stores/fuelStore';
import { useThemeStore } from '@/stores/themeStore';
import { useFleetStore } from '@/stores/fleetStore';
import { useRouter } from 'expo-router';
import { useAuthz } from '@/hooks/useAuthz';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: '7 días' },
  { value: 'month', label: '30 días' },
  { value: 'all', label: 'Todo' },
] as const;

const FILTER_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'refuel', label: 'Recargas' },
  { value: 'consumption', label: 'Consumos' },
] as const;

export default function FuelScreen() {
  const { canFuel } = useAuthz();
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const { currentVehicle } = useFleetStore();
  const router = useRouter();
  const {
    vehicleRecords,
    analytics,
    currentRecord,
    error,
    loadVehicleHistory,
    setCurrentRecord,
    clearError,
  } = useFuelStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (currentVehicle?.id) {
      loadVehicleHistory(currentVehicle.id);
    }
  }, [currentVehicle?.id, loadVehicleHistory]);

  const periodRange = useMemo(() => {
    if (selectedPeriod === 'all') return undefined;
    const now = new Date();
    const start = new Date();
    if (selectedPeriod === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (selectedPeriod === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (selectedPeriod === 'month') {
      start.setMonth(now.getMonth() - 1);
    }
    return { start: start.toISOString(), end: now.toISOString() };
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    setRefreshing(true);
    if (currentVehicle?.id) {
      await loadVehicleHistory(currentVehicle.id);
    }
    setRefreshing(false);
  };

  const records = vehicleRecords ?? [];
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (periodRange) {
        const ts = new Date(record.date).getTime();
        const start = new Date(periodRange.start).getTime();
        const end = new Date(periodRange.end).getTime();
        if (Number.isFinite(ts) && (ts < start || ts > end)) {
          return false;
        }
      }
      if (filterType === 'all') return true;
      return ((record as any).type ?? 'refuel') === filterType;
    });
  }, [records, periodRange, filterType]);

  const stats = useMemo(() => {
    const detectType = (record: typeof records[number]) => (record as any).type ?? 'refuel';
    const total = records.length;
    const refuels = records.filter((r) => detectType(r) === 'refuel').length;
    const consumptions = records.filter((r) => detectType(r) === 'consumption').length;
    return {
      total,
      refuels,
      consumptions,
      totalLiters: analytics?.totalLiters ?? 0,
      totalDistance: analytics?.totalDistance ?? 0,
      averageConsumption: analytics?.averageConsumption ?? 0,
    };
  }, [records, analytics]);

  const colors = getColors();
  const heroDescription = currentVehicle
    ? `Panel en vivo de ${currentVehicle.patente}. Sincroniza sus cargas y eficiencia en segundos.`
    : 'Selecciona un vehículo en Flota para comenzar a monitorear sus consumos.';

  const showEmptyState = !currentVehicle;
  const currentVehicleLabel = currentVehicle
    ? `${currentVehicle.patente} · ${currentVehicle.marca ?? ''} ${currentVehicle.modelo ?? ''}`.trim()
    : 'Sin vehículo seleccionado';

  const handleRecordPress = (record: any) => {
    setCurrentRecord(record);
    setShowDetailModal(true);
  };

  const handleCreateRecord = () => setShowCreateModal(true);

  return (
    <AccessGuard allowed={canFuel}>
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

        <View style={[styles.heroSection, { paddingTop: insets.top + 16 }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.surface + 'AA', borderColor: colors.border }]}>
            <Fuel size={16} color={colors.primary} />
            <Text style={[styles.heroBadgeText, { color: colors.primary }]}>Panel de combustible</Text>
          </View>

          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTitles}>
              <Text style={[styles.heroTitle, { color: colors.text }]}>Combustible</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{heroDescription}</Text>
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]} onPress={handleRefresh}>
                <RefreshCw size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: currentVehicle ? colors.primary : colors.border }]}
                disabled={!currentVehicle}
                onPress={handleCreateRecord}
              >
                <Plus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroInfoRow}>
            <Text style={[styles.heroInfoLabel, { color: colors.textSecondary }]}>Vehículo activo</Text>
            <TouchableOpacity onPress={() => router.push('/fleet')}>
              <Text style={[styles.heroInfoValue, { color: colors.primary }]}>{currentVehicleLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.controlCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.controlHeader}>
            <View style={styles.controlTitleRow}>
              <Droplet size={18} color={colors.primary} />
              <Text style={[styles.controlTitle, { color: colors.textSecondary }]}>Resumen operativo</Text>
            </View>
            <TouchableOpacity
              style={[styles.filterToggle, { backgroundColor: showFilters ? colors.primary + '15' : colors.surface, borderColor: colors.border }]}
              onPress={() => setShowFilters((prev) => !prev)}
            >
              <Filter size={16} color={showFilters ? colors.primary : colors.textSecondary} />
              <Text style={[styles.filterToggleText, { color: showFilters ? colors.primary : colors.textSecondary }]}>
                {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Registros</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.refuels}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Recargas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.consumptions}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consumos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {stats.averageConsumption > 0 ? `${stats.averageConsumption.toFixed(1)} L/100 km` : '--'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Promedio</Text>
            </View>
          </View>

          {showFilters ? (
            <>
              <View style={styles.filterBlock}>
                <View style={styles.filterTitleRow}>
                  <CalendarDays size={16} color={colors.textSecondary} />
                  <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Periodo</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {PERIOD_OPTIONS.map((option) => {
                      const active = selectedPeriod === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, active && { backgroundColor: colors.primary }]}
                          onPress={() => setSelectedPeriod(option.value)}
                        >
                          <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.filterBlock}>
                <View style={styles.filterTitleRow}>
                  <Filter size={16} color={colors.textSecondary} />
                  <Text style={[styles.filterLabel, { color: colors.textSecondary }]}>Tipo</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {FILTER_OPTIONS.map((option) => {
                      const active = filterType === option.value;
                      return (
                        <TouchableOpacity
                          key={option.value}
                          style={[styles.chip, active && { backgroundColor: colors.success }]}
                          onPress={() => setFilterType(option.value)}
                        >
                          <Text style={[styles.chipText, active && { color: '#FFFFFF' }]}>{option.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </>
          ) : null}
        </View>

        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '15', borderColor: colors.error + '40' }]}>
            <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
            <TouchableOpacity onPress={clearError}>
              <Text style={[styles.errorBannerAction, { color: colors.error }]}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 120 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {showEmptyState ? (
            <View style={[styles.emptyState, { borderColor: colors.border }]}> 
              <BarChart3 size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Selecciona un vehículo</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Abre Flota y elige un vehículo para sincronizar sus registros de combustible.</Text>
              <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/fleet')}>
                <Text style={styles.emptyButtonText}>Ir a Flota</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.analyticsWrapper}>
                <FuelAnalytics analytics={analytics} />
              </View>

              <View style={[styles.recordsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.recordsHeader}>
                  <View>
                    <Text style={[styles.recordsTitle, { color: colors.text }]}>Historial reciente</Text>
                    <Text style={[styles.recordsMeta, { color: colors.textSecondary }]}>{filteredRecords.length} registros visibles</Text>
                  </View>
                  <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]} onPress={handleCreateRecord}>
                    <Plus size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                {filteredRecords.length === 0 ? (
                  <View style={styles.recordsEmpty}>
                    <Text style={[styles.recordsEmptyTitle, { color: colors.text }]}>No encontramos registros</Text>
                    <Text style={[styles.recordsEmptySubtitle, { color: colors.textSecondary }]}>Ajusta los filtros o registra una nueva carga.</Text>
                  </View>
                ) : (
                  filteredRecords.map((record) => (
                    <FuelCard key={record.id} record={record} onPress={() => handleRecordPress(record)} />
                  ))
                )}
              </View>
            </>
          )}
        </ScrollView>

        <CreateFuelRecordModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          vehicleId={currentVehicle?.id}
          vehiclePlate={currentVehicle?.patente ?? ''}
          availableVehicles={currentVehicle ? [{ id: currentVehicle.id, plate: currentVehicle.patente }] : []}
        />

        {currentRecord && (
          <FuelDetailModal
            record={currentRecord}
            visible={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setCurrentRecord(null);
            }}
          />
        )}
      </SafeAreaView>
    </AccessGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 220 },
  halosContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  haloTop: { position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 999, opacity: 0.5 },
  haloBottom: { position: 'absolute', bottom: -80, right: -40, width: 260, height: 260, borderRadius: 999, opacity: 0.45 },
  heroSection: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  heroTitles: { flex: 1 },
  heroTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.2 },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  primaryButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroInfoLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700' },
  heroInfoValue: { fontSize: 14, fontWeight: '700' },
  controlCard: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
  controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  controlTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  controlTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 30, paddingHorizontal: 12, paddingVertical: 6 },
  filterToggleText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: 130, padding: 12, borderRadius: 16, backgroundColor: '#F8FAFC' },
  statValue: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  filterBlock: { gap: 10 },
  filterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E2E8F0' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  errorBanner: { marginHorizontal: 20, marginTop: 16, borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorBannerText: { fontWeight: '600' },
  errorBannerAction: { fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20, marginTop: 16 },
  contentContainer: { flexGrow: 1, gap: 20 },
  analyticsWrapper: { marginBottom: 20 },
  recordsCard: { borderWidth: 1, borderRadius: 20, padding: 16 },
  recordsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  recordsTitle: { fontSize: 18, fontWeight: '700' },
  recordsMeta: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },
  divider: { height: 1, marginVertical: 6 },
  recordsEmpty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  recordsEmptyTitle: { fontSize: 16, fontWeight: '700' },
  recordsEmptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyState: { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '700' },
});
