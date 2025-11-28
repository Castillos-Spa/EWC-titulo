import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Truck, Gauge, ClipboardList, CalendarClock, UserRound, Fuel } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { VehiculoDto } from '@/services/VehiculoApi';

function getStatusMeta(estado: VehiculoDto['estado']) {
  switch (estado) {
    case 'disponible':
      return { label: 'Disponible', tone: '#16A34A' };
    case 'en_mantenimiento':
      return { label: 'Mantención', tone: '#F59E0B' };
    case 'en_uso':
      return { label: 'En uso', tone: '#2563EB' };
    case 'inactivo':
    default:
      return { label: 'Inactivo', tone: '#6B7280' };
  }
}

export function FleetVehicleCard({ vehicle, onPress }: Readonly<{ vehicle: VehiculoDto; onPress: () => void }>) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const lastMaintenance = useMemo(() => {
    if (!vehicle.lastMaintenanceDate) return 'Sin registro';
    const date = new Date(vehicle.lastMaintenanceDate);
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' });
  }, [vehicle.lastMaintenanceDate]);

  const statusMeta = getStatusMeta(vehicle.estado);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
          <Truck size={22} color={colors.primary} />
        </View>
        <View style={styles.titleWrap}>
          <Text style={[styles.title, { color: colors.text }]}>{vehicle.patente}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {[(vehicle.marca ?? '').trim(), (vehicle.modelo ?? '').trim()].filter(Boolean).join(' · ') || 'Sin descripción'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusMeta.tone}20` }]}>
          <Text style={[styles.statusText, { color: statusMeta.tone }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Gauge size={16} color={colors.textSecondary} />
          <View>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Odómetro</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{vehicle.odometro.toLocaleString('es-CL')} km</Text>
          </View>
        </View>
        <View style={styles.metaItem}>
          <Fuel size={16} color={colors.textSecondary} />
          <View>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Capacidad</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{vehicle.capacidad} L</Text>
          </View>
        </View>
        <View style={styles.metaItem}>
          <CalendarClock size={16} color={colors.textSecondary} />
          <View>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Última mantención</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{lastMaintenance}</Text>
          </View>
        </View>
        <View style={styles.metaItem}>
          <UserRound size={16} color={colors.textSecondary} />
          <View>
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Conductor asignado</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>{vehicle.conductorId ? `ID ${vehicle.conductorId}` : 'Sin asignar'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <ClipboardList size={14} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>ID interno #{vehicle.id}</Text>
        </View>
        <View style={styles.footerItem}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Actualizado {new Date(vehicle.updatedAt).toLocaleDateString('es-CL')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { padding: 10, borderRadius: 12 },
  titleWrap: { flex: 1 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  metaGrid: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexBasis: '48%',
  },
  metaLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
  metaValue: { fontSize: 14, fontWeight: '600' },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12 },
});
