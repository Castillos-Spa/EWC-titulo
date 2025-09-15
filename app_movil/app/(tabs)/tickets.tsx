import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ticket, Plus, Filter, RefreshCw, Calendar, CircleCheck as CheckCircle, Clock, TriangleAlert as AlertTriangle, FileText } from 'lucide-react-native';
import { useTicketStore } from '../stores/ticketStore';
import { useThemeStore } from '../stores/themeStore';
import { TicketCard } from '../components/TicketCard';
import { TicketDetailModal } from '../components/TicketDetailModal';

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const {
    tickets,
    currentTicket,
    isLoading,
    error,
    loadTickets,
    setCurrentTicket,
    clearError,
  } = useTicketStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');

  useEffect(() => {
    loadTickets(filterStatus === 'all' ? undefined : filterStatus, getDateRange(selectedPeriod));
  }, [filterStatus, selectedPeriod]);

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
    await loadTickets(filterStatus === 'all' ? undefined : filterStatus, getDateRange(selectedPeriod));
    setRefreshing(false);
  };

  const handleTicketPress = (ticket: any) => {
    setCurrentTicket(ticket);
    setShowDetailModal(true);
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  const getTicketStats = () => {
    const total = tickets.length;
    const assigned = tickets.filter(t => t.status === 'assigned').length;
    const inProgress = tickets.filter(t => t.status === 'in_progress').length;
    const completed = tickets.filter(t => t.status === 'completed').length;
    const onHold = tickets.filter(t => t.status === 'on_hold').length;
    
    return { total, assigned, inProgress, completed, onHold };
  };

  const stats = getTicketStats();

  const colors = getColors();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Ticket size={64} color="#DC2626" />
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
            <Ticket size={28} color="#7C3AED" />
            <Text style={[styles.title, { color: colors.text }]}>Tickets</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <RefreshCw size={24} color="#2563EB" />
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
                { value: 'all', label: 'Todo' },
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
            <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.assigned}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Asignados</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Progreso</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completados</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          {/* Status Filter */}
          <View style={styles.filterGroup}>
            <Filter size={16} color="#64748B" />
            <Text style={styles.filterLabel}>Estado:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterRow}>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'assigned', label: 'Asignados' },
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

          {/* Priority Filter */}
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
        </View>
      </View>

      {/* Tickets List */}
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
        {filteredTickets.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' ? 'No hay tickets' : 'No hay tickets con este filtro'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {filterStatus === 'all' 
                ? 'Los tickets asignados aparecerán aquí'
                : 'Cambia el filtro para ver otros tickets'
              }
            </Text>
          </View>
        ) : (
          filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onPress={() => handleTicketPress(ticket)}
            />
          ))
        )}
      </ScrollView>

      {/* Ticket Detail Modal */}
      {currentTicket && (
        <TicketDetailModal
          ticket={currentTicket}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentTicket(null);
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
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#7C3AED',
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
    backgroundColor: '#7C3AED',
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