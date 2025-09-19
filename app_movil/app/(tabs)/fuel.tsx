import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fuel, Filter, RefreshCw, TrendingUp, TrendingDown, ChartBar as BarChart3, Calendar } from 'lucide-react-native';
import { useFuelStore } from '../stores/fuelStore';
import { useThemeStore } from '../stores/themeStore';
import { FuelCard } from '../components/FuelCard';
import { CreateFuelRecordModal } from '../components/CreateFuelRecordModal';
import { FuelDetailModal } from '../components/FuelDetailModal';
import { FuelAnalytics } from '../components/FuelAnalytics';

export default function FuelScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const {
    records,
    analytics,
    currentRecord,
    error,
    loadFuelRecords,
    setCurrentRecord,
    clearError,
  } = useFuelStore();


  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createModalType, setCreateModalType] = useState<'consumption' | 'refuel'>('consumption');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  // Mock vehicle data - in real app this would come from user/route context
  const currentVehicle = {
    id: 'truck-001',
    plate: 'ABC-123',
  };

  useEffect(() => {
    loadFuelRecords(currentVehicle.id, getDateRange(selectedPeriod));
  }, [selectedPeriod, currentVehicle.id, loadFuelRecords]);

  const getDateRange = (period: string) => {
    const now = new Date();
    const start = new Date();
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      default:
        return undefined;
    }
    
    return {
      start: start.toISOString(),
      end: now.toISOString(),
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFuelRecords(currentVehicle.id, getDateRange(selectedPeriod));
    setRefreshing(false);
  };

  const handleRecordPress = (record: any) => {
    setCurrentRecord(record);
    setShowDetailModal(true);
  };

  const handleCreateRecord = (type: 'consumption' | 'refuel') => {
    setCreateModalType(type);
    setShowCreateModal(true);
  };

  const filteredRecords = records.filter(record => {
    if (filterType === 'all') return true;
    return record.type === filterType;
  });

  const getRecordStats = () => {
    const total = records.length;
    const consumption = records.filter(r => r.type === 'consumption').length;
    const refuels = records.filter(r => r.type === 'refuel').length;
    
    return { total, consumption, refuels };
  };

  const stats = getRecordStats();

  const colors = getColors();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Fuel size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <Fuel size={28} color={colors.success} />
            <Text style={[styles.title, { color: colors.text }]}>Combustible</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={[styles.refreshButton, { backgroundColor: colors.card }]} onPress={() => handleRefresh()}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.primary }]}
            onPress={() => handleCreateRecord('consumption')}
          >
            <TrendingDown size={20} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Consumo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: colors.card, borderWidth: 2, borderColor: colors.success }]}
            onPress={() => handleCreateRecord('refuel')}
          >
            <TrendingUp size={20} color={colors.success} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>Reabastecimiento</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Calendar size={20} color={colors.textSecondary} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.periodRow}>
              {[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' },
                { value: 'all', label: 'Todo' },
              ].map((period) => (
                <TouchableOpacity
                  key={period.value}
                  style={[
                    styles.periodButton,
                    { backgroundColor: colors.card },
                    selectedPeriod === period.value && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setSelectedPeriod(period.value)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    { color: colors.textSecondary },
                    selectedPeriod === period.value && { color: '#FFFFFF' },
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{stats.consumption}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Consumos</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.success }]}>{stats.refuels}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reabastecimientos</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterSection}>
          <Filter size={20} color={colors.textSecondary} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'consumption', label: 'Consumos' },
                { value: 'refuel', label: 'Reabastecimientos' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,
                    { backgroundColor: colors.card },
                    filterType === filter.value && { backgroundColor: colors.success },
                  ]}
                  onPress={() => setFilterType(filter.value)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    { color: colors.textSecondary },
                    filterType === filter.value && { color: '#FFFFFF' },
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 } // Extra space for tab bar
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Analytics */}
        <FuelAnalytics analytics={analytics} />

        {/* Records List */}
        {filteredRecords.length === 0 ? (
          <View style={styles.emptyState}>
            <BarChart3 size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filterType === 'all' ? 'No hay registros' : 'No hay registros con este filtro'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filterType === 'all' 
                ? 'Los registros de combustible aparecerán aquí'
                : 'Cambia el filtro para ver otros registros'
              }
            </Text>
            {filterType === 'all' && (
              <View style={styles.emptyActions}>
                <TouchableOpacity 
                  style={[styles.emptyButton, { backgroundColor: colors.primary }]} 
                  onPress={() => handleCreateRecord('consumption')}
                >
                  <TrendingDown size={20} color="#FFFFFF" />
                  <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Registrar Consumo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.emptyButton, { backgroundColor: colors.success }]} 
                  onPress={() => handleCreateRecord('refuel')}
                >
                  <TrendingUp size={20} color="#FFFFFF" />
                  <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Registrar Reabastecimiento</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          filteredRecords.map((record) => (
            <FuelCard
              key={record.id}
              record={record}
              onPress={() => handleRecordPress(record)}
            />
          ))
        )}
      </ScrollView>

      {/* Create Record Modal */}
      <CreateFuelRecordModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        initialType={createModalType}
        vehicleId={currentVehicle.id}
        vehiclePlate={currentVehicle.plate}
      />

      {/* Record Detail Modal */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  quickActionButton: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 56,
  },
  consumptionButton: {
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  refuelButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    flexShrink: 1,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#2563EB',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    minWidth: 60,
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#16A34A',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyActions: {
    gap: 12,
    width: '100%',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
  },
  emptyButtonSecondary: {
    backgroundColor: '#16A34A',
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 26,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 56,
    justifyContent: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});