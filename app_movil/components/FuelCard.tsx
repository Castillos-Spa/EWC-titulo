import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar, Fuel, Gauge, Receipt, User } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { FuelLogRecord } from '@/stores/fuelStore';

interface FuelCardProps {
  readonly record: FuelLogRecord;
  readonly onPress?: () => void;
}

export function FuelCard({ record, onPress }: FuelCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const date = new Date(record.date);
  const liters = `${record.liters.toFixed(1)} L`;
  const dateLabel = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.plateColumn}>
          <Text style={[styles.plate, { color: colors.text }]}>{record.vehiclePlate}</Text>
          <Text style={[styles.subtle, { color: colors.textSecondary }]}>
            {record.vehicleMarca || record.vehicleModelo ? `${record.vehicleMarca ?? ''} ${record.vehicleModelo ?? ''}`.trim() : 'Vehículo corporativo'}
          </Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={[styles.amount, { color: colors.text }]}>{liters}</Text>
          <Text style={[styles.subtle, { color: colors.textSecondary }]}>Registrados</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Fuel size={18} color={colors.primary} />
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Odómetro</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{record.odometer.toLocaleString('es-CL')} km</Text>
        </View>
        <View style={styles.metaItem}>
          <Calendar size={18} color={colors.primary} />
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Fecha</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{dateLabel} · {timeLabel}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <User size={18} color={colors.primary} />
          <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Conductor</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{record.driver?.username ?? 'No asignado'}</Text>
        </View>
        {typeof record.cost === 'number' && (
          <View style={styles.metaItem}>
            <Receipt size={18} color={colors.primary} />
            <Text style={[styles.metaLabel, { color: colors.textSecondary }]}>Costo</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              ${record.cost.toLocaleString('es-CL')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footerRow}>
        <View style={[styles.badge, { backgroundColor: `${colors.primary}15` }]}> 
          <Gauge size={14} color={colors.primary} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>Registro oficial</Text>
        </View>
        {record.invoiceUrl ? (
          <Text style={[styles.link, { color: colors.primary }]} numberOfLines={1}>
            {record.invoiceUrl}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  plateColumn: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  plate: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  amountBadge: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 22,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    backgroundColor: 'rgba(15,23,42,0.03)',
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  link: {
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },
});