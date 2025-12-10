import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';
import { useMaintenanceStore } from '@/stores/maintenanceStore';
import { useFleetStore } from '@/stores/fleetStore';
import { Wrench, Plus, RefreshCw, CheckCircle2, AlertTriangle, Clock, Filter } from 'lucide-react-native';
import { AccessGuard } from '@/components/AccessGuard';
import { MaintenanceDetailModal } from '@/components/MaintenanceDetailModal';
import { useAuthz } from '@/hooks/useAuthz';

export default function MaintenanceScreen() {
  const { canFuel } = useAuthz(); // usar permiso de flota/mantenimiento
  const { getColors } = useThemeStore();
  const colors = getColors();
  const insets = useSafeAreaInsets();
  const { items, loading, loadAll, create, setCurrent, current } = useMaintenanceStore();
  const { vehicles, loadVehicles } = useFleetStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newVehiculoId, setNewVehiculoId] = useState('');
  const [newTipo, setNewTipo] = useState('Preventivo');
  const [filterStatus, setFilterStatus] = useState<'all' | 'abierta' | 'Cerrada'>('all');
  const [filterTipo, setFilterTipo] = useState<'all' | 'Preventivo' | 'Correctivo' | 'Emergencia'>('all');

  useEffect(() => { void loadAll(); void loadVehicles(); }, [loadAll, loadVehicles]);
  // (Selector de responsables se maneja dentro del modal de detalle)

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadAll(), loadVehicles()]);
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const status = (i.estado || '').toLowerCase();
      let byStatus = true;
      if (filterStatus !== 'all') {
        const isClosed = status === 'cerrada';
        byStatus = filterStatus === 'Cerrada' ? isClosed : !isClosed;
      }
      const byTipo = filterTipo === 'all' ? true : i.tipo?.toLowerCase() === filterTipo.toLowerCase();
      return byStatus && byTipo;
    });
  }, [items, filterStatus, filterTipo]);

  const kpis = useMemo(() => {
    const total = filteredItems.length;
    const abiertas = filteredItems.filter(i => (i.estado || '').toLowerCase() !== 'cerrada').length;
    const cerradas = filteredItems.filter(i => (i.estado || '').toLowerCase() === 'cerrada').length;
    const pendientes = filteredItems.filter(i => (i.tareas || []).length === 0).length;
    return { total, abiertas, cerradas, pendientes };
  }, [filteredItems]);

  return (
    <AccessGuard allowed={canFuel}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              <Wrench size={28} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Mantenimiento</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} onPress={() => onRefresh()}>
                <RefreshCw size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Nueva OT</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.stat}><Text style={[styles.statValue, { color: colors.text }]}>{kpis.total}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text></View>
            <View style={styles.stat}><Clock size={16} color={colors.primary} /><Text style={[styles.statValueSm, { color: colors.text }]}>{kpis.abiertas}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Abiertas</Text></View>
            <View style={styles.stat}><CheckCircle2 size={16} color={colors.success} /><Text style={[styles.statValueSm, { color: colors.text }]}>{kpis.cerradas}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Cerradas</Text></View>
            <View style={styles.stat}><AlertTriangle size={16} color={colors.warning} /><Text style={[styles.statValueSm, { color: colors.text }]}>{kpis.pendientes}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sin tareas</Text></View>
          </View>
          {/* Filtros */}
          <View style={[styles.filters, { borderBottomColor: colors.border }]}>
            <View style={styles.filterGroup}>
              <Filter size={16} color={colors.textSecondary} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {(['all','abierta','Cerrada'] as const).map(v => (
                    <TouchableOpacity key={v} style={[styles.filterBtn, filterStatus === v && [styles.filterBtnActive, { backgroundColor: colors.primary }]]} onPress={() => setFilterStatus(v)}>
                      <Text style={[styles.filterBtnText, filterStatus === v && styles.filterBtnTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
            <View style={styles.filterGroup}>
              <Filter size={16} color={colors.textSecondary} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.filterRow}>
                  {(['all','Preventivo','Correctivo','Emergencia'] as const).map(v => (
                    <TouchableOpacity key={v} style={[styles.filterBtn, filterTipo === v && [styles.filterBtnActive, { backgroundColor: colors.primary }]]} onPress={() => setFilterTipo(v)}>
                      <Text style={[styles.filterBtnText, filterTipo === v && styles.filterBtnTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}
        > 
          {filteredItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Wrench size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Sin órdenes</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Crea tu primera orden de trabajo</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={() => setShowCreate(true)}>
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Nueva OT</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredItems.map(ot => (
              <TouchableOpacity key={ot.id} style={[styles.card, { backgroundColor: colors.surface }]} onPress={() => setCurrent(ot)}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>OT #{ot.id} · {ot.tipo}</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>Vehículo: {ot.vehiculo?.patente ?? ot.vehiculoId}</Text>
                  </View>
                  <Text style={[styles.status, { color: (ot.estado || '').toLowerCase() === 'cerrada' ? colors.success : colors.primary }]}>{ot.estado}</Text>
                </View>
                {ot.tareas?.length ? (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>Tareas: {ot.tareas.length}</Text>
                ) : (
                  <Text style={[styles.cardBody, { color: colors.textSecondary }]}>Sin tareas planificadas</Text>
                )}
              </TouchableOpacity>
            ))
          )}
  </ScrollView>

  <MaintenanceDetailModal ot={current} visible={!!current} onClose={() => setCurrent(null)} />

        {/* Modal simple de creación inline (rápido) */}
        {showCreate && (
          <View style={styles.modalBackdrop}>
            <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nueva Orden de Trabajo</Text>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Vehículo</Text>
              <ScrollView style={{ maxHeight: 160 }}>
                {vehicles.map(v => (
                  <TouchableOpacity key={v.id} style={[styles.listItem, { borderColor: colors.border }]} onPress={() => setNewVehiculoId(String(v.id))}>
                    <Text style={{ color: colors.text }}>{v.patente} · {v.marca ?? ''} {v.modelo ?? ''}</Text>
                    {String(v.id) === newVehiculoId && <Text style={{ color: colors.primary }}>Seleccionado</Text>}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Tipo</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={styles.filterRow}>
                  {(['Preventivo','Correctivo','Emergencia'] as const).map(v => (
                    <TouchableOpacity key={v} style={[styles.filterBtn, newTipo === v && [styles.filterBtnActive, { backgroundColor: colors.primary }]]} onPress={() => setNewTipo(v)}>
                      <Text style={[styles.filterBtnText, newTipo === v && styles.filterBtnTextActive]}>{v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.btn, { borderColor: colors.border }]} onPress={() => setShowCreate(false)}><Text style={{ color: colors.textSecondary }}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnFilled, { backgroundColor: colors.primary }]}
                  onPress={async () => {
                    if (!newVehiculoId) return;
                    await create({ vehiculoId: Number(newVehiculoId), tipo: newTipo });
                    setShowCreate(false);
                    setNewVehiculoId('');
                  }}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </AccessGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 10, borderRadius: 8 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  addButtonText: { color: '#FFFFFF', fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  stat: { alignItems: 'center', gap: 2, flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statValueSm: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  filters: { borderBottomWidth: 1, paddingVertical: 8 },
  filterGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#E5E7EB' },
  filterBtnActive: { },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  filterBtnTextActive: { color: '#FFFFFF' },
  content: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 13 },
  card: { borderRadius: 12, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 12 },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  cardBody: { fontSize: 12, marginTop: 8 },
  modalBackdrop: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modal: { borderWidth: 1, borderRadius: 12, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  btn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  btnFilled: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  listItem: { paddingVertical: 10, borderBottomWidth: 1 },
});
