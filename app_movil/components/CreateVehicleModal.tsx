import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { X, Save } from 'lucide-react-native';
import { useThemeStore } from '@/stores/themeStore';
import { useFleetStore } from '@/stores/fleetStore';

export function CreateVehicleModal({ visible, onClose }: Readonly<{ visible: boolean; onClose: () => void }>) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { createVehicle, isSubmitting } = useFleetStore();

  const [patente, setPatente] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidad, setCapacidad] = useState('');
  const [odometro, setOdometro] = useState('');
  const [areaAsignada, setAreaAsignada] = useState('');
  const [conductorId, setConductorId] = useState('');
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');

  useEffect(() => {
    if (!visible) {
      setPatente('');
      setMarca('');
      setModelo('');
      setCapacidad('');
      setOdometro('');
      setAreaAsignada('');
      setConductorId('');
      setLastMaintenanceDate('');
    }
  }, [visible]);

  const handleSave = async () => {
    if (!patente || !capacidad || !odometro) {
      Alert.alert('Faltan datos', 'Completa patente, capacidad y odómetro');
      return;
    }
    try {
      await createVehicle({
        patente: patente.trim(),
        capacidad: Number(capacidad),
        odometro: Number(odometro),
        marca: marca.trim(),
        modelo: modelo.trim(),
        areaAsignada: areaAsignada.trim() || undefined,
        conductorId: conductorId ? Number(conductorId) : undefined,
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate).toISOString() : undefined,
      });
      onClose();
    } catch (e: any) {
      console.error('CreateVehicle error:', e);
      Alert.alert('Error', e?.message ? String(e.message) : 'No se pudo crear el vehículo');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Nuevo Vehículo</Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary }]} disabled={isSubmitting}>
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveText}>{isSubmitting ? 'Guardando...' : 'Guardar'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Patente</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={patente} onChangeText={setPatente} placeholder="ABC-123" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Marca</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={marca} onChangeText={setMarca} placeholder="Mercedes" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Modelo</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={modelo} onChangeText={setModelo} placeholder="Actros" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Área asignada</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={areaAsignada} onChangeText={setAreaAsignada} placeholder="Transporte" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Conductor (ID)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} keyboardType="numeric" value={conductorId} onChangeText={setConductorId} placeholder="123" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Último mantenimiento (YYYY-MM-DD)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={lastMaintenanceDate} onChangeText={setLastMaintenanceDate} placeholder="2025-09-01" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Capacidad (L)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={capacidad} onChangeText={setCapacidad} keyboardType="numeric" placeholder="500" placeholderTextColor={colors.textSecondary} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Odómetro (km)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={odometro} onChangeText={setOdometro} keyboardType="numeric" placeholder="123456" placeholderTextColor={colors.textSecondary} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  iconButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  saveButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  form: { padding: 16, gap: 12 },
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
});
