import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { Bell, X, Send } from 'lucide-react-native';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreate: (payload: { title: string; message: string; priority: 'low' | 'normal' | 'high'; target: { scope: 'global' | 'areas'; areas?: string[] } }) => Promise<void>;
};

export function CreateNotificationModal({ visible, onClose, onCreate }: Readonly<Props>) {
  const { getColors } = useThemeStore();
  const colors = getColors();
  const { user } = useAuthStore();

  const availableAreas = useMemo(() => user?.areaIds ?? [], [user?.areaIds]);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');
  const [target, setTarget] = useState<'global' | 'areas'>('global');
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = title.trim().length > 0 && message.trim().length > 0 && (target === 'global' || selectedAreas.length > 0);

  const toggleArea = (id: string) => {
    setSelectedAreas((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await onCreate({
        title: title.trim(),
        message: message.trim(),
        priority,
        target: target === 'areas' ? { scope: 'areas', areas: selectedAreas } : { scope: 'global' },
      });
      // limpiar y cerrar
      setTitle('');
      setMessage('');
      setPriority('normal');
      setTarget('global');
      setSelectedAreas([]);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <Bell size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Nueva notificación</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Cerrar">
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 12 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Título</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, marginBottom: 12 }]}
              placeholder="Título de la notificación"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Prioridad</Text>
            <View style={styles.row}>
              {[
                { v: 'low', l: 'Baja' },
                { v: 'normal', l: 'Normal' },
                { v: 'high', l: 'Alta' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.v}
                  style={[styles.chip, priority === opt.v && [styles.chipActive, { backgroundColor: colors.primary }]]}
                  onPress={() => setPriority(opt.v as any)}
                >
                  <Text style={[styles.chipText, priority === opt.v && styles.chipTextActive]}>{opt.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Destino</Text>
            <View style={styles.row}>
              {[
                { v: 'global', l: 'Global' },
                { v: 'areas', l: 'Áreas' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.v}
                  style={[styles.chip, target === opt.v && [styles.chipActive, { backgroundColor: colors.primary }]]}
                  onPress={() => setTarget(opt.v as any)}
                >
                  <Text style={[styles.chipText, target === opt.v && styles.chipTextActive]}>{opt.l}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {target === 'areas' && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Selecciona áreas</Text>
                <View style={styles.rowWrap}>
                  {availableAreas.length === 0 ? (
                    <Text style={{ color: colors.textSecondary }}>No tienes áreas asignadas</Text>
                  ) : (
                    availableAreas.map((a) => (
                      <TouchableOpacity
                        key={a}
                        style={[styles.chip, selectedAreas.includes(a) && [styles.chipActive, { backgroundColor: colors.primary }]]}
                        onPress={() => toggleArea(a)}
                      >
                        <Text style={[styles.chipText, selectedAreas.includes(a) && styles.chipTextActive]}>{a}</Text>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            )}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Mensaje</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholder="Escribe el mensaje..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={Platform.select({ ios: 4, android: 4 })}
              maxLength={300}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={onClose} disabled={submitting}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: canSubmit ? colors.primary : '#CBD5E1' }]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              <Send size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>{submitting ? 'Enviando...' : 'Enviar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 },
  modal: { borderWidth: 1, borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 8, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#F1F5F9' },
  chipActive: { },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  chipTextActive: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
  cancelText: { fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#FFFFFF', fontWeight: '700' },
});
