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
  Platform,
} from 'react-native';
import { X, Save, Monitor, Smartphone, Wifi, Mail, Phone, Printer, TriangleAlert as AlertTriangle, MapPin, Users, Plus, Minus } from 'lucide-react-native';
import { useITSupportStore } from '../stores/itSupportStore';
import { useAuthStore } from '../stores/authStore';

interface CreateITTicketModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateITTicketModal({ visible, onClose }: CreateITTicketModalProps) {
  const { createITTicket, isSubmitting } = useITSupportStore();
  const { user } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [reportedBy, setReportedBy] = useState(user?.name || '');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState('');
  const [office, setOffice] = useState('');
  const [affectedUsers, setAffectedUsers] = useState<string[]>([]);
  const [newUser, setNewUser] = useState('');

  const categories = [
    { value: 'hardware', label: 'Hardware', icon: Monitor, color: '#2563EB' },
    { value: 'software', label: 'Software', icon: Smartphone, color: '#16A34A' },
    { value: 'network', label: 'Red/Internet', icon: Wifi, color: '#F59E0B' },
    { value: 'email', label: 'Email', icon: Mail, color: '#8B5CF6' },
    { value: 'phone', label: 'Teléfono', icon: Phone, color: '#EF4444' },
    { value: 'printer', label: 'Impresora', icon: Printer, color: '#6B7280' },
    { value: 'other', label: 'Otro', icon: AlertTriangle, color: '#EC4899' },
  ];

  const priorities = [
    { value: 'low', label: 'Baja', description: 'No afecta operaciones', color: '#16A34A' },
    { value: 'medium', label: 'Media', description: 'Afecta parcialmente', color: '#F59E0B' },
    { value: 'high', label: 'Alta', description: 'Afecta operaciones críticas', color: '#EF4444' },
    { value: 'urgent', label: 'Urgente', description: 'Detiene operaciones', color: '#DC2626' },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'La descripción es obligatoria');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Selecciona una categoría');
      return;
    }

    if (!priority) {
      Alert.alert('Error', 'Selecciona una prioridad');
      return;
    }

    if (!building.trim()) {
      Alert.alert('Error', 'El edificio es obligatorio');
      return;
    }

    try {
      await createITTicket({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        status: 'open',
        reportedBy: reportedBy.trim() || 'Usuario',
        location: {
          building: building.trim(),
          floor: floor.trim() || undefined,
          office: office.trim() || undefined,
        },
        affectedUsers: affectedUsers.filter(u => u.trim()),
        attachments: [],
      });

      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('');
      setBuilding('');
      setFloor('');
      setOffice('');
      setAffectedUsers([]);
      setNewUser('');
      
      onClose();
      Alert.alert('Éxito', 'Ticket TIC creado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el ticket');
    }
  };

  const addUser = () => {
    if (newUser.trim() && !affectedUsers.includes(newUser.trim())) {
      setAffectedUsers(prev => [...prev, newUser.trim()]);
      setNewUser('');
    }
  };

  const removeUser = (userToRemove: string) => {
    setAffectedUsers(prev => prev.filter(u => u !== userToRemove));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Crear Ticket TIC</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Básica</Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Título del Problema *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Impresora no funciona en oficina contabilidad"
                placeholderTextColor="#94A3B8"
                maxLength={100}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Descripción Detallada *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe el problema con el mayor detalle posible..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Reportado por</Text>
              <TextInput
                style={styles.input}
                value={reportedBy}
                onChangeText={setReportedBy}
                placeholder="Tu nombre"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoría del Problema *</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.categoryCard,
                      category === cat.value && [styles.categoryCardSelected, { borderColor: cat.color }],
                    ]}
                    onPress={() => setCategory(cat.value)}
                  >
                    <IconComponent size={24} color={category === cat.value ? cat.color : '#64748B'} />
                    <Text style={[
                      styles.categoryLabel,
                      category === cat.value && { color: cat.color, fontWeight: '700' },
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nivel de Prioridad *</Text>
            <View style={styles.priorityList}>
              {priorities.map((prio) => (
                <TouchableOpacity
                  key={prio.value}
                  style={[
                    styles.priorityCard,
                    { borderColor: prio.color },
                    priority === prio.value && { backgroundColor: `${prio.color}15` },
                  ]}
                  onPress={() => setPriority(prio.value)}
                >
                  <View style={styles.priorityHeader}>
                    <Text style={[styles.priorityLabel, { color: prio.color }]}>
                      {prio.label}
                    </Text>
                    {priority === prio.value && (
                      <View style={[styles.selectedIndicator, { backgroundColor: prio.color }]} />
                    )}
                  </View>
                  <Text style={styles.priorityDescription}>{prio.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <MapPin size={16} color="#374151" /> Ubicación *
            </Text>
            
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Edificio *</Text>
              <TextInput
                style={styles.input}
                value={building}
                onChangeText={setBuilding}
                placeholder="Ej: Edificio Principal"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.locationRow}>
              <View style={styles.locationField}>
                <Text style={styles.fieldLabel}>Piso</Text>
                <TextInput
                  style={styles.input}
                  value={floor}
                  onChangeText={setFloor}
                  placeholder="Ej: 2do Piso"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              
              <View style={styles.locationField}>
                <Text style={styles.fieldLabel}>Oficina</Text>
                <TextInput
                  style={styles.input}
                  value={office}
                  onChangeText={setOffice}
                  placeholder="Ej: Contabilidad"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* Affected Users */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Users size={16} color="#374151" /> Usuarios Afectados
            </Text>
            
            <View style={styles.userInputRow}>
              <TextInput
                style={[styles.input, styles.userInput]}
                value={newUser}
                onChangeText={setNewUser}
                placeholder="Nombre del usuario afectado"
                placeholderTextColor="#94A3B8"
                onSubmitEditing={addUser}
                returnKeyType="done"
              />
              <TouchableOpacity 
                style={[styles.addUserButton, !newUser.trim() && styles.addUserButtonDisabled]}
                onPress={addUser}
                disabled={!newUser.trim()}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {affectedUsers.length > 0 && (
              <View style={styles.usersList}>
                {affectedUsers.map((userName, index) => (
                  <View key={index} style={styles.userTag}>
                    <Text style={styles.userTagText}>{userName}</Text>
                    <TouchableOpacity
                      style={styles.removeUserButton}
                      onPress={() => removeUser(userName)}
                    >
                      <Minus size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
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
              {isSubmitting ? 'Creando...' : 'Crear Ticket'}
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
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  field: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
    gap: 8,
  },
  categoryCardSelected: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  priorityList: {
    gap: 12,
  },
  priorityCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 72,
  },
  priorityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  priorityLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
  },
  locationField: {
    flex: 1,
  },
  userInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  userInput: {
    flex: 1,
  },
  addUserButton: {
    backgroundColor: '#8B5CF6',
    padding: 16,
    borderRadius: 12,
    minWidth: 56,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addUserButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  usersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  userTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  userTagText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  removeUserButton: {
    padding: 2,
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
    backgroundColor: '#8B5CF6',
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