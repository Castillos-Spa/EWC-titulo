import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Save, Users, Clock, MapPin } from 'lucide-react-native';
import { useCleaningStore } from '../stores/cleaningStore';
import type { CleaningArea } from '../stores/cleaningStore';
import { useAuthStore } from '../stores/authStore';

interface CreateCleaningReportModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

type CrewMember = { id: string; name: string };

export function CreateCleaningReportModal({ visible, onClose }: CreateCleaningReportModalProps) {
  const { createCleaningReport, isSubmitting } = useCleaningStore();
  const { user } = useAuthStore();
  
  const [shift, setShift] = useState<'morning' | 'afternoon' | 'night'>('morning');
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([
    { id: `member-${Date.now()}`, name: user?.name || '' },
  ]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const shifts = [
    { value: 'morning', label: 'Mañana (06:00 - 14:00)' },
    { value: 'afternoon', label: 'Tarde (14:00 - 22:00)' },
    { value: 'night', label: 'Noche (22:00 - 06:00)' },
  ];

  const availableAreas: Pick<CleaningArea, 'id' | 'name' | 'type'>[] = [
    { id: 'area-001', name: 'Oficinas Administrativas', type: 'office' },
    { id: 'area-002', name: 'Baños Planta Baja', type: 'bathroom' },
    { id: 'area-003', name: 'Baños Planta Alta', type: 'bathroom' },
    { id: 'area-004', name: 'Almacén Principal', type: 'warehouse' },
    { id: 'area-005', name: 'Área Exterior', type: 'exterior' },
    { id: 'area-006', name: 'Sala de Reuniones', type: 'common_area' },
  ];

  const handleSubmit = async () => {
    if (selectedAreas.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un área para limpiar');
      return;
    }

    if (crewMembers.filter(member => member.name.trim()).length === 0) {
      Alert.alert('Error', 'Agrega al menos un miembro del equipo');
      return;
    }

    try {
      const areasBase = availableAreas.filter(area => selectedAreas.includes(area.id));
      const defaultEstimatedByType: Record<CleaningArea['type'], number> = {
        office: 60,
        bathroom: 30,
        warehouse: 45,
        exterior: 40,
        common_area: 30,
      };
      const areas: CleaningArea[] = areasBase.map(area => ({
        ...area,
        estimatedTime: defaultEstimatedByType[area.type],
      }));
      const tasks = areas.map(area => ({
        id: `task-${Date.now()}-${area.id}`,
        areaId: area.id,
        description: `Limpieza completa de ${area.name}`,
        completed: false,
        photoRequired: true,
      }));

      await createCleaningReport({
        date: new Date().toISOString().split('T')[0],
        shift,
        crewMembers: crewMembers
          .filter(member => member.name.trim())
          .map(member => member.name),
        areas,
        tasks,
        startTime: new Date().toISOString(),
        status: 'pending',
        photos: [],
        supplies: [],
        incidents: [],
        createdBy: user?.name || 'Usuario',
        notes: notes.trim() || undefined,
      });

      // Reset form
      setShift('morning');
      setCrewMembers([{ id: `member-${Date.now()}`, name: user?.name || '' }]);
      setSelectedAreas([]);
      setNotes('');
      
      onClose();
      Alert.alert('Éxito', 'Parte diario creado correctamente');
    } catch (error) {
      console.error('Error al crear el parte diario de limpieza', error);
      Alert.alert('Error', 'No se pudo crear el parte diario');
    }
  };

  const toggleArea = (areaId: string) => {
    setSelectedAreas(prev => 
      prev.includes(areaId) 
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const addCrewMember = () => {
    const id = `member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCrewMembers(prev => [...prev, { id, name: '' }]);
  };

  const updateCrewMember = (id: string, value: string) => {
    setCrewMembers(prev => prev.map(member => member.id === id ? { ...member, name: value } : member));
  };

  const removeCrewMember = (id: string) => {
    if (crewMembers.length > 1) {
      setCrewMembers(prev => prev.filter(member => member.id !== id));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Parte Diario</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Shift Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Turno de Trabajo</Text>
            <View style={styles.shiftGrid}>
              {shifts.map((shiftOption) => (
                <TouchableOpacity
                  key={shiftOption.value}
                  style={[
                    styles.shiftButton,
                    shift === shiftOption.value && styles.shiftButtonSelected,
                  ]}
                  onPress={() => setShift(shiftOption.value as any)}
                >
                  <Clock size={20} color={shift === shiftOption.value ? '#06B6D4' : '#64748B'} />
                  <Text style={[
                    styles.shiftLabel,
                    shift === shiftOption.value && styles.shiftLabelSelected,
                  ]}>
                    {shiftOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Crew Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Equipo de Trabajo</Text>
            {crewMembers.map((member) => (
              <View key={member.id} style={styles.crewMemberRow}>
                <TextInput
                  style={styles.crewInput}
                  value={member.name}
                  onChangeText={(value) => updateCrewMember(member.id, value)}
                  placeholder="Nombre del trabajador"
                  placeholderTextColor="#94A3B8"
                />
                {crewMembers.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeCrewMember(member.id)}
                  >
                    <X size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addCrewButton} onPress={addCrewMember}>
              <Users size={20} color="#06B6D4" />
              <Text style={styles.addCrewText}>Agregar Trabajador</Text>
            </TouchableOpacity>
          </View>

          {/* Areas Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Áreas a Limpiar</Text>
            <View style={styles.areasGrid}>
              {availableAreas.map((area) => (
                <TouchableOpacity
                  key={area.id}
                  style={[
                    styles.areaCard,
                    selectedAreas.includes(area.id) && styles.areaCardSelected,
                  ]}
                  onPress={() => toggleArea(area.id)}
                >
                  <MapPin size={20} color={selectedAreas.includes(area.id) ? '#06B6D4' : '#64748B'} />
                  <Text style={[
                    styles.areaLabel,
                    selectedAreas.includes(area.id) && styles.areaLabelSelected,
                  ]}>
                    {area.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas Adicionales</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Observaciones, comentarios especiales..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#94A3B8"
              maxLength={300}
            />
            <Text style={styles.charCount}>{notes.length}/300</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creando...' : 'Crear Parte'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  shiftGrid: {
    gap: 12,
  },
  shiftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
  },
  shiftButtonSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#F0F9FF',
  },
  shiftLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  shiftLabelSelected: {
    color: '#06B6D4',
  },
  crewMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  crewInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 56,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
  },
  addCrewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#06B6D4',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    minHeight: 56,
  },
  addCrewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  areaCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    minHeight: 64,
  },
  areaCardSelected: {
    borderColor: '#06B6D4',
    backgroundColor: '#F0F9FF',
  },
  areaLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
    textAlign: 'center',
  },
  areaLabelSelected: {
    color: '#06B6D4',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 56,
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#06B6D4',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});