import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, RefreshCw, Plus, Wrench, CheckCircle2 } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useFleetStore } from '../stores/fleetStore';
import { FleetVehicleCard } from '../components/FleetVehicleCard';
import { VehicleDetailModal } from '../components/VehicleDetailModal';
import { CreateVehicleModal } from '../components/CreateVehicleModal';
import { AccessGuard } from '../components/AccessGuard';
import { useAuthz } from '@/hooks/useAuthz';

export default function FleetScreen() {
  const { canFuel } = useAuthz(); // Reusar permiso de flota/combustible
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { vehicles, isLoading, error, loadVehicles, setCurrentVehicle, clearError, currentVehicle } = useFleetStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { void loadVehicles(); }, [loadVehicles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVehicles();
    setRefreshing(false);
  };

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Truck size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={clearError}>
            <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AccessGuard allowed={canFuel}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.headerTop}>
            <View style={styles.headerTitle}>
              <Truck size={28} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Registro de Flota</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} onPress={() => onRefresh()}>
                <RefreshCw size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => setShowCreate(true)}>
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Nuevo</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
            <View style={styles.stat}><Text style={[styles.statValue, { color: colors.text }]}>{vehicles.length}</Text><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vehículos</Text></View>
            <View style={styles.stat}><Wrench size={16} color={colors.warning} /><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Mantenimiento</Text></View>
            <View style={styles.stat}><CheckCircle2 size={16} color={colors.success} /><Text style={[styles.statLabel, { color: colors.textSecondary }]}>Disponibles</Text></View>
          </View>
        </View>

        {/* List */}
        <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} />}> 
          {vehicles.length === 0 ? (
            <View style={styles.emptyState}>
              <Truck size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>Sin vehículos</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Crea tu primer vehículo para comenzar</Text>
              <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary, marginTop: 12 }]} onPress={() => setShowCreate(true)}>
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Agregar Vehículo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            vehicles.map(v => (
              <FleetVehicleCard key={v.id} vehicle={v} onPress={() => setCurrentVehicle(v)} />
            ))
          )}
        </ScrollView>

        <CreateVehicleModal visible={showCreate} onClose={() => setShowCreate(false)} />
        <VehicleDetailModal vehicle={currentVehicle} visible={!!currentVehicle} onClose={() => setCurrentVehicle(null)} />
      </SafeAreaView>
    </AccessGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { fontWeight: '700' },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 10, borderRadius: 8 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  addButtonText: { color: '#FFFFFF', fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  stat: { alignItems: 'center', gap: 4, flex: 1 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12, fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptySubtitle: { fontSize: 13 },
});
