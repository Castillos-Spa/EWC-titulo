import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Ticket as TicketIcon,
  Kanban as KanbanIcon,
  RefreshCw,
  Filter,
  TriangleAlert as AlertTriangle,
  FileText,
  Search,
  Layers,
  X as XIcon,
} from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useUIStore } from '../stores/uiStore';
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
import { CreateITTicketModal } from '../components/CreateITTicketModal';

type ViewMode = 'list' | 'kanban';

function ticketFilterStatusLabel(value: string) {
  switch (value) {
    case 'assigned':
      return 'Pendientes';
    case 'in_progress':
      return 'En Progreso';
    case 'completed':
      return 'Resueltos';
    default:
      return 'Tickets';
  }
}

function TicketsHeroHeader({
  total,
  onCreate,
  onRefresh,
  colors,
}: Readonly<{ total: number; onCreate: () => void; onRefresh: () => void; colors: any }>) {
  return (
    <View style={styles.ticketsHeroWrapper}>
      <LinearGradient
        colors={[`${colors.primary}1F`, '#ffffff', `${colors.primary}12`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ticketsHeroGradient}
      >
        <View style={styles.ticketsHeroHeaderRow}>
          <View style={styles.ticketsHeroTexts}>
            <View style={styles.ticketsHeroBadge}>
              <TicketIcon size={14} color={colors.primary} />
              <Text style={[styles.ticketsHeroBadgeText, { color: colors.textSecondary }]}>Helpdesk</Text>
            </View>
            <Text style={[styles.ticketsHeroTitle, { color: colors.text }]}>Tickets y solicitudes</Text>
            <Text style={[styles.ticketsHeroSub, { color: colors.textSecondary }]}>
              Gestiona y da seguimiento a tickets y requerimientos
            </Text>
            <View style={[styles.ticketsHeroCountPill, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <Text style={[styles.ticketsHeroCountText, { color: colors.textSecondary }]}>
                {new Intl.NumberFormat().format(total)} activos
              </Text>
            </View>
          </View>
          <View style={styles.ticketsHeroActions}>
            <TouchableOpacity
              onPress={onCreate}
              style={[styles.ticketsHeroButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.9}
            >
              <Text style={styles.ticketsHeroButtonText}>Nuevo ticket</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRefresh}
              style={[styles.ticketsHeroButtonAlt, { borderColor: colors.border }]}
              activeOpacity={0.9}
            >
              <RefreshCw size={16} color={colors.textSecondary} />
              <Text style={[styles.ticketsHeroButtonAltText, { color: colors.textSecondary }]}>Refrescar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
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

function TicketStats({ stats, colors }: Readonly<{ stats: { total: number; assigned: number; inProgress: number; completed: number; onHold: number }; colors: any }>) {
  return (
    <View style={styles.statsRow}>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: '#6B7280' }]}>{stats.assigned}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.inProgress}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En Progreso</Text>
      </View>
      <View style={styles.stat}>
        <Text style={[styles.statValue, { color: '#16A34A' }]}>{stats.completed}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resueltos</Text>
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

function FiltersButton({ mode, showListFilters, showKanbanFilters, onToggle, badgeCount }: Readonly<{ mode: ViewMode; showListFilters: boolean; showKanbanFilters: boolean; onToggle: () => void; badgeCount: number }>) {
  const isVisible = mode === 'list' ? showListFilters : showKanbanFilters;
  const label = isVisible ? 'Ocultar filtros' : 'Mostrar filtros';
  return (
    <TouchableOpacity
      style={[styles.refreshButton, styles.filtersToggleButton]}
      onPress={onToggle}
      accessibilityLabel={label}
    >
      <Filter size={20} color="#334155" />
      <Text style={styles.filtersToggleText}>Filtros</Text>
      {badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function TicketFilters({ status, setStatus, priority, setPriority, category, setCategory, search, setSearch }: Readonly<{ status: string; setStatus: (v: string) => void; priority: string; setPriority: (v: string) => void; category: string; setCategory: (v: string) => void; search: string; setSearch: (v: string) => void }>) {
  return (
    <View style={styles.filtersSection}>
      {/* Búsqueda */}
      <View style={styles.filterGroup}>
        <Search size={16} color="#64748B" />
        <Text style={styles.filterLabel}>Buscar:</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Título, descripción o ID..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search?.length ? (
            <TouchableOpacity style={styles.searchClearButton} onPress={() => setSearch('')} accessibilityLabel="Limpiar búsqueda">
              <XIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterGroup}>
        <Filter size={16} color="#64748B" />
        <Text style={styles.filterLabel}>Estado:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {[
              { value: 'all', label: 'Todos' },
              { value: 'assigned', label: 'Pendientes' },
              { value: 'in_progress', label: 'En Progreso' },
              { value: 'completed', label: 'Resueltos' },
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

      {/* Categoría (como en la web) */}
      <View style={styles.filterGroup}>
        <Layers size={16} color="#64748B" />
        <Text style={styles.filterLabel}>Categoría:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {[
              { value: 'all', label: 'Todas' },
              { value: 'Soporte_IT', label: 'Soporte IT' },
              { value: 'Solicitud_Suministro', label: 'Solicitud Suministro' },
              { value: 'Mantenimiento', label: 'Mantenimiento' },
              { value: 'Reporte_Incidente', label: 'Reporte Incidente' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterButton, category === filter.value && styles.filterButtonActive]}
                onPress={() => setCategory(filter.value)}
              >
                <Text style={[styles.filterButtonText, category === filter.value && styles.filterButtonTextActive]}>
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

function KanbanFilters({
  status,
  setStatus,
  priority,
  setPriority,
  category,
  setCategory,
  search,
  setSearch,
}: Readonly<{
  status: string; setStatus: (v: string) => void;
  priority: string; setPriority: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  search: string; setSearch: (v: string) => void;
}>) {
  return (
    <View style={styles.filtersSection}>
      {/* Búsqueda */}
      <View style={styles.filterGroup}>
        <Search size={16} color="#64748B" />
        <Text style={styles.filterLabel}>Buscar:</Text>
        <View style={styles.searchInputContainer}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Título, descripción o ID..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
          />
          {search?.length ? (
            <TouchableOpacity style={styles.searchClearButton} onPress={() => setSearch('')} accessibilityLabel="Limpiar búsqueda">
              <XIcon size={16} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Estado (Kanban se basa en pending/in_progress/completed) */}
      <View style={styles.filterGroup}>
        <Filter size={16} color="#64748B" />
        <Text style={styles.filterLabel}>Estado:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {[
              { value: 'all', label: 'Todos' },
              { value: 'pending', label: 'Pendientes' },
              { value: 'in_progress', label: 'En Progreso' },
              { value: 'completed', label: 'Completadas' },
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

      {/* Categoría (como en la lista) */}
      <View style={styles.filterGroup}>
        <Layers size={16} color="#64748B" />
        <Text style={styles.filterLabel}>Categoría:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {[
              { value: 'all', label: 'Todas' },
              { value: 'Soporte_IT', label: 'Soporte IT' },
              { value: 'Solicitud_Suministro', label: 'Solicitud Suministro' },
              { value: 'Mantenimiento', label: 'Mantenimiento' },
              { value: 'Reporte_Incidente', label: 'Reporte Incidente' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filterButton, category === filter.value && styles.filterButtonActive]}
                onPress={() => setCategory(filter.value)}
              >
                <Text style={[styles.filterButtonText, category === filter.value && styles.filterButtonTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Prioridad */}
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

      {/* Tipo eliminado para paridad con Lista */}
    </View>
  );
}

// Encapsulated loader + refresher
function useWorkData(
  viewMode: ViewMode,
  deps: {
    user: any;
    loadTickets: (status?: string) => Promise<void> | void;
    ticketFilterStatus: string;
    loadUserTasks: (userId: string) => Promise<void> | void;
  }
) {
  const { user, loadTickets, ticketFilterStatus, loadUserTasks } = deps;

  useEffect(() => {
    if (viewMode === 'list') {
      loadTickets(ticketFilterStatus === 'all' ? undefined : ticketFilterStatus);
      return;
    }
    if (viewMode === 'kanban' && user) {
      loadUserTasks(user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, ticketFilterStatus]);

  const onRefresh = async () => {
    if (viewMode === 'list') {
      await loadTickets(ticketFilterStatus === 'all' ? undefined : ticketFilterStatus);
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

  // Filtros persistentes compartidos
  const {
    ticketFilterStatus,
    ticketFilterPriority,
    ticketFilterCategory,
    ticketSearch,
    setTicketFilterStatus,
    setTicketFilterPriority,
    setTicketFilterCategory,
    setTicketSearch,
  } = useUIStore();
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const { showListFilters: showFilters, showKanbanFilters, setShowListFilters, setShowKanbanFilters, loadUIPreferences } = useUIStore();

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
  // Eliminado filtro de tipo en Kanban para paridad con Lista
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);

  const { viewMode, setViewMode } = useUIStore();
  const [refreshing, setRefreshing] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);

  const { onRefresh } = useWorkData(viewMode, {
    user,
    loadTickets,
    ticketFilterStatus,
    loadUserTasks,
  });

  // Derived data - Tickets
  const filteredTickets = useMemo(() => {
    const q = ticketSearch.trim().toLowerCase();
    return tickets
      .filter((t) => (ticketFilterPriority === 'all' || t.priority === ticketFilterPriority))
      .filter((t) => (ticketFilterCategory === 'all' || (t.category || '').toString() === ticketFilterCategory))
      .filter((t) => (q.length === 0 || (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || String(t.id).includes(q))));
  }, [tickets, ticketFilterPriority, ticketFilterCategory, ticketSearch]);

  const ticketStats = useMemo(() => {
    const total = tickets.length;
    const assigned = tickets.filter((t) => t.status === 'assigned').length;
    const inProgress = tickets.filter((t) => t.status === 'in_progress').length;
    const completed = tickets.filter((t) => t.status === 'completed').length;
    const onHold = tickets.filter((t) => t.status === 'on_hold').length;
    return { total, assigned, inProgress, completed, onHold };
  }, [tickets]);

  // Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (ticketFilterStatus !== 'all') count++;
    if (ticketFilterPriority !== 'all') count++;
    if (ticketFilterCategory !== 'all') count++;
    if (ticketSearch.trim().length > 0) count++;
    // Si se quiere incluir el periodo, descomentar:
    // if (selectedPeriod !== 'week') count++;
    return count;
  }, [ticketFilterStatus, ticketFilterPriority, ticketFilterCategory, ticketSearch]);

  // Derived data - Kanban (filtros equivalentes a Lista)
  const getTasksByStatus = (status: string) => {
    const q = ticketSearch.trim().toLowerCase();
    return tasks.filter((task) => {
      const statusMatch = task.status === status;
      const typeMatch = true; // tipo eliminado
      const priorityMatch = ticketFilterPriority === 'all' || task.priority === ticketFilterPriority;
      const categoryMatch = ticketFilterCategory === 'all' || (task.category || '') === ticketFilterCategory;
      const searchMatch = !q || task.title?.toLowerCase().includes(q) || task.description?.toLowerCase().includes(q) || String(task.id).includes(q);
      let statusFilterOk = true;
      if (ticketFilterStatus !== 'all') {
        if (ticketFilterStatus === 'assigned') {
          statusFilterOk = task.status === 'pending';
        } else {
          statusFilterOk = task.status === (ticketFilterStatus as any);
        }
      }
      return statusMatch && typeMatch && priorityMatch && categoryMatch && searchMatch && statusFilterOk;
    });
  };

  const kanbanStats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    return { total, pending, inProgress, completed };
  }, [tasks]);

  // Contador de filtros activos (Kanban)
  const activeKanbanFiltersCount = useMemo(() => {
    let count = 0;
    if (ticketFilterStatus !== 'all') count++;
    if (ticketFilterPriority !== 'all') count++;
    if (ticketFilterCategory !== 'all') count++;
    if (ticketSearch.trim().length > 0) count++;
    return count;
  }, [ticketFilterStatus, ticketFilterPriority, ticketFilterCategory, ticketSearch]);

  // Error handling
  const activeError = viewMode === 'list' ? ticketsError : kanbanError;
  const clearActiveError = viewMode === 'list' ? clearTicketsError : clearKanbanError;

  // Cargar preferencias de UI (visibilidad de filtros + modo de vista) una sola vez
  useEffect(() => {
    loadUIPreferences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Si el modo actual no es permitido, forzar fallback
  useEffect(() => {
    const allowedDesired = viewMode === 'list' ? canTickets : canKanban;
    if (!allowedDesired) {
      setViewMode(canTickets ? 'list' : 'kanban');
    }
  }, [viewMode, canTickets, canKanban, setViewMode]);

  if (activeError) {
    return <ErrorView viewMode={viewMode} message={activeError} onRetry={clearActiveError} colors={colors} />;
  }

  return (
    <AccessGuard allowed={allowed}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Hero Tickets (paridad con web) */}
        <TicketsHeroHeader
          total={tickets.length}
          onCreate={() => setOpenCreate(true)}
          onRefresh={onRefresh}
          colors={colors}
        />

        {/* Controles: Toggle + Filtros */}
        <View style={styles.headerBody}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <View style={{ flex: 1 }}>
              <ViewToggle mode={viewMode} setMode={setViewMode} />
            </View>
            <FiltersButton
              mode={viewMode}
              showListFilters={showFilters}
              showKanbanFilters={showKanbanFilters}
              onToggle={() => (viewMode === 'list' ? setShowListFilters(!showFilters) : setShowKanbanFilters(!showKanbanFilters))}
              badgeCount={viewMode === 'list' ? activeFiltersCount : activeKanbanFiltersCount}
            />
          </View>

          {viewMode === 'list' ? (
            <>
              <TicketStats stats={ticketStats} colors={colors} />
              {showFilters ? (
                <TicketFilters
                  status={ticketFilterStatus}
                  setStatus={setTicketFilterStatus}
                  priority={ticketFilterPriority}
                  setPriority={setTicketFilterPriority}
                  category={ticketFilterCategory}
                  setCategory={setTicketFilterCategory}
                  search={ticketSearch}
                  setSearch={setTicketSearch}
                />
              ) : null}
            </>
          ) : (
            <>
              <KanbanStats stats={kanbanStats} />
              {showKanbanFilters ? (
                <KanbanFilters
                  status={ticketFilterStatus}
                  setStatus={setTicketFilterStatus}
                  priority={ticketFilterPriority}
                  setPriority={setTicketFilterPriority}
                  category={ticketFilterCategory}
                  setCategory={setTicketFilterCategory}
                  search={ticketSearch}
                  setSearch={setTicketSearch}
                />
              ) : null}
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
        <CreateITTicketModal visible={openCreate} onClose={() => setOpenCreate(false)} />
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
  ticketsHeroWrapper: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  ticketsHeroGradient: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketsHeroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  ticketsHeroTexts: {
    flex: 1,
    gap: 8,
  },
  ticketsHeroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFFCC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ticketsHeroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  ticketsHeroTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  ticketsHeroSub: {
    fontSize: 13,
  },
  ticketsHeroCountPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  ticketsHeroCountText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  ticketsHeroActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  ticketsHeroButton: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ticketsHeroButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ticketsHeroButtonAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFFCC',
  },
  ticketsHeroButtonAltText: {
    fontSize: 13,
    fontWeight: '600',
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
    marginBottom: 12,
  },
  headerBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtersToggleButton: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    minWidth: undefined,
  },
  filtersToggleText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
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
  // Search pill styles
  searchPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  searchText: {
    color: '#6B7280',
    fontSize: 14,
  },
  // Search input styles
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 36,
    flex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
  },
  searchClearButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 12,
  },
  // Badge
  badge: {
    marginLeft: 4,
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
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
