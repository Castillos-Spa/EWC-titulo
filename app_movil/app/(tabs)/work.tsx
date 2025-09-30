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
import {
  Ticket as TicketIcon,
  Kanban as KanbanIcon,
  RefreshCw,
  Filter,
  Calendar,
  TriangleAlert as AlertTriangle,
  FileText,
} from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { AccessGuard } from '../components/AccessGuard';
import { useAuthz } from '@/hooks/useAuthz';

// Tickets (lista)
import { useTicketStore } from '../stores/ticketStore';
import { TicketCard } from '../components/TicketCard';
import { TicketDetailModal } from '../components/TicketDetailModal';

// Kanban (tablero)
import { useKanbanStore } from '../stores/kanbanStore';
import { KanbanColumn } from '../components/KanbanColumn';
import { TaskDetailModal } from '../components/TaskDetailModal';

type ViewMode = 'list' | 'kanban';

// Helpers
function getDateRange(period: string) {
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
  return { start: start.toISOString(), end: now.toISOString() };
}

function ticketFilterStatusLabel(value: string) {
  switch (value) {
    case 'assigned':
      return 'Asignados';
    case 'in_progress':
      return 'En Progreso';
    case 'completed':
      return 'Completados';
    default:
      return 'Tickets';
  }
}

// Presentational subcomponents
function ErrorView({ viewMode, message, onRetry, colors }: Readonly<{ viewMode: ViewMode; message: string; onRetry: () => void; colors: any }>) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.errorContainer}>
        {viewMode === 'list' ? (
          <TicketIcon size={64} color="#DC2626" />
        ) : (
          <KanbanIcon size={64} color="#DC2626" />
        )}
        <Text style={[styles.errorText, { color: colors.error }]}>{message}</Text>
        <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={onRetry}>
          <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function ViewToggle({ mode, setMode }: Readonly<{ mode: ViewMode; setMode: (m: ViewMode) => void }>) {
  return (
    <View style={styles.toggleRow}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'list' }}
        style={[styles.toggleButton, mode === 'list' && styles.toggleButtonActive]}
        onPress={() => setMode('list')}
      >
        <TicketIcon size={18} color={mode === 'list' ? '#FFFFFF' : '#64748B'} />
        <Text style={[styles.toggleText, mode === 'list' && styles.toggleTextActive]}>Lista</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ selected: mode === 'kanban' }}
        style={[styles.toggleButton, mode === 'kanban' && styles.toggleButtonActive]}
        onPress={() => setMode('kanban')}
      >
        <KanbanIcon size={18} color={mode === 'kanban' ? '#FFFFFF' : '#64748B'} />
        <Text style={[styles.toggleText, mode === 'kanban' && styles.toggleTextActive]}>Kanban</Text>
      </TouchableOpacity>
    </View>
  );
}

function PeriodSelector({ selected, onSelect }: Readonly<{ selected: string; onSelect: (v: string) => void }>) {
  return (
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
              style={[styles.periodButton, selected === period.value && styles.periodButtonActive]}
              onPress={() => onSelect(period.value)}
            >
              <Text style={[styles.periodButtonText, selected === period.value && styles.periodButtonTextActive]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function TicketStats({ stats, colors }: Readonly<{ stats: { total: number; assigned: number; inProgress: number; completed: number; onHold: number }; colors: any }>) {
  return (
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
  );
}

function KanbanStats({ stats }: Readonly<{ stats: { total: number; pending: number; inProgress: number; completed: number } }>) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.stat}>
        <Text style={styles.statValue}>{stats.total}</Text>
        <Text style={styles.statLabel}>Total</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pendientes</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: '#7C3AED' }]}>{stats.inProgress}</Text>
        <Text style={styles.statLabel}>En Progreso</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.completed}</Text>
        <Text style={styles.statLabel}>Completadas</Text>
      </View>
    </View>
  );
}

function TicketFilters({ status, setStatus, priority, setPriority }: Readonly<{ status: string; setStatus: (v: string) => void; priority: string; setPriority: (v: string) => void }>) {
  return (
    <View style={styles.filtersSection}>
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
                style={[styles.filterButton, status === filter.value && styles.filterButtonActive]}
                onPress={() => setStatus(filter.value)}
              >
                <Text style={[styles.filterButtonText, status === filter.value && styles.filterButtonTextActive]}>
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
                style={[styles.filterButton, priority === filter.value && styles.filterButtonActive]}
                onPress={() => setPriority(filter.value)}
              >
                <Text style={[styles.filterButtonText, priority === filter.value && styles.filterButtonTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function KanbanFilterBar({ type, setType }: Readonly<{ type: string; setType: (v: string) => void }>) {
  return (
    <View style={styles.filterSection}>
      <Filter size={20} color="#64748B" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'route', label: 'Rutas' },
            { value: 'cleaning', label: 'Aseo' },
            { value: 'civil_work', label: 'Obras' },
            { value: 'approval', label: 'Aprobaciones' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[styles.filterButton, type === filter.value && styles.filterButtonActive]}
              onPress={() => setType(filter.value)}
            >
              <Text style={[styles.filterButtonText, type === filter.value && styles.filterButtonTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

// Encapsulated loader + refresher
function useWorkData(
  viewMode: ViewMode,
  deps: {
    user: any;
    loadTickets: (status?: string, range?: { start: string; end: string } | undefined) => Promise<void> | void;
    ticketFilterStatus: string;
    selectedPeriod: string;
    loadUserTasks: (userId: string) => Promise<void> | void;
  }
) {
  const { user, loadTickets, ticketFilterStatus, selectedPeriod, loadUserTasks } = deps;

  useEffect(() => {
    if (viewMode === 'list') {
      loadTickets(ticketFilterStatus === 'all' ? undefined : ticketFilterStatus, getDateRange(selectedPeriod));
      return;
    }
    if (viewMode === 'kanban' && user) {
      loadUserTasks(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, ticketFilterStatus, selectedPeriod]);

  const onRefresh = async () => {
    if (viewMode === 'list') {
      await loadTickets(ticketFilterStatus === 'all' ? undefined : ticketFilterStatus, getDateRange(selectedPeriod));
      return;
    }
    if (viewMode === 'kanban' && user) {
      await loadUserTasks(user.id);
    }
  };

  return { onRefresh };
}

export default function WorkScreen() {
  const { canTickets, canKanban } = useAuthz();
  const allowed = canTickets || canKanban;

  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const colors = getColors();

  // Tickets state
  const {
    tickets,
    currentTicket,
    error: ticketsError,
    loadTickets,
    setCurrentTicket,
    clearError: clearTicketsError,
  } = useTicketStore();

  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('all');
  const [ticketFilterPriority, setTicketFilterPriority] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);

  // Kanban state
  const { user } = useAuthStore();
  const {
    tasks,
    currentTask,
    error: kanbanError,
    loadUserTasks,
    setCurrentTask,
    clearError: clearKanbanError,
  } = useKanbanStore();
  const [kanbanFilterType, setKanbanFilterType] = useState<string>('all');
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>(canTickets ? 'list' : 'kanban');
  const [refreshing, setRefreshing] = useState(false);

  const { onRefresh } = useWorkData(viewMode, {
    user,
    loadTickets,
    ticketFilterStatus,
    selectedPeriod,
    loadUserTasks,
  });

  // Derived data - Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => (ticketFilterPriority !== 'all' ? t.priority === ticketFilterPriority : true));
  }, [tickets, ticketFilterPriority]);

  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const assigned = tickets.filter((t) => t.status === 'assigned').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const completed = tickets.filter((t) => t.status === 'completed').length;
    const onHold = tickets.filter((t) => t.status === 'on_hold').length;
    return { total, assigned, inProgress, completed, onHold };
  }, [tickets]);

  // Derived data - Kanban
  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => {
      const statusMatch = task.status === status;
      const typeMatch = kanbanFilterType === 'all' || task.type === kanbanFilterType;
      return statusMatch && typeMatch;
    });
  };

  const kanbanStats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Error handling
  const activeError = viewMode === 'list' ? ticketsError : kanbanError;
  const clearActiveError = viewMode === 'list' ? clearTicketsError : clearKanbanError;

  if (activeError) {
    return <ErrorView viewMode={viewMode} message={activeError} onRetry={clearActiveError} colors={colors} />;
  }

  return (
    <AccessGuard allowed={allowed}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              {viewMode === 'list' ? (
                <TicketIcon size={28} color="#7C3AED" />
              ) : (
                <KanbanIcon size={28} color="#7C3AED" />
              )}
              <Text style={[styles.title, { color: colors.text }]}>Trabajo</Text>
            </View>
            <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
              <RefreshCw size={24} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* View toggle */}
          <ViewToggle mode={viewMode} setMode={setViewMode} />

          {viewMode === 'list' ? (
            <>
              <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
              <TicketStats stats={ticketStats} colors={colors} />
              <TicketFilters
                status={ticketFilterStatus}
                setStatus={setTicketFilterStatus}
                priority={ticketFilterPriority}
                setPriority={setTicketFilterPriority}
              />
            </>
          ) : (
            <>
              <KanbanStats stats={kanbanStats} />
              <KanbanFilterBar type={kanbanFilterType} setType={setKanbanFilterType} />
            </>
          )}
        </View>

        {/* Content */}
        {viewMode === 'list' ? (
          <ScrollView
            style={styles.content}
            contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); }} />}
          >
            {filteredTickets.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={64} color="#9CA3AF" />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  {ticketFilterStatusLabel(ticketFilterStatus)} vacíos
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>No hay datos para mostrar</Text>
              </View>
            ) : (
              filteredTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onPress={() => handleTicketPress(ticket)} />
              ))
            )}
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            style={styles.kanbanContainer}
            contentContainerStyle={[styles.kanbanContent, { paddingBottom: insets.bottom + 100 }]}
            showsHorizontalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await onRefresh(); setRefreshing(false); }} />}
          >
            <KanbanColumn
              title="Pendientes"
              status="pending"
              tasks={getTasksByStatus('pending')}
              onTaskPress={handleTaskPress}
              color="#F59E0B"
            />
            <KanbanColumn
              title="En Progreso"
              status="in_progress"
              tasks={getTasksByStatus('in_progress')}
              onTaskPress={handleTaskPress}
              color="#7C3AED"
            />
            <KanbanColumn
              title="Completadas"
              status="completed"
              tasks={getTasksByStatus('completed')}
              onTaskPress={handleTaskPress}
              color="#16A34A"
            />
          </ScrollView>
        )}

        {/* Modals */}
        {currentTicket && (
          <TicketDetailModal
            ticket={currentTicket}
            visible={showTicketDetailModal}
            onClose={() => {
              setShowTicketDetailModal(false);
              setCurrentTicket(null);
            }}
          />
        )}
        {currentTask && (
          <TaskDetailModal
            task={currentTask}
            visible={showTaskDetailModal}
            onClose={() => {
              setShowTaskDetailModal(false);
              setCurrentTask(null);
            }}
          />
        )}
      </SafeAreaView>
    </AccessGuard>
  );

  // Handlers
  function handleTicketPress(ticket: any) {
    setCurrentTicket(ticket);
    setShowTicketDetailModal(true);
  }

  function handleTaskPress(task: any) {
    setCurrentTask(task);
    setShowTaskDetailModal(true);
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    marginBottom: 12,
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 4,
    gap: 8,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#7C3AED',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
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
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  contentContainer: {
    flexGrow: 1,
  },
  kanbanContainer: {
    flex: 1,
  },
  kanbanContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
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
