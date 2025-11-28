import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Camera, Plus, RefreshCw, Search, Shield } from 'lucide-react-native';
import { useIncidentStore } from '@/stores/incidentStore';
import type { Incident, IncidentSeverity, IncidentStatus } from '@/stores/incidentStore';
import { useThemeStore } from '@/stores/themeStore';
import { IncidentCard } from '@/components/IncidentCard';
import { CreateIncidentModal } from '@/components/CreateIncidentModal';
import { IncidentDetailModal } from '@/components/IncidentDetailModal';

type StatusFilter = 'all' | IncidentStatus;
type SeverityFilter = 'all' | IncidentSeverity;

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'reported', label: 'Reportados' },
  { value: 'acknowledged', label: 'Reconocidos' },
  { value: 'in_progress', label: 'En progreso' },
  { value: 'resolved', label: 'Resueltos' },
];

const SEVERITY_FILTERS: Array<{ value: SeverityFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

const NEXT_STATUS: Record<IncidentStatus, IncidentStatus | null> = {
  reported: 'acknowledged',
  acknowledged: 'in_progress',
  in_progress: 'resolved',
  resolved: null,
};

const SEVERITY_COLOR: Record<IncidentSeverity, string> = {
  low: '#16A34A',
  medium: '#D97706',
  high: '#EA580C',
  critical: '#DC2626',
};

function computeLayout(width: number) {
  const isCompact = width < 360;
  const isWide = width > 768;
  const horizontalPadding = isCompact ? 16 : isWide ? 28 : 20;
  const heroTitleSize = isCompact ? 22 : isWide ? 28 : 24;
  const statValueSize = isCompact ? 18 : 20;
  const sectionGap = isCompact ? 12 : 16;
  return { horizontalPadding, heroTitleSize, statValueSize, sectionGap };
}

export default function IncidentsScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const layout = useMemo(() => computeLayout(width), [width]);
  const { getColors } = useThemeStore();
  const colors = getColors();
  const {
    incidents,
    currentIncident,
    error,
    isLoading,
    isDetailLoading,
    loadIncidents,
    loadIncidentDetail,
    updateIncidentStatus,
    setCurrentIncident,
    clearError,
  } = useIncidentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [advancingMap, setAdvancingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void loadIncidents();
  }, [loadIncidents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadIncidents();
    } finally {
      setRefreshing(false);
    }
  };

  const handleIncidentPress = (incident: Incident) => {
    setCurrentIncident(incident);
    setShowDetailModal(true);
    void loadIncidentDetail(incident.id);
  };

  const handleAdvanceStatus = async (incident: Incident) => {
    const nextStatus = NEXT_STATUS[incident.status];
    if (!nextStatus || advancingMap[incident.id]) {
      return;
    }
    setAdvancingMap((prev) => ({ ...prev, [incident.id]: true }));
    try {
      await updateIncidentStatus(incident.id, nextStatus);
    } finally {
      setAdvancingMap((prev) => {
        const clone = { ...prev };
        delete clone[incident.id];
        return clone;
      });
    }
  };

  const stats = useMemo(() => {
    const total = incidents.length;
    const reported = incidents.filter((item) => item.status === 'reported').length;
    const acknowledged = incidents.filter((item) => item.status === 'acknowledged').length;
    const inProgress = incidents.filter((item) => item.status === 'in_progress').length;
    const resolved = incidents.filter((item) => item.status === 'resolved').length;
    const withPhotos = incidents.filter((item) => Array.isArray(item.photos) && item.photos.length > 0).length;
    return {
      total,
      open: reported + acknowledged,
      inProgress,
      resolved,
      withPhotos,
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return incidents.filter((incident) => {
      if (statusFilter !== 'all' && incident.status !== statusFilter) {
        return false;
      }
      if (severityFilter !== 'all' && incident.severity !== severityFilter) {
        return false;
      }
      if (onlyWithPhotos && (!incident.photos || incident.photos.length === 0)) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [incident.title, incident.description, incident.area]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [incidents, statusFilter, severityFilter, onlyWithPhotos, searchTerm]);

  const hasActiveFilters =
    statusFilter !== 'all' || severityFilter !== 'all' || onlyWithPhotos || searchTerm.trim().length > 0;

  const clearFiltersState = () => {
    setStatusFilter('all');
    setSeverityFilter('all');
    setOnlyWithPhotos(false);
    setSearchTerm('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '22', '#00000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      />
      <View pointerEvents="none" style={styles.halosContainer}>
        <View style={[styles.haloTop, { backgroundColor: colors.primary + '33' }]} />
        <View style={[styles.haloBottom, { backgroundColor: colors.secondary + '2A' }]} />
      </View>

      <View
        style={[styles.heroSection, {
          paddingHorizontal: layout.horizontalPadding,
          paddingTop: insets.top + 16,
          gap: layout.sectionGap,
        }]}
      >
        <View style={[styles.heroBadge, { backgroundColor: colors.surface + 'AA', borderColor: colors.border }]}>
          <Shield size={16} color={colors.primary} />
          <Text style={[styles.heroBadgeText, { color: colors.primary }]}>Comando de incidentes</Text>
        </View>

        <View style={styles.heroHeaderRow}>
          <View style={[styles.heroIconBox, { backgroundColor: colors.error + '20' }]}>
            <AlertTriangle size={24} color={colors.error} />
          </View>
          <View style={styles.heroTextColumn}>
            <Text style={[styles.heroTitle, { color: colors.text, fontSize: layout.heroTitleSize }]}>Incidentes</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Monitorea, prioriza y resuelve los incidentes operacionales desde un panel unificado.</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.surface }]} onPress={handleRefresh}>
              <RefreshCw size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View
        style={[styles.summaryCard, {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          marginHorizontal: layout.horizontalPadding,
          marginTop: layout.sectionGap,
        }]}
      >
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.text, fontSize: layout.statValueSize }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reportes totales</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: colors.error, fontSize: layout.statValueSize }]}>{stats.open}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pendientes</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: '#2563EB', fontSize: layout.statValueSize }]}>{stats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>En progreso</Text>
          </View>
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, { color: '#16A34A', fontSize: layout.statValueSize }]}>{stats.resolved}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resueltos</Text>
          </View>
        </View>

        <View style={[styles.filterSection, { borderTopColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filterRow}>
              {STATUS_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.value}
                  style={[styles.filterChip, filter.value === statusFilter && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                  onPress={() => setStatusFilter(filter.value)}
                >
                  <Text style={[styles.filterChipText, filter.value === statusFilter && { color: '#FFFFFF' }]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {hasActiveFilters ? (
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFiltersState}>
              <Text style={styles.clearFiltersText}>Limpiar</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.severityRow}>
          {SEVERITY_FILTERS.map((filter) => {
            const isActive = filter.value === severityFilter;
            const tone = filter.value === 'all' ? colors.textSecondary : SEVERITY_COLOR[filter.value as IncidentSeverity];
            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.severityChip, { borderColor: filter.value === 'all' ? colors.border : tone + '66' }, isActive && { backgroundColor: tone + '1A' }]}
                onPress={() => setSeverityFilter(filter.value)}
              >
                <Text style={[styles.severityChipText, { color: isActive ? tone : colors.textSecondary }]}>{filter.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}> 
            <Search size={18} color={colors.textSecondary} />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar por título, descripción o área"
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            style={[styles.toggleChip, onlyWithPhotos && { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
            onPress={() => setOnlyWithPhotos((prev) => !prev)}
          >
            <Camera size={16} color={onlyWithPhotos ? colors.primary : colors.textSecondary} />
            <Text style={[styles.toggleChipText, { color: onlyWithPhotos ? colors.primary : colors.textSecondary }]}>
              Solo con fotos ({stats.withPhotos})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={[styles.errorBanner, {
          backgroundColor: colors.error + '15',
          borderColor: colors.error + '40',
          marginHorizontal: layout.horizontalPadding,
        }]}
        >
          <Text style={[styles.errorBannerText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={[styles.errorBannerLink, { color: colors.error }]}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        style={[styles.list, { paddingHorizontal: layout.horizontalPadding }]}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && incidents.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando incidentes</Text>
          </View>
        ) : filteredIncidents.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertTriangle size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No encontramos incidentes</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Ajusta los filtros o registra un nuevo reporte.</Text>
            <TouchableOpacity
              style={[styles.emptyAction, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.emptyActionText}>Reportar incidente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredIncidents.map((incident) => (
            <IncidentCard
              key={incident.id}
              incident={incident}
              onPress={() => handleIncidentPress(incident)}
              onAdvanceStatus={() => handleAdvanceStatus(incident)}
              advancing={Boolean(advancingMap[incident.id])}
            />
          ))
        )}
      </ScrollView>

      <CreateIncidentModal visible={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {currentIncident && (
        <IncidentDetailModal
          incident={currentIncident}
          visible={showDetailModal}
          isLoading={isDetailLoading}
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
  container: { flex: 1 },
  heroGradient: { position: 'absolute', left: 0, right: 0, top: 0, height: 220 },
  halosContainer: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  haloTop: { position: 'absolute', top: -60, left: -40, width: 220, height: 220, borderRadius: 9999, opacity: 0.5 },
  haloBottom: { position: 'absolute', bottom: -80, right: -60, width: 260, height: 260, borderRadius: 9999, opacity: 0.4 },
  heroSection: { paddingBottom: 12 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  heroBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIconBox: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  heroTextColumn: { flex: 1, gap: 6 },
  heroTitle: { fontWeight: '700', lineHeight: 30 },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  heroActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14, paddingHorizontal: 16, height: 44 },
  summaryCard: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 16, shadowColor: '#000000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 },
  statBlock: { flexShrink: 0 },
  statValue: { fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  filterSection: { borderTopWidth: 1, paddingTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterRow: { flexDirection: 'row', gap: 8, paddingRight: 12 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  clearFiltersButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#E2E8F0' },
  clearFiltersText: { fontSize: 12, fontWeight: '700', color: '#0F172A' },
  severityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  severityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, backgroundColor: '#F8FAFC' },
  severityChipText: { fontSize: 12, fontWeight: '700' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  toggleChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  toggleChipText: { fontSize: 13, fontWeight: '600' },
  errorBanner: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, marginTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  errorBannerText: { fontSize: 13, fontWeight: '600' },
  errorBannerLink: { fontSize: 12, fontWeight: '700' },
  list: { flex: 1, paddingTop: 20 },
  listContent: { paddingBottom: 120 },
  loadingState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyAction: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 },
  emptyActionText: { color: '#FFFFFF', fontWeight: '700' },
});
