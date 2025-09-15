import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, MapPin, Clock, Receipt, Gauge } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';

interface FuelRecordLocation {
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface FuelRecord {
  id: string;
  type: 'refuel' | 'consumption';
  vehiclePlate: string;
  amount: number; // litros
  odometer: number; // km
  stationName?: string;
  location?: FuelRecordLocation;
  recordedAt: string; // ISO date
  receiptPhoto?: string | null;
  notes?: string | null;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

interface FuelCardProps {
  record: FuelRecord;
  onPress: () => void;
}

export function FuelCard({ record, onPress }: FuelCardProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  const getTypeColor = (type: string) => {
    return type === 'refuel' ? '#16A34A' : '#2563EB';
  };

  const getTypeIcon = (type: string) => {
    return type === 'refuel' ? TrendingUp : TrendingDown;
  };

  const getTypeLabel = (type: string) => {
    return type === 'refuel' ? 'Reabastecimiento' : 'Consumo';
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const typeColor = getTypeColor(record.type);
  const TypeIcon = getTypeIcon(record.type);
  const { date, time } = formatDateTime(record.recordedAt);

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface }]} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.typeSection}>
          <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15` }]}>
            <TypeIcon size={16} color={typeColor} />
            <Text style={[styles.typeText, { color: typeColor }]}>
              {getTypeLabel(record.type)}
            </Text>
          </View>
          <Text style={[styles.vehicleText, { color: colors.text }]}>{record.vehiclePlate}</Text>
        </View>
        
        <View style={styles.amountSection}>
          <Text style={[styles.amountValue, { color: colors.text }]}>{typeof record.amount === 'number' ? record.amount.toFixed(1) : '-'}</Text>
          <Text style={[styles.amountUnit, { color: colors.textSecondary }]}>L</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Odometer */}
        <View style={styles.odometerSection}>
          <Gauge size={16} color="#64748B" />
          <Text style={[styles.odometerText, { color: colors.textSecondary }]}>
            {typeof record.odometer === 'number' ? `${record.odometer.toLocaleString()} km` : '—'}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.locationSection}>
          <MapPin size={16} color="#64748B" />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {record.stationName || record.location?.address || 'Ubicación GPS'}
          </Text>
        </View>

        {/* Time */}
        <View style={styles.timeSection}>
          <Clock size={16} color="#64748B" />
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>{date} • {time}</Text>
        </View>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          {record.receiptPhoto && (
            <View style={styles.receiptIndicator}>
              <Receipt size={14} color="#16A34A" />
              <Text style={styles.receiptText}>Recibo</Text>
            </View>
          )}
          {record.notes && (
            <View style={styles.notesIndicator}>
              <Text style={styles.notesText}>Notas</Text>
            </View>
          )}
        </View>
      </View>

      {/* Sync Status Indicator */}
      {record.syncStatus === 'pending' && (
        <View style={styles.syncIndicator}>
          <View style={styles.syncDot} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  typeSection: {
    flex: 1,
    minWidth: 0, // Allow flex shrinking
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
    flexShrink: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    flexShrink: 1,
  },
  amountSection: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
  },
  amountUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  odometerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  odometerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    color: '#64748B',
  },
  additionalInfo: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  receiptIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
  },
  receiptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  notesIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  notesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  syncIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});