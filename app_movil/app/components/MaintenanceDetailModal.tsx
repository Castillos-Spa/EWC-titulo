import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { X, Save, ClipboardList, UserCheck, CheckCircle2, Trash2, Search } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useMaintenanceStore } from '../stores/maintenanceStore';
import type { OrdenTrabajoDto } from '../services/OrdenTrabajoApi';
import { UserApi } from '../services/UserApi';
import type { AppUser } from '../services/UserApi';

type Props = Readonly<{ ot: OrdenTrabajoDto | null; visible: boolean; onClose: () => void }>;

export function MaintenanceDetailModal({ ot, visible, onClose }: Props) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { planificar, asignar, cerrar, remove } = useMaintenanceStore();

  const [tareasText, setTareasText] = useState('');
  const [responsableId, setResponsableId] = useState('');
  const [checklist, setChecklist] = useState('');
  const [resultado, setResultado] = useState('');
  const [users, setUsers] = useState<{ id: number; username: string }[]>([]);
  const [userQuery, setUserQuery] = useState('');

  const strip = useCallback((s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''), []);
  const isMechanic = useCallback((u: AppUser) => {
    if (!u.roleAssignments || !u.roleAssignments.length) return false;
    return u.roleAssignments.some(r => {
      const role = (r.role || '').toLowerCase();
      const spec = (r.specialty || '').toLowerCase();
      const area = (r.area || '').toLowerCase();
      const norm = (x: string) => strip(x).toLowerCase();
      return role.includes('mechanic') || norm(role).includes('mecanico')
        || norm(spec).includes('mechanic') || norm(spec).includes('mecanico')
        || norm(area).includes('taller');
    });
  }, [strip]);

  useEffect(() => {
    (async () => {
      try {
        const res = await UserApi.list();
        const mechanics = res.filter(isMechanic).map(u => ({ id: u.id, username: u.username }));
        setUsers(mechanics);
      } catch {}
    })();
  }, [isMechanic]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(u => u.username.toLowerCase().includes(q));
  }, [userQuery, users]);

  useEffect(() => {
    if (ot) {
      setTareasText((ot.tareas || []).join('\n'));
      setResponsableId(ot.responsableId ? String(ot.responsableId) : '');
      setChecklist('');
      setResultado('');
    }
  }, [ot]);

  if (!ot) return null;

  const handleSaveTareas = async () => {
    const tareas = tareasText
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean);
    try {
      await planificar(ot.id, tareas);
      Alert.alert('Tareas', 'Tareas planificadas');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo planificar');
    }
  };

  const handleAsignar = async () => {
    if (!responsableId) return;
    try {
      await asignar(ot.id, Number(responsableId));
      Alert.alert('Responsable', 'Responsable asignado');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo asignar');
    }
  };

  const handleCerrar = async () => {
    if (!checklist || !resultado) { Alert.alert('Faltan datos', 'Completa checklist y resultado'); return; }
    try {
      await cerrar(ot.id, checklist, resultado);
      Alert.alert('OT cerrada', 'Se registró QA y se cerró la orden');
      onClose();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo cerrar la OT');
    }
  };

  const handleEliminar = () => {
    Alert.alert('Eliminar OT', '¿Seguro que deseas eliminar esta orden?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => { (async () => { try { await remove(ot.id); onClose(); } catch {} })(); } },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}><X size={24} color={colors.textSecondary} /></TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>OT #{ot.id} · {ot.tipo}</Text>
          <TouchableOpacity onPress={handleEliminar} style={[styles.delButton, { backgroundColor: colors.error }]}>
            <Trash2 size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Estado</Text>
          <Text style={[styles.value, { color: (ot.estado || '').toLowerCase() === 'cerrada' ? colors.success : colors.text }]}>{ot.estado}</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Vehículo</Text>
          <Text style={[styles.value, { color: colors.text }]}>{ot.vehiculo?.patente ?? ot.vehiculoId}</Text>

          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}><ClipboardList size={18} color={colors.text} /> Planificar tareas</Text>
            <TextInput
              multiline
              numberOfLines={6}
              placeholder="1) Revisar fluidos\n2) Cambiar filtro..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.textarea, { borderColor: colors.border, color: colors.text }]}
              value={tareasText}
              onChangeText={setTareasText}
            />
            <TouchableOpacity onPress={handleSaveTareas} style={[styles.btnPrimary, { backgroundColor: colors.primary }]}>
              <Save size={18} color="#FFFFFF" /><Text style={styles.btnPrimaryText}>Guardar tareas</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}><UserCheck size={18} color={colors.text} /> Asignar responsable (solo mecánicos)</Text>
              <TextInput
              placeholder="Buscar mecánico por nombre"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { borderColor: colors.border, color: colors.text, paddingLeft: 36 }]}
                value={userQuery}
                onChangeText={setUserQuery}
              />
              <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
              <ScrollView style={[styles.userList, { borderColor: colors.border }]}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled>
                {filteredUsers.slice(0, 20).map(u => (
                  <TouchableOpacity key={u.id} style={styles.userItem} onPress={() => setResponsableId(String(u.id))}>
                    <Text style={[styles.userName, { color: colors.text }]}>{u.username}</Text>
                    <Text style={[styles.userId, { color: colors.textSecondary }]}>ID: {u.id}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                keyboardType="numeric"
                placeholder="o escribe el ID de mecánico"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, { borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                value={responsableId}
                onChangeText={setResponsableId}
              />
            <TouchableOpacity onPress={handleAsignar} style={[styles.btnPrimary, { backgroundColor: colors.primary }]}>
              <Save size={18} color="#FFFFFF" /><Text style={styles.btnPrimaryText}>Asignar</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}><CheckCircle2 size={18} color={colors.text} /> Cerrar OT y registrar QA</Text>
            <TextInput
              placeholder="Checklist realizado"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={checklist}
              onChangeText={setChecklist}
            />
            <TextInput
              placeholder="Resultado"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              value={resultado}
              onChangeText={setResultado}
            />
            <TouchableOpacity onPress={handleCerrar} style={[styles.btnSuccess, { backgroundColor: colors.success }]}>
              <CheckCircle2 size={18} color="#FFFFFF" /><Text style={styles.btnPrimaryText}>Cerrar OT</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  iconButton: { padding: 8, borderRadius: 10 },
  delButton: { padding: 8, borderRadius: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 8 },
  value: { fontSize: 14, marginTop: 4 },
  section: { paddingTop: 16, borderTopWidth: 1, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 8 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 8, minHeight: 120, textAlignVertical: 'top' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
  btnSuccess: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '700' },
  userList: { borderWidth: 1, borderRadius: 10, marginTop: 8, maxHeight: 160 },
  userItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  userName: { fontSize: 14, fontWeight: '600' },
  userId: { fontSize: 12 },
  searchIcon: { position: 'absolute', left: 24, marginTop: 40 },
});
