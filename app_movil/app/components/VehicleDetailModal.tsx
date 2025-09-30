import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { X, Save, Trash2, Paperclip } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useFleetStore } from '../stores/fleetStore';
import type { VehiculoDto } from '../services/VehiculoApi';

export function VehicleDetailModal({ vehicle, visible, onClose }: { vehicle: VehiculoDto | null; visible: boolean; onClose: () => void }) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { updateVehicle, deleteVehicle, uploadDocument, documentsByVehicle } = useFleetStore();

  const [form, setForm] = useState({ patente: '', capacidad: '', odometro: '', estado: 'disponible' as VehiculoDto['estado'] });
  const [docTipo, setDocTipo] = useState('certificado');
  const [docUrl, setDocUrl] = useState('');
  const [docDesc, setDocDesc] = useState('');

  useEffect(() => {
    if (vehicle) {
      setForm({ patente: vehicle.patente, capacidad: String(vehicle.capacidad), odometro: String(vehicle.odometro), estado: vehicle.estado });
    }
  }, [vehicle]);

  if (!vehicle) return null;

  const handleSave = async () => {
    try {
      await updateVehicle(vehicle.id, { patente: form.patente, capacidad: Number(form.capacidad), odometro: Number(form.odometro), estado: form.estado });
      Alert.alert('Guardado', 'Vehículo actualizado');
    } catch (e: any) {
      console.error('Update vehicle error', e);
      Alert.alert('Error', e?.message || 'No se pudo actualizar');
    }
  };

  const handleDelete = async () => {
    Alert.alert('Eliminar', '¿Seguro que deseas eliminar este vehículo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        try { await deleteVehicle(vehicle.id); onClose(); } catch {}
      } },
    ]);
  };

  const handleAddDoc = async () => {
    if (!docUrl) { Alert.alert('Falta URL', 'Ingresa la URL del documento'); return; }
    try { await uploadDocument(vehicle.id, { tipo: docTipo, url: docUrl, descripcion: docDesc }); setDocUrl(''); setDocDesc(''); Alert.alert('Documento', 'Documento registrado'); } catch {}
  };

  const docs = documentsByVehicle?.[vehicle.id] ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detalle de Vehículo</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={handleSave} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Save size={18} color="#FFFFFF" /><Text style={styles.saveText}>Guardar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[styles.delButton, { backgroundColor: colors.error }]}>
              <Trash2 size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Patente</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={form.patente} onChangeText={(v) => setForm({ ...form, patente: v })} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Capacidad (L)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} keyboardType="numeric" value={form.capacidad} onChangeText={(v) => setForm({ ...form, capacidad: v })} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Odómetro (km)</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.text }]} keyboardType="numeric" value={form.odometro} onChangeText={(v) => setForm({ ...form, odometro: v })} />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Estado</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {(['disponible','en_mantenimiento','inactivo','en_uso'] as const).map(st => (
              <TouchableOpacity key={st} onPress={() => setForm({ ...form, estado: st })} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: form.estado === st ? colors.primary : colors.card }}>
                <Text style={{ color: form.estado === st ? '#FFFFFF' : colors.textSecondary }}>{st.replace('_', ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}><Paperclip size={18} color={colors.text} /> Documentos</Text>
            {/* Registro rápido */}
            <View style={{ gap: 8, marginTop: 8 }}>
              <TextInput placeholder="Tipo (ej: certificado)" placeholderTextColor={colors.textSecondary} style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={docTipo} onChangeText={setDocTipo} />
              <TextInput placeholder="URL del documento" placeholderTextColor={colors.textSecondary} style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={docUrl} onChangeText={setDocUrl} />
              <TextInput placeholder="Descripción (opcional)" placeholderTextColor={colors.textSecondary} style={[styles.input, { borderColor: colors.border, color: colors.text }]} value={docDesc} onChangeText={setDocDesc} />
              <TouchableOpacity onPress={handleAddDoc} style={[styles.saveButton, { backgroundColor: colors.success, alignSelf: 'flex-start' }]}><Text style={styles.saveText}>Agregar Documento</Text></TouchableOpacity>
            </View>

            {/* Lista */}
            {docs.length > 0 && (
              <View style={{ marginTop: 12, gap: 8 }}>
                {docs.map((d) => (
                  <View key={`${d.tipo}-${d.url}-${d.fechaSubida ?? ''}`} style={[styles.docItem, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    <Text style={{ color: colors.text, fontWeight: '700' }}>{d.tipo}</Text>
                    <Text style={{ color: colors.textSecondary }} numberOfLines={1}>{d.url}</Text>
                    {d.descripcion && <Text style={{ color: colors.textSecondary }}>{d.descripcion}</Text>}
                    {d.fechaSubida && <Text style={{ color: colors.textSecondary }}>Subido: {new Date(d.fechaSubida).toLocaleString('es-CL')}</Text>}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
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
  delButton: { padding: 8, borderRadius: 10 },
  saveText: { color: '#FFFFFF', fontWeight: '700' },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  section: { paddingTop: 16, borderTopWidth: 1, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', flexDirection: 'row', alignItems: 'center', gap: 8 },
  docItem: { borderWidth: 1, borderRadius: 10, padding: 10 },
});
