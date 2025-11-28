import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { X, Fuel, Gauge, Calendar, User, Receipt } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import type { FuelLogRecord } from '@/stores/fuelStore';

interface FuelDetailModalProps {
  readonly record: FuelLogRecord | null;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function FuelDetailModal({ record, visible, onClose }: FuelDetailModalProps) {
  const { getColors } = useThemeStore();
  const colors = getColors();

  if (!record) {
    return null;
  }

  const date = new Date(record.date);
  const dateLabel = date.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeLabel = date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  const litersLabel = `${record.liters.toFixed(1)} litros`;
  const costLabel = typeof record.cost === 'number' ? `$${record.cost.toLocaleString('es-CL')}` : 'No registrado';

  const openInvoice = () => {
    if (record.invoiceUrl) {
      Linking.openURL(record.invoiceUrl).catch(() => {});
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.card }]} onPress={onClose}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detalle de carga</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.heroCard, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.heroLabel, { color: colors.textSecondary }]}>Volumen registrado</Text>
            <Text style={[styles.heroValue, { color: colors.text }]}>{litersLabel}</Text>
            <Text style={[styles.heroSub, { color: colors.textSecondary }]}>Patente {record.vehiclePlate}</Text>
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}> 
            <InfoRow label="Vehículo" value={formatVehicle(record)} icon={<Fuel size={18} color={colors.primary} />} labelColor={colors.textSecondary} valueColor={colors.text} />
            <InfoRow label="Conductor" value={record.driver?.username ?? 'No asignado'} icon={<User size={18} color={colors.primary} />} labelColor={colors.textSecondary} valueColor={colors.text} />
            <InfoRow label="Kilometraje" value={`${record.odometer.toLocaleString('es-CL')} km`} icon={<Gauge size={18} color={colors.primary} />} labelColor={colors.textSecondary} valueColor={colors.text} />
            <InfoRow label="Fecha" value={`${dateLabel} · ${timeLabel}`} icon={<Calendar size={18} color={colors.primary} />} labelColor={colors.textSecondary} valueColor={colors.text} />
          </View>

          <View style={[styles.section, { backgroundColor: colors.surface }]}> 
            <InfoRow label="Costo" value={costLabel} icon={<Receipt size={18} color={colors.primary} />} labelColor={colors.textSecondary} valueColor={colors.text} />
            {record.invoiceUrl ? (
              <TouchableOpacity style={[styles.linkRow, { borderColor: colors.border }]} onPress={openInvoice}>
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>{record.invoiceUrl}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function formatVehicle(record: FuelLogRecord): string {
  const brand = record.vehicleMarca ?? '';
  const model = record.vehicleModelo ?? '';
  const label = `${brand} ${model}`.trim();
  return label.length > 0 ? label : record.vehiclePlate;
}

interface InfoRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  labelColor: string;
  valueColor: string;
}

function InfoRow({ label, value, icon, labelColor, valueColor }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoCopy}>
        <Text style={[styles.infoLabel, { color: labelColor }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeButton: { padding: 8, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  placeholder: { width: 32 },
  content: { flex: 1, paddingHorizontal: 20 },
  heroCard: {
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 18,
    padding: 20,
    gap: 6,
  },
  heroLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  heroValue: { fontSize: 32, fontWeight: '700' },
  heroSub: { fontSize: 14, fontWeight: '600' },
  section: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
    gap: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.05)',
  },
  infoCopy: { flex: 1 },
  infoLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 16, fontWeight: '600', marginTop: 2 },
  linkRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  linkText: { fontSize: 14, fontWeight: '600' },
});
