import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kanban as KanbanIcon, Filter, RefreshCw } from 'lucide-react-native';
import { useKanbanStore } from '../stores/kanbanStore';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore } from '../stores/themeStore';
import { KanbanColumn } from '../components/KanbanColumn';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { ChatModal } from '../components/ChatModal';
 

export default function KanbanScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const { user } = useAuthStore();
  const {
    tasks,
    currentTask,
    error,
    loadUserTasks,
    setCurrentTask,
    clearError,
  } = useKanbanStore();

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadUserTasks(user.id);
    }
  }, [user, loadUserTasks]);

  const handleRefresh = async () => {
    if (!user) return;
    await loadUserTasks(user.id);
  };

  const handleTaskPress = (task: any) => {
    setCurrentTask(task);
    setShowDetailModal(true);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => {
      const statusMatch = task.status === status;
      const typeMatch = filterType === 'all' || task.type === filterType;
      return statusMatch && typeMatch;
    });
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return { total, pending, inProgress, completed };
  };

  const stats = getTaskStats();

  const colors = getColors();

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <KanbanIcon size={64} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={clearError}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
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
            <KanbanIcon size={28} color="#7C3AED" />
            <Text style={[styles.title, { color: colors.text }]}>Mi Kanban</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <RefreshCw size={24} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
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

        {/* Filter */}
        <View style={styles.filterSection}>
          <Filter size={20} color="#64748B" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { value: 'all', label: 'Todas' },
                { value: 'route', label: 'Rutas' },
                { value: 'cleaning', label: 'Aseo' },
                { value: 'civil_work', label: 'Obras' },
                { value: 'it_ticket', label: 'TIC' },
                { value: 'approval', label: 'Aprobaciones' },
              ].map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.filterButton,
                    filterType === filter.value && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterType(filter.value)}
                >
                  <Text style={[
                    styles.filterButtonText,
                    filterType === filter.value && styles.filterButtonTextActive,
                  ]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Kanban Board */}
      <ScrollView
        horizontal
        style={styles.kanbanContainer}
        contentContainerStyle={[
          styles.kanbanContent,
          { paddingBottom: insets.bottom + 100 }
        ]}
        showsHorizontalScrollIndicator={false}
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

      {/* Task Detail Modal */}
      {currentTask && (
        <TaskDetailModal
          task={currentTask}
          visible={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setCurrentTask(null);
          }}
        />
      )}

      {/* Chat Modal */}
      <ChatModal
        visible={showChatModal}
        onClose={() => setShowChatModal(false)}
        title="Chat Kanban"
        channelId="kanban"
      />
    </SafeAreaView>
  );
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
    backgroundColor: '#7C3AED',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
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