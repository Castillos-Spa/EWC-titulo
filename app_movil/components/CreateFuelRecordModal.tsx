import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, Fuel, Gauge, Save, DollarSign, Car, Link2, X } from 'lucide-react-native';
import { useFuelStore } from '@/stores/fuelStore';
import { useThemeStore } from '@/stores/themeStore';

interface VehicleOption {
  id: number;
  plate: string;
  label?: string;
}

interface CreateFuelRecordModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly vehicleId?: number;
  readonly vehiclePlate?: string;
  readonly availableVehicles?: VehicleOption[];
}

export function CreateFuelRecordModal({ visible, onClose, vehicleId, vehiclePlate, availableVehicles = [] }: CreateFuelRecordModalProps) {
  const { createFuelRecord, isSubmitting } = useFuelStore();
  const { getColors } = useThemeStore();
  const colors = getColors();

  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(vehicleId ?? null);
  const [liters, setLiters] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [dateValue, setDateValue] = useState(new Date().toISOString());

  useEffect(() => {
    if (visible) {
      setSelectedVehicleId(vehicleId ?? availableVehicles[0]?.id ?? null);
      setLiters('');
      setOdometer('');
      setCost('');
      setInvoiceUrl('');
      setDateValue(new Date().toISOString());
    }
  }, [visible, vehicleId, availableVehicles]);

  const vehicleDisplay = useMemo(() => {
    const option = availableVehicles.find((opt) => opt.id === selectedVehicleId);
    if (option) {
      return `${option.plate}${option.label ? ` • ${option.label}` : ''}`;
    }
    if (vehicleId && vehiclePlate) return vehiclePlate;
    return 'Selecciona un vehículo';
  }, [availableVehicles, selectedVehicleId, vehicleId, vehiclePlate]);

  const handleSubmit = async () => {
    if (!selectedVehicleId) {
      Alert.alert('Selecciona un vehículo', 'Necesitas elegir a qué vehículo pertenece este registro.');
      return;
    }

    const litersValue = Number.parseFloat(liters);
    if (!Number.isFinite(litersValue) || litersValue <= 0) {
      Alert.alert('Dato incompleto', 'Ingresa la cantidad de litros cargados.');
      return;
    }

    const odometerValue = Number.parseInt(odometer, 10);
    if (!Number.isFinite(odometerValue) || odometerValue <= 0) {
      Alert.alert('Dato incompleto', 'Ingresa el kilometraje al momento de la carga.');
      return;
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      Alert.alert('Fecha inválida', 'Usa un formato de fecha válido (ISO 8601).');
      return;
    }

    try {
      await createFuelRecord({
        vehiculoId: selectedVehicleId,
        liters: litersValue,
        odometer: odometerValue,
        date: date.toISOString(),
        cost: cost.trim() ? Number.parseFloat(cost) : undefined,
        invoiceUrl: invoiceUrl.trim() || undefined,
      });
      onClose();
      Alert.alert('Registro guardado', 'La carga se registró correctamente.');
    } catch (error) {
      console.error('createFuelRecord', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.card }]} onPress={onClose}>
            <X size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Registrar combustible</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Vehículo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.vehicleRow}>
                {availableVehicles.map((option) => {
                  const active = option.id === selectedVehicleId;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setSelectedVehicleId(option.id)}
                      style={[styles.vehicleChip, { borderColor: colors.border }, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    >
                      <Car size={16} color={active ? '#FFFFFF' : colors.textSecondary} />
                      <Text style={[styles.vehicleChipText, { color: active ? '#FFFFFF' : colors.textSecondary }]}>
                        {option.plate}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
            <View style={[styles.previewCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Fuel size={18} color={colors.primary} />
              <Text style={[styles.previewText, { color: colors.text }]}>{vehicleDisplay}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Fecha y hora</Text>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Calendar size={18} color={colors.textSecondary} />
              <TextInput
                value={dateValue}
                onChangeText={setDateValue}
                placeholder="YYYY-MM-DDTHH:mm:ssZ"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputField, { color: colors.text }]}
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}> 
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Litros cargados</Text>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Fuel size={18} color={colors.textSecondary} />
              <TextInput
                value={liters}
                onChangeText={setLiters}
                placeholder="Ej: 120.5"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputField, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={styles.section}> 
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Kilometraje</Text>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Gauge size={18} color={colors.textSecondary} />
              <TextInput
                value={odometer}
                onChangeText={setOdometer}
                placeholder="Ej: 152000"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputField, { color: colors.text }]}
              />
              <Text style={[styles.inputSuffix, { color: colors.textSecondary }]}>km</Text>
            </View>
          </View>

          <View style={styles.section}> 
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Costo (opcional)</Text>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <DollarSign size={18} color={colors.textSecondary} />
              <TextInput
                value={cost}
                onChangeText={setCost}
                placeholder="Ej: 45000"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputField, { color: colors.text }]}
              />
            </View>
          </View>

          <View style={styles.section}> 
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Link a factura (opcional)</Text>
            <View style={[styles.inputWithIcon, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Link2 size={18} color={colors.textSecondary} />
              <TextInput
                value={invoiceUrl}
                onChangeText={setInvoiceUrl}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                style={[styles.inputField, { color: colors.text }]}
                autoCapitalize="none"
              />
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}> 
          <TouchableOpacity style={[styles.primaryButton, { backgroundColor: colors.primary }, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{isSubmitting ? 'Guardando…' : 'Guardar registro'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconButton: { padding: 8, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  placeholder: { width: 24 },
  content: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 16, gap: 10 },
  sectionLabel: { fontSize: 13, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  vehicleRow: { flexDirection: 'row', gap: 8 },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  vehicleChipText: { fontSize: 13, fontWeight: '600' },
  previewCard: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewText: { fontSize: 14, fontWeight: '600' },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  inputField: { flex: 1, fontSize: 15, fontWeight: '600' },
  inputSuffix: { fontSize: 13, fontWeight: '600' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    paddingVertical: 14,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },
});
