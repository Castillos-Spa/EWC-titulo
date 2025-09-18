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
import { Sparkles as Cleaning, Plus, Filter, RefreshCw, Calendar, FileText, Package } from 'lucide-react-native';
import { useCleaningStore } from '../stores/cleaningStore';
import { useThemeStore } from '../stores/themeStore';
import { CleaningReportCard } from '../components/CleaningReportCard';
import { CreateCleaningReportModal } from '../components/CreateCleaningReportModal';
import { CleaningDetailModal } from '../components/CleaningDetailModal';
import { SupplyRequestModal } from '../components/SupplyRequestModal';

export default function CleaningScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const {
    reports,
    currentReport,
    error,
    loadCleaningReports,
    setCurrentReport,
    clearError,
  } = useCleaningStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('today');

  useEffect(() => {
    loadCleaningReports(getDateRange(selectedPeriod));
  }, [selectedPeriod, loadCleaningReports]);

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
    await loadCleaningReports(getDateRange(selectedPeriod));
    setRefreshing(false);
  };

  const handleReportPress = (report: any) => {
    setCurrentReport(report);
    setShowDetailModal(true);
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus === 'all') return true;
    return report.status === filterStatus;
  });

  const getReportStats = () => {
    const total = reports.length;
    const completed = reports.filter(r => r.status === 'completed').length;
    const inProgress = reports.filter(r => r.status === 'in_progress').length;
    const pending = reports.filter(r => r.status === 'pending').length;
    
    return { total, completed, inProgress, pending };
  };

  const stats = getReportStats();

  const colors = getColors();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Cleaning size={64} color="#DC2626" />
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
            <Cleaning size={28} color="#06B6D4" />
            <Text style={[styles.title, { color: colors.text }]}>Aseo y Limpieza</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <RefreshCw size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={[styles.quickActionButton, styles.reportButton]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#06B6D4" />
            <Text style={styles.quickActionText}>Parte Diario</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.quickActionButton, styles.supplyButton]}
            onPress={() => setShowSupplyModal(true)}
          >
            <Package size={20} color="#16A34A" />
            <Text style={styles.quickActionText}>Solicitar Insumos</Text>
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Calendar size={20} color="#64748B" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.periodRow}>
              {[
                { value: 'today', label: 'Hoy' },
                { value: 'week', label: 'Semana' },
                { value: 'month', label: 'Mes' },
              ].map((period) => (
                <TouchableOpacity
                  key={period.value}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.value && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.value)}
                >
                  <Text style={[
                    styles.periodButtonText,
                    selectedPeriod === period.value && styles.periodButtonTextActive,
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#06B6D4' }]}>{stats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Progreso</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completados</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterSection}>
          <Filter size={20} color="#64748B" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'completed', label: 'Completados' },
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
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + 100 }
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredReports.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' ? 'No hay reportes' : 'No hay reportes con este filtro'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' 
                ? 'Los partes diarios aparecerán aquí'
                : 'Cambia el filtro para ver otros reportes'
              }
            </Text>
            {filterStatus === 'all' && (
              <TouchableOpacity 
                style={[styles.emptyButton, { backgroundColor: colors.primary }]} 
                onPress={() => setShowCreateModal(true)}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Crear Parte Diario</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredReports.map((report) => (
            <CleaningReportCard
              key={report.id}
              report={report}
              onPress={() => handleReportPress(report)}
            />
          ))
        )}
      </ScrollView>

      {/* Create Report Modal */}
      <CreateCleaningReportModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Report Detail Modal */}
      {currentReport && (
        <CleaningDetailModal
          report={currentReport}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentReport(null);
          }}
        />
      )}

      {/* Supply Request Modal */}
      <SupplyRequestModal
        visible={showSupplyModal}
        onClose={() => setShowSupplyModal(false)}
      />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 56,
  },
  reportButton: {
    backgroundColor: '#F0F9FF',
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  supplyButton: {
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
    backgroundColor: '#06B6D4',
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
    backgroundColor: '#06B6D4',
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
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#06B6D4',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 56,
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