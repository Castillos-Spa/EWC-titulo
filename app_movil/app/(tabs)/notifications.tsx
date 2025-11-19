import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Bell, RefreshCw, CheckCircle, FileText, Plus, ShieldCheck } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../stores/themeStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { CreateNotificationModal } from '../components/CreateNotificationModal';
import { NotificationApi } from '../services/NotificationApi';
import { useAuthz } from '@/hooks/useAuthz';

type Prio = 'low' | 'normal' | 'high';
type Scope = 'global' | 'areas' | 'roles';

function getTypeLabel(n: { priority?: Prio; type?: string }): string {
  if (n.priority === 'high') return 'ALTA';
  if (n.priority === 'low') return 'BAJA';
  if (n.priority === 'normal') return 'NORMAL';
  return n.type ? n.type.toUpperCase() : '';
}

function getTargetText(n: { targetScope?: Scope; targetAreas?: string[] }): string {
  if (n.targetScope === 'global') return 'Global';
  if (n.targetScope === 'roles') return 'Roles';
  if (n.targetScope === 'areas') {
    const hasAreas = Array.isArray(n.targetAreas) && n.targetAreas.length > 0;
    return hasAreas ? `Áreas: ${n.targetAreas!.join(', ')}` : 'Áreas';
  }
  return '';
}

function getPriorityMeta(n: { priority?: Prio }): { text: string; key: Prio } | null {
  if (!n.priority) return null;
  if (n.priority === 'high') return { text: 'Alta prioridad', key: 'high' };
  if (n.priority === 'low') return { text: 'Prioridad baja', key: 'low' };
  return { text: 'Prioridad normal', key: 'normal' };
}

function PriorityBadge({ prio }: Readonly<{ prio?: Prio }>) {
  const meta = getPriorityMeta({ priority: prio });
  if (!meta) return null;
  let style = styles.badgeNormal;
  if (meta.key === 'high') style = styles.badgeHigh;
  else if (meta.key === 'low') style = styles.badgeLow;
  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.badgeText}>{meta.text}</Text>
    </View>
  );
}

function TargetBadge({ scope, areas }: Readonly<{ scope?: Scope; areas?: string[] }>) {
  if (!scope) return null;
  const text = getTargetText({ targetScope: scope, targetAreas: areas });
  if (!text) return null;
  return (
    <View style={[styles.badge, styles.badgeSecondary]}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

function PinnedBadge({ pinned }: Readonly<{ pinned?: boolean }>) {
  if (!pinned) return null;
  return (
    <View style={[styles.badge, styles.badgePinned]}>
      <Text style={styles.badgeText}>Fijada</Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { items, error, connect, disconnect, markAsRead, hydrateFromApi, loadMore, hasMore, clearError } = useNotificationsStore();
  const { hasAnyRole, hasPerm } = useAuthz();
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search,] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    // Hidratar desde backend y luego conectar socket para tiempo real
    (async () => {
      try {
        await hydrateFromApi(1);
      } catch {}
      connect();
    })();
    return () => disconnect();
  }, [connect, disconnect, hydrateFromApi]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await hydrateFromApi(1);
      disconnect();
      connect();
    } finally {
      setRefreshing(false);
    }
  };

  const canCreate = hasAnyRole('Admin', 'Manager') || hasPerm('MANAGE_NOTIFICATIONS');

  const handleCreate = async (payload: { title: string; message: string; priority: 'low' | 'normal' | 'high'; target: { scope: 'global' | 'areas'; areas?: string[] } }) => {
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

  const sections = useMemo(() => {
    const byLabel: Record<string, typeof items> = {};
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const today = startOfDay(now);
    const yesterday = today - 24 * 60 * 60 * 1000;

    const labelFor = (ts: string) => {
      const day = startOfDay(new Date(ts));
      if (day === today) return 'Hoy';
      if (day === yesterday) return 'Ayer';
      return new Date(ts).toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'short' });
    };

    const sorted = [...filtered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    for (const n of sorted) {
      const label = labelFor(n.timestamp);
      if (!byLabel[label]) byLabel[label] = [];
      byLabel[label].push(n);
    }
    return Object.entries(byLabel).map(([label, data]) => ({ label, data }));
  }, [filtered]);

  const markAllVisible = async () => {
    const toMark = filtered.filter(n => !n.read);
    await Promise.allSettled(toMark.map(n => markAsRead(n.id)));
  };

  const renderCard = (n: typeof items[number]) => {
    const typeLabel = getTypeLabel({ priority: n.priority, type: n.type });
    return (
      <View key={n.id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: n.read ? 0.85 : 1 }] }>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardType, { color: colors.textSecondary }]}>{typeLabel}</Text>
          {n.read ? null : <View style={styles.unreadDot} />}
        </View>
        {n.title ? <Text style={[styles.cardTitle, { color: colors.text }]}>{n.title}</Text> : null}
        <Text style={[styles.cardMessage, { color: colors.text }]}>{n.message}</Text>
        <View style={styles.badgesRow}>
          <PriorityBadge prio={n.priority as Prio | undefined} />
          <TargetBadge scope={n.targetScope as Scope | undefined} areas={n.targetAreas} />
          <PinnedBadge pinned={n.pinned} />
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.cardTime, { color: colors.textSecondary }]}>{new Date(n.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</Text>
          {n.read ? null : (
            <TouchableOpacity style={[styles.readButton, { backgroundColor: '#16A34A' }]} onPress={() => markAsRead(n.id)}>
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.readButtonText}>Marcar leído</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
      {/* Fondo y halos estilo login */}
      <LinearGradient
        colors={[colors.primary + '22', '#00000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      />
      <View pointerEvents="none" style={styles.halosContainer}>
        <View style={[styles.haloTop, { backgroundColor: colors.accent + '33' }]} />
        <View style={[styles.haloBottom, { backgroundColor: colors.secondary + '33' }]} />
      </View>

      {/* Hero / encabezado principal */}
      <View style={styles.heroSection}>
        <View style={[styles.heroBadge, { backgroundColor: colors.accent + '22' }]}> 
          <ShieldCheck size={14} color={colors.accent} />
          <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Centro de avisos</Text>
        </View>
          <View style={styles.headerTitle}>
            <Bell size={28} color={colors.primary} />
            <Text style={[styles.heroTitle, { color: colors.text }]}>Notificaciones</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <RefreshCw size={24} color={colors.primary} />
            </TouchableOpacity>
            {canCreate && (
              <TouchableOpacity style={[styles.createButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        <Text style={[styles.heroText, { color: colors.textSecondary }]}>Gestiona y revisa alertas corporativas, segmentadas por prioridad, ámbito y estado de lectura.</Text>
      </View>

      {/* Card contenedora al estilo login */}
      <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeaderRow}>
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
          <TouchableOpacity
            disabled={filtered.every(n => n.read)}
            onPress={markAllVisible}
            style={[styles.markAllButton, { backgroundColor: filtered.every(n => n.read) ? '#CBD5E1' : '#0EA5E9' }]}
          >
            <Text style={styles.markAllText}>Marcar visibles</Text>
          </TouchableOpacity>
        </View>
        </View>
      </View>
      {error ? (
        <View style={[styles.inlineError, { borderColor: colors.error + '55', backgroundColor: colors.error + '22' }] }>
          <Text style={[styles.inlineErrorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={clearError} accessibilityLabel="Cerrar error" style={styles.inlineErrorClose}>
            <Text style={[styles.inlineErrorCloseText, { color: colors.error }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
          sections.map(section => (
            <View key={section.label} style={styles.sectionBlock}>
              <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{section.label}</Text>
              {section.data.map(n => renderCard(n))}
            </View>
          ))
        )}

        {hasMore && (
          <TouchableOpacity onPress={loadMore} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>Cargar más</Text>
          </TouchableOpacity>
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
  heroGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 220 },
  halosContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  haloTop: { position: 'absolute', top: -60, left: -40, width: 200, height: 200, borderRadius: 9999, opacity: 0.6 },
  haloBottom: { position: 'absolute', bottom: -80, right: -40, width: 240, height: 240, borderRadius: 9999, opacity: 0.5 },
  heroSection: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 12, gap: 12 },
  heroBadge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroTitle: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  heroText: { fontSize: 14 },
  mainCard: { borderRadius: 20, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 2 },
  cardHeaderRow: { marginBottom: 8 },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
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
  markAllButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, minHeight: 36, alignItems: 'center', justifyContent: 'center' },
  markAllText: { color: '#FFFFFF', fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  contentContainer: { flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  sectionBlock: { marginBottom: 16 },
  sectionHeader: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },

  card: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardType: { fontSize: 12, fontWeight: '700' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#DC2626' },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  cardMessage: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  badgeText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  badgeHigh: { backgroundColor: '#FEE2E2' },
  badgeNormal: { backgroundColor: '#DBEAFE' },
  badgeLow: { backgroundColor: '#E2E8F0' },
  badgeSecondary: { backgroundColor: '#F8FAFC' },
  badgePinned: { backgroundColor: '#E0E7FF' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTime: { fontSize: 12 },
  readButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  readButtonText: { color: '#FFFFFF', fontWeight: '700' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  errorText: { fontSize: 18, textAlign: 'center', marginTop: 16, marginBottom: 24, lineHeight: 26 },
  retryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minHeight: 56, justifyContent: 'center' },
  retryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loadMoreButton: { alignSelf: 'center', marginTop: 8, marginBottom: 24, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#E2E8F0', borderRadius: 8 },
  loadMoreText: { fontWeight: '700', color: '#0F172A' },
  inlineError: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 24, marginBottom: 12, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  inlineErrorText: { flex: 1, fontSize: 12, fontWeight: '600' },
  inlineErrorClose: { paddingHorizontal: 8, paddingVertical: 4 },
  inlineErrorCloseText: { fontSize: 12, fontWeight: '700' },
});
