import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { X, Shield, Camera, Save, CircleCheck as CheckCircle, Circle, HardHat, Eye, Wrench, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

interface SafetyChecklistModalProps {
  readonly visible: boolean;
  readonly onClose: () => void;
}

interface SafetyItem {
  id: string;
  description: string;
  category: 'ppe' | 'site_conditions' | 'equipment' | 'procedures';
  completed: boolean;
  notes?: string;
  photoRequired: boolean;
  photoPath?: string;
}

// Subcomponente extraído para reducir anidación
const ChecklistItemRow = ({
  item,
  index,
  total,
  onToggle,
  onTakePhoto,
  notes,
  setNotes,
}: {
  item: SafetyItem;
  index: number;
  total: number;
  onToggle: (id: string) => void;
  onTakePhoto: (id: string) => Promise<void> | void;
  notes: { [key: string]: string };
  setNotes: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}) => {
  const borderStyle = index < total - 1 ? styles.checklistItemBorder : undefined;
  return (
    <View key={item.id} style={[styles.checklistItem, borderStyle]}>
      <View style={styles.itemHeader}>
        <TouchableOpacity
          style={[styles.checkbox, item.completed && styles.checkboxCompleted]}
          onPress={() => onToggle(item.id)}
        >
          {item.completed ? (
            <CheckCircle size={20} color="#16A34A" />
          ) : (
            <Circle size={20} color="#94A3B8" />
          )}
        </TouchableOpacity>

        <View style={styles.itemContent}>
          <Text style={[styles.itemDescription, item.completed && styles.itemDescriptionCompleted]}>
            {item.description}
          </Text>
          {item.photoRequired && (
            <View style={styles.photoRequirement}>
              <Camera size={14} color="#EA580C" />
              <Text style={styles.photoRequirementText}>Foto requerida</Text>
            </View>
          )}
        </View>

        {item.photoRequired && (
          <TouchableOpacity style={styles.photoButton} onPress={() => { onTakePhoto(item.id); }}>
            <Camera size={20} color="#2563EB" />
          </TouchableOpacity>
        )}
      </View>

      {item.photoPath && (
        <View style={styles.photoPreview}>
          <Image source={{ uri: item.photoPath }} style={styles.photo} />
          <View style={styles.photoStatus}>
            <CheckCircle size={16} color="#16A34A" />
            <Text style={styles.photoStatusText}>Foto capturada</Text>
          </View>
        </View>
      )}

      <TextInput
        style={styles.notesInput}
        value={notes[item.id] || ''}
        onChangeText={(value) => setNotes(prev => ({ ...prev, [item.id]: value }))}
        placeholder="Notas adicionales (opcional)..."
        placeholderTextColor="#94A3B8"
        multiline
        numberOfLines={2}
      />

      {item.completed && (
        <View style={styles.completionInfo}>
          <CheckCircle size={16} color="#16A34A" />
          <Text style={styles.completionText}>Verificado correctamente</Text>
        </View>
      )}
    </View>
  );
};

export function SafetyChecklistModal({ visible, onClose }: SafetyChecklistModalProps) {
  const getProgressColor = (pct: number) => {
    if (pct >= 80) return '#16A34A';
    if (pct >= 50) return '#F59E0B';
    return '#DC2626';
  };
  const [checklist, setChecklist] = useState<SafetyItem[]>([
    {
      id: 'safety-001',
      description: 'Uso de casco de seguridad',
      category: 'ppe',
      completed: false,
      photoRequired: true,
    },
    {
      id: 'safety-002',
      description: 'Uso de chaleco reflectivo',
      category: 'ppe',
      completed: false,
      photoRequired: true,
    },
    {
      id: 'safety-003',
      description: 'Calzado de seguridad',
      category: 'ppe',
      completed: false,
      photoRequired: false,
    },
    {
      id: 'safety-004',
      description: 'Verificar condiciones del terreno',
      category: 'site_conditions',
      completed: false,
      photoRequired: true,
    },
    {
      id: 'safety-005',
      description: 'Señalización de área de trabajo',
      category: 'site_conditions',
      completed: false,
      photoRequired: true,
    },
    {
      id: 'safety-006',
      description: 'Inspeccionar herramientas',
      category: 'equipment',
      completed: false,
      photoRequired: false,
    },
    {
      id: 'safety-007',
      description: 'Verificar estado de maquinaria',
      category: 'equipment',
      completed: false,
      photoRequired: true,
    },
    {
      id: 'safety-008',
      description: 'Briefing de seguridad del equipo',
      category: 'procedures',
      completed: false,
      photoRequired: false,
    },
  ]);

  const [itemNotes, setItemNotes] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ppe': return HardHat;
      case 'site_conditions': return Eye;
      case 'equipment': return Wrench;
      case 'procedures': return Shield;
      default: return Shield;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      ppe: 'Equipo de Protección',
      site_conditions: 'Condiciones del Sitio',
      equipment: 'Equipos y Herramientas',
      procedures: 'Procedimientos',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ppe': return '#2563EB';
      case 'site_conditions': return '#F59E0B';
      case 'equipment': return '#16A34A';
      case 'procedures': return '#7C3AED';
      default: return '#6B7280';
    }
  };

  const handleItemToggle = (itemId: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleTakePhoto = async (itemId: string) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setChecklist(prev => prev.map(item =>
          item.id === itemId 
            ? { ...item, photoPath: result.assets[0].uri }
            : item
        ));
        Alert.alert('Éxito', 'Foto agregada al checklist');
      }
    } catch (error) {
      console.error('Error cámara checklist:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleSubmit = async () => {
    const incompleteRequired = checklist.filter(item => 
      !item.completed && (item.photoRequired || item.category === 'ppe')
    );

    if (incompleteRequired.length > 0) {
      Alert.alert(
        'Checklist Incompleto',
        `Faltan ${incompleteRequired.length} elementos obligatorios de seguridad. ¿Deseas continuar de todas formas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => { void saveChecklist(); } },
        ]
      );
    } else {
      void saveChecklist();
    }
  };

  const saveChecklist = async () => {
    setIsSubmitting(true);
    try {
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const completedItems = checklist.filter(item => item.completed).length;
      const completionRate = Math.round((completedItems / checklist.length) * 100);
      
      Alert.alert(
        'Checklist Guardado',
        `Checklist de seguridad completado al ${completionRate}%.\n\nElementos completados: ${completedItems}/${checklist.length}`,
        [{ text: 'Entendido', onPress: onClose }]
      );
    } catch (error) {
      console.error('Error al guardar checklist:', error);
      Alert.alert('Error', 'No se pudo guardar el checklist');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgress = () => {
    const completed = checklist.filter(item => item.completed).length;
    return { completed, total: checklist.length, percentage: (completed / checklist.length) * 100 };
  };

  const progress = getProgress();

  // Agrupar por categoría
  const groupedChecklist = checklist.reduce((groups, item) => {
    const category = item.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {} as { [key: string]: SafetyItem[] });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Checklist de Seguridad</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <Shield size={24} color="#F59E0B" />
            <View style={styles.progressDetails}>
              <Text style={styles.progressTitle}>
                Progreso de Seguridad: {progress.completed}/{progress.total}
              </Text>
              <Text style={styles.progressSubtitle}>
                {progress.percentage.toFixed(0)}% completado
              </Text>
            </View>
          </View>
          
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progress.percentage}%`,
                    backgroundColor: getProgressColor(progress.percentage)
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Safety Categories */}
          {Object.entries(groupedChecklist).map(([category, items]) => {
            const CategoryIcon = getCategoryIcon(category);
            const categoryColor = getCategoryColor(category);
            const categoryCompleted = items.filter(item => item.completed).length;

            return (
              <View key={category} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryTitle}>
                    <CategoryIcon size={20} color={categoryColor} />
                    <Text style={styles.categoryLabel}>
                      {getCategoryLabel(category)}
                    </Text>
                  </View>
                  <Text style={styles.categoryProgress}>
                    {categoryCompleted}/{items.length}
                  </Text>
                </View>

                <View style={styles.categoryCard}>
                  {items.map((item, index) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      total={items.length}
                      onToggle={handleItemToggle}
                      onTakePhoto={handleTakePhoto}
                      notes={itemNotes}
                      setNotes={setItemNotes}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          {/* Safety Tips */}
          <View style={styles.tipsSection}>
            <View style={styles.tipsHeader}>
              <AlertTriangle size={20} color="#F59E0B" />
              <Text style={styles.tipsTitle}>Recordatorios de Seguridad</Text>
            </View>
            <View style={styles.tipsCard}>
              <Text style={styles.tipsText}>
                • Nunca omitas el equipo de protección personal{'\n'}
                • Verifica las condiciones del sitio antes de comenzar{'\n'}
                • Mantén el área de trabajo señalizada{'\n'}
                • Reporta inmediatamente cualquier condición insegura{'\n'}
                • Realiza el briefing de seguridad con todo el equipo
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
            onPress={() => { void handleSubmit(); }}
            disabled={isSubmitting}
          >
            <Save size={20} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Guardando...' : 'Guardar Checklist'}
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
  progressHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  progressDetails: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#64748B',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categorySection: {
    marginBottom: 24,
    marginTop: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  categoryProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checklistItem: {
    padding: 16,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkbox: {
    padding: 4,
    marginTop: 2,
  },
  checkboxCompleted: {
    // No additional styles needed
  },
  itemContent: {
    flex: 1,
  },
  itemDescription: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 8,
  },
  itemDescriptionCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  photoRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  photoRequirementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  photoButton: {
    padding: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  photoPreview: {
    alignItems: 'center',
    marginBottom: 12,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  tipsSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  tipsText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
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
    backgroundColor: '#F59E0B',
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