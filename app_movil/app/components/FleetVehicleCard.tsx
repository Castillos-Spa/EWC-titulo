import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Truck, Gauge, ClipboardList, CheckCircle2 } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import type { VehiculoDto } from '../services/VehiculoApi';

export function FleetVehicleCard({ vehicle, onPress }: { vehicle: VehiculoDto; onPress: () => void }) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const statusColor = (estado: VehiculoDto['estado']) => {
    switch (estado) {
      case 'disponible': return '#16A34A';
      case 'en_mantenimiento': return '#F59E0B';
      case 'inactivo': return '#6B7280';
      case 'en_uso': return '#2563EB';
      default: return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}15` }]}>
          <Truck size={20} color={colors.primary} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{vehicle.patente}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Capacidad: {vehicle.capacidad} L</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusColor(vehicle.estado)}20` }]}>
          <Text style={[styles.statusText, { color: statusColor(vehicle.estado) }]}>{vehicle.estado.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Gauge size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Odómetro: {vehicle.odometro} km</Text>
        </View>
        <View style={styles.metaItem}>
          <ClipboardList size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>ID: {vehicle.id}</Text>
        </View>
        <View style={styles.metaItem}>
          <CheckCircle2 size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>Actualizado: {new Date(vehicle.updatedAt).toLocaleDateString('es-CL')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, padding: 12, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { padding: 8, borderRadius: 10 },
  titleWrap: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12 },
});
