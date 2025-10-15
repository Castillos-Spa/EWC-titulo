import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { HardHat, Filter, RefreshCw, FileText, TriangleAlert as AlertTriangle, Shield } from 'lucide-react-native';
import { useCivilWorksStore } from '../stores/civilWorksStore';
import { useThemeStore } from '../stores/themeStore';
import { WorkOrderCard } from '../components/WorkOrderCard';
import { WorkOrderDetailModal } from '../components/WorkOrderDetailModal';
import { SafetyChecklistModal } from '../components/SafetyChecklistModal';
import { AccessGuard } from '../components/AccessGuard';
import { useAuthz } from '@/hooks/useAuthz';

export default function CivilWorksScreen() {
  const { canCivilWorks } = useAuthz();
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const {
    workOrders,
    currentWorkOrder,
    error,
    loadWorkOrders,
    fetchAndSetCurrentWorkOrder,
    loadMoreWorkOrders,
    setCurrentWorkOrder,
    clearError,
    isLoadingMore,
    total,
  } = useCivilWorksStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWorkOrders();
    setRefreshing(false);
  };

  const handleWorkOrderPress = async (workOrder: any) => {
    await fetchAndSetCurrentWorkOrder(String(workOrder.id));
    setShowDetailModal(true);
  };

  const filteredWorkOrders = workOrders.filter(order => {
    if (filterStatus !== 'all' && order.status !== filterStatus) return false;
    if (filterPriority !== 'all' && order.priority !== filterPriority) return false;
    if (search.trim().length > 0) {
      const q = search.toLowerCase();
      const staff = (order.assignedTo || []).join(', ').toLowerCase();
      if (!order.title.toLowerCase().includes(q)
        && !(order.location?.address || '').toLowerCase().includes(q)
        && !staff.includes(q)) return false;
    }
    return true;
  });

  const getWorkOrderStats = () => {
    const total = workOrders.length;
    const assigned = workOrders.filter(w => w.status === 'assigned').length;
    const inProgress = workOrders.filter(w => w.status === 'in_progress').length;
    const completed = workOrders.filter(w => w.status === 'completed').length;
    
    return { total, assigned, inProgress, completed };
  };

  const stats = getWorkOrderStats();

  const colors = getColors();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <HardHat size={64} color="#DC2626" />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AccessGuard allowed={canCivilWorks}>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitle}>
            <HardHat size={28} color={colors.warning || '#F59E0B'} />
            <Text style={[styles.title, { color: colors.text }]}>Obras Civiles</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.safetyButton, { backgroundColor: colors.primary }]} 
              onPress={() => setShowSafetyModal(true)}
            >
              <Shield size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.assigned}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Asignadas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Progreso</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completadas</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <View style={styles.filterGroup}>
            <Filter size={16} color="#64748B" />
            <Text style={styles.filterLabel}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'assigned', label: 'Asignadas' },
                  { value: 'in_progress', label: 'En Progreso' },
                  { value: 'on_hold', label: 'En Espera' },
                  { value: 'completed', label: 'Completadas' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.filterButton,
                      filterStatus === filter.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterStatus(filter.value)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filterStatus === filter.value && styles.filterButtonTextActive,
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <AlertTriangle size={16} color="#64748B" />
            <Text style={styles.filterLabel}>Prioridad:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'urgent', label: 'Urgente' },
                  { value: 'high', label: 'Alta' },
                  { value: 'medium', label: 'Media' },
                  { value: 'low', label: 'Baja' },
                ].map((filter) => (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.filterButton,
                      filterPriority === filter.value && styles.filterButtonActive,
                    ]}
                    onPress={() => setFilterPriority(filter.value)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      filterPriority === filter.value && styles.filterButtonTextActive,
                    ]}>
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Search */}
          <View style={styles.searchGroup}>
            <TextInput
              placeholder="Buscar por proyecto, ubicación o personal..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
            />
            <Text style={[styles.searchMeta, { color: colors.textSecondary }]}>
              {filteredWorkOrders.length} de {total} resultados
            </Text>
          </View>
        </View>
      </View>

      {/* Work Orders List + Pagination */}
      <FlatList
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        data={filteredWorkOrders}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <WorkOrderCard workOrder={item} onPress={() => { void handleWorkOrderPress(item); }} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => { void loadMoreWorkOrders(filterStatus !== 'all' ? filterStatus : undefined); }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FileText size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' ? 'No hay órdenes de trabajo' : 'No hay órdenes con este filtro'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all'
                ? 'Las órdenes de trabajo aparecerán aquí'
                : 'Cambia el filtro para ver otras órdenes'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ textAlign: 'center', color: colors.textSecondary }}>Cargando más...</Text>
            </View>
          ) : null
        }
      />

      {/* Work Order Detail Modal */}
      {currentWorkOrder && (
        <WorkOrderDetailModal
          workOrder={currentWorkOrder}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentWorkOrder(null);
          }}
        />
      )}

      {/* Safety Checklist Modal */}
      <SafetyChecklistModal
        visible={showSafetyModal}
        onClose={() => setShowSafetyModal(false)}
      />
    </SafeAreaView>
    </AccessGuard>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 22,
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
  safetyButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
  filtersSection: {
    gap: 12,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    minWidth: 60,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#F59E0B',
  },
  filterButtonText: {
    fontSize: 12,
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
  },
  searchGroup: {
    marginTop: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  searchMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748B',
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