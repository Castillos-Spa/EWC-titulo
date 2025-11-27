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
import { TriangleAlert as AlertTriangle, Plus, Filter, RefreshCw, FileText } from 'lucide-react-native';
import { useIncidentStore } from '@/stores/incidentStore';
import { useThemeStore } from '@/stores/themeStore';
import { IncidentCard } from '@/components/IncidentCard';
import { CreateIncidentModal } from '@/components/CreateIncidentModal';
import { IncidentDetailModal } from '@/components/IncidentDetailModal';
 

export default function IncidentsScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const {
    incidents,
    currentIncident,
    error,
    loadIncidents,
    setCurrentIncident,
    clearError,
  } = useIncidentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadIncidents();
    setRefreshing(false);
  };

  const handleIncidentPress = (incident: any) => {
    setCurrentIncident(incident);
    setShowDetailModal(true);
  };

  const handleCreateIncident = () => {
    setShowCreateModal(true);
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filterStatus === 'all') return true;
    return incident.status === filterStatus;
  });

  const getIncidentStats = () => {
    const total = incidents.length;
    const pending = incidents.filter(i => i.status === 'reported').length;
    const inProgress = incidents.filter(i => i.status === 'in_progress').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    
    return { total, pending, inProgress, resolved };
  };

  const stats = getIncidentStats();

  const colors = getColors();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <AlertTriangle size={64} color="#DC2626" />
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
            <AlertTriangle size={28} color={colors.error} />
            <Text style={[styles.title, { color: colors.text }]}>Incidentes</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={handleCreateIncident}>
              <Plus size={24} color="#FFFFFF" />
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
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.pending}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Progreso</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.resolved}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resueltos</Text>
          </View>
        </View>

        {/* Filter */}
        <View style={styles.filterSection}>
          <Filter size={20} color="#64748B" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { value: 'all', label: 'Todos' },
                { value: 'reported', label: 'Reportados' },
                { value: 'acknowledged', label: 'Reconocidos' },
                { value: 'in_progress', label: 'En Progreso' },
                { value: 'resolved', label: 'Resueltos' },
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

      {/* Incidents List */}
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
        {filteredIncidents.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' ? 'No hay incidentes' : 'No hay incidentes con este filtro'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' 
                ? 'Los incidentes reportados aparecerán aquí'
                : 'Cambia el filtro para ver otros incidentes'
              }
            </Text>
            {filterStatus === 'all' && (
              <TouchableOpacity style={[styles.emptyButton, { backgroundColor: colors.error }]} onPress={handleCreateIncident}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>Reportar Incidente</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onPress={() => handleIncidentPress(incident)}
            />
          ))
        )}
      </ScrollView>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Incident Detail Modal */}
      {currentIncident && (
        <IncidentDetailModal
          incident={currentIncident}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentIncident(null);
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
  createButton: {
    backgroundColor: '#DC2626',
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
    backgroundColor: '#2563EB',
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
    backgroundColor: '#DC2626',
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