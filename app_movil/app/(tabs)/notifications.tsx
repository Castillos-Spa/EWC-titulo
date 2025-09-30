import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Bell, RefreshCw, CheckCircle, FileText, Search, Plus } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { CreateNotificationModal } from '../components/CreateNotificationModal';
import { NotificationApi } from '../services/NotificationApi';
import { useAuthz } from '@/hooks/useAuthz';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { items, error, connected, connect, disconnect, markAsRead } = useNotificationsStore();
  const { hasAnyRole, hasPerm } = useAuthz();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      disconnect();
      connect();
    } finally {
      setRefreshing(false);
    }
  };

  const canCreate = hasAnyRole('Admin', 'Manager') || hasPerm('MANAGE_NOTIFICATIONS');

  const handleCreate = async (payload: { message: string; type: string; target: 'global' | 'areas'; areas?: string[] }) => {
    await NotificationApi.create(payload);
    setShowCreate(false);
    // tras crear, pedimos al socket que reenvíe init si tu backend lo soporta automáticamente; si no, reconectamos
    disconnect();
    connect();
  };

  const stats = useMemo(() => {
    const total = items.length;
    const unread = items.filter(n => !n.read).length;
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const last24h = items.filter(n => new Date(n.timestamp).getTime() >= since).length;
    return { total, unread, last24h };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(n => {
      const matchesText = !q || n.message.toLowerCase().includes(q) || n.type.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'unread' ? !n.read : !!n.read);
      return matchesText && matchesStatus;
    });
  }, [items, statusFilter, search]);

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
          <Bell size={64} color="#DC2626" />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={handleRefresh}>
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
            <Bell size={28} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]}>Notificaciones</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={[styles.connectionDot, { backgroundColor: connected ? '#16A34A' : '#DC2626' }]} />
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
            {canCreate && (
              <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#DC2626' }]}>{stats.unread}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>No leídas</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statValue, { color: '#2563EB' }]}>{stats.last24h}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Últimas 24h</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBox, { backgroundColor: '#F1F5F9' }]}>
            <Search size={18} color="#64748B" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por tipo o mensaje…"
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {[
                { value: 'all', label: 'Todas' },
                { value: 'unread', label: 'No leídas' },
                { value: 'read', label: 'Leídas' },
              ].map(f => (
                <TouchableOpacity key={f.value}
                  style={[styles.filterButton, statusFilter === f.value && styles.filterButtonActive]}
                  onPress={() => setStatusFilter(f.value as any)}
                >
                  <Text style={[styles.filterButtonText, statusFilter === f.value && styles.filterButtonTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* List */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={64} color="#9CA3AF" />
            <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No hay notificaciones</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Las notificaciones aparecerán aquí</Text>
          </View>
        ) : (
          filtered.map(n => (
            <View key={n.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: n.read ? 0.85 : 1 }] }>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardType, { color: colors.textSecondary }]}>{n.type.toUpperCase()}</Text>
                {!n.read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
              <Text style={[styles.cardMessage, { color: colors.text }]}>{n.message}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(n.timestamp).toLocaleString('es-ES')}</Text>
                {!n.read && (
                  <TouchableOpacity style={[styles.readButton, { backgroundColor: '#16A34A' }]} onPress={() => markAsRead(n.id)}>
                    <CheckCircle size={16} color="#FFFFFF" />
                    <Text style={styles.readButtonText}>Marcar leído</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <CreateNotificationModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectionDot: { width: 10, height: 10, borderRadius: 5 },
  refreshButton: { padding: 12, borderRadius: 8, backgroundColor: '#F1F5F9', minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  createButton: { padding: 12, borderRadius: 8, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', marginBottom: 16 },
  stat: { alignItems: 'center', minWidth: 60, flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, fontWeight: '600' },

  filterSection: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: '#2563EB' },
  filterButtonText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  filterButtonTextActive: { color: '#FFFFFF' },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  contentContainer: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 },

  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardType: { fontSize: 12, fontWeight: '700' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  cardMessage: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTime: { fontSize: 12 },
  readButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  readButtonText: { color: '#FFFFFF', fontWeight: '700' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  errorText: { fontSize: 18, textAlign: 'center', marginTop: 16, marginBottom: 24, lineHeight: 26 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minHeight: 56, justifyContent: 'center' },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
