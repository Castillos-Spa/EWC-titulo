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
import { X, Save, Package, Plus, Minus, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { useCleaningStore } from '../stores/cleaningStore';
import { useAuthStore } from '../stores/authStore';

interface SupplyRequestModalProps {
  visible: boolean;
  onClose: () => void;
}

interface RequestItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'cleaning' | 'safety' | 'tools';
  estimatedPrice?: number;
}

export function SupplyRequestModal({ visible, onClose }: SupplyRequestModalProps) {
  const { createSupplyRequest, isSubmitting } = useCleaningStore();
  const { user } = useAuthStore();
  
  const [items, setItems] = useState<RequestItem[]>([
    { id: '1', name: '', quantity: 1, unit: 'unidades', category: 'cleaning' }
  ]);
  const [justification, setJustification] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const urgencyLevels = [
    { value: 'low', label: 'Baja', color: '#16A34A' },
    { value: 'medium', label: 'Media', color: '#D97706' },
    { value: 'high', label: 'Alta', color: '#EA580C' },
    { value: 'urgent', label: 'Urgente', color: '#DC2626' },
  ];

  const categories = [
    { value: 'cleaning', label: 'Limpieza' },
    { value: 'safety', label: 'Seguridad' },
    { value: 'tools', label: 'Herramientas' },
  ];

  const units = ['unidades', 'litros', 'kilos', 'metros', 'cajas', 'paquetes'];

  const addItem = () => {
    const newItem: RequestItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      unit: 'unidades',
      category: 'cleaning',
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  const updateItem = (itemId: string, field: keyof RequestItem, value: any) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async () => {
    // Validaciones
    const validItems = items.filter(item => item.name.trim());
    
    if (validItems.length === 0) {
      Alert.alert('Error', 'Agrega al menos un insumo válido');
      return;
    }

    if (!justification.trim()) {
      Alert.alert('Error', 'La justificación es obligatoria');
      return;
    }

    try {
      await createSupplyRequest({
        requestedBy: user?.name || 'Usuario',
        items: validItems.map(item => ({
          id: item.id,
          name: item.name.trim(),
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          estimatedPrice: item.estimatedPrice,
        })),
        justification: justification.trim(),
        urgency,
        status: 'pending',
      });

      // Reset form
      setItems([{ id: '1', name: '', quantity: 1, unit: 'unidades', category: 'cleaning' }]);
      setJustification('');
      setUrgency('medium');
      
      onClose();
      Alert.alert('Éxito', 'Solicitud de insumos enviada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la solicitud');
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      return total + (item.estimatedPrice || 0) * item.quantity;
    }, 0);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Solicitar Insumos</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Urgency Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nivel de Urgencia</Text>
            <View style={styles.urgencyGrid}>
              {urgencyLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.urgencyButton,
                    { borderColor: level.color },
                    urgency === level.value && { backgroundColor: `${level.color}15` },
                  ]}
                  onPress={() => setUrgency(level.value as any)}
                >
                  <Text style={[
                    styles.urgencyLabel,
                    { color: level.color },
                    urgency === level.value && styles.urgencyLabelSelected,
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Items List */}
          <View style={styles.section}>
            <View style={styles.itemsHeader}>
              <Text style={styles.sectionTitle}>Insumos Solicitados</Text>
              <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
                <Plus size={20} color="#16A34A" />
                <Text style={styles.addItemText}>Agregar</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>#{index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Minus size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Item Name */}
                <TextInput
                  style={styles.input}
                  value={item.name}
                  onChangeText={(value) => updateItem(item.id, 'name', value)}
                  placeholder="Nombre del insumo (ej: Detergente multiuso)"
                  placeholderTextColor="#94A3B8"
                />

                {/* Quantity and Unit */}
                <View style={styles.quantityRow}>
                  <View style={styles.quantityInput}>
                    <Text style={styles.inputLabel}>Cantidad</Text>
                    <TextInput
                      style={styles.numberInput}
                      value={item.quantity.toString()}
                      onChangeText={(value) => updateItem(item.id, 'quantity', parseInt(value) || 1)}
                      keyboardType="numeric"
                      placeholder="1"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  
                  <View style={styles.unitInput}>
                    <Text style={styles.inputLabel}>Unidad</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.unitSelector}>
                        {units.map((unit) => (
                          <TouchableOpacity
                            key={unit}
                            style={[
                              styles.unitButton,
                              item.unit === unit && styles.unitButtonSelected,
                            ]}
                            onPress={() => updateItem(item.id, 'unit', unit)}
                          >
                            <Text style={[
                              styles.unitButtonText,
                              item.unit === unit && styles.unitButtonTextSelected,
                            ]}>
                              {unit}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>

                {/* Category */}
                <View style={styles.categorySection}>
                  <Text style={styles.inputLabel}>Categoría</Text>
                  <View style={styles.categorySelector}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        style={[
                          styles.categoryButton,
                          item.category === category.value && styles.categoryButtonSelected,
                        ]}
                        onPress={() => updateItem(item.id, 'category', category.value)}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          item.category === category.value && styles.categoryButtonTextSelected,
                        ]}>
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Estimated Price (Optional) */}
                <View style={styles.priceSection}>
                  <Text style={styles.inputLabel}>Precio Estimado (Opcional)</Text>
                  <View style={styles.priceInput}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={styles.priceInputField}
                      value={item.estimatedPrice?.toString() || ''}
                      onChangeText={(value) => updateItem(item.id, 'estimatedPrice', parseFloat(value) || undefined)}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Justification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Justificación</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={justification}
              onChangeText={setJustification}
              placeholder="Explica por qué necesitas estos insumos..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#94A3B8"
              maxLength={500}
            />
            <Text style={styles.charCount}>{justification.length}/500</Text>
          </View>

          {/* Total Estimate */}
          {calculateTotal() > 0 && (
            <View style={styles.totalSection}>
              <View style={styles.totalCard}>
                <Text style={styles.totalLabel}>Costo Estimado Total</Text>
                <Text style={styles.totalValue}>
                  ${calculateTotal().toFixed(2)}
                </Text>
              </View>
            </View>
          )}
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
              {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
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
  },
  urgencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  urgencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  urgencyLabelSelected: {
    fontWeight: '700',
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  addItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  removeItemButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 12,
    minHeight: 48,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 2,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  numberInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'center',
    minHeight: 48,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonSelected: {
    backgroundColor: '#2563EB',
  },
  unitButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  unitButtonTextSelected: {
    color: '#FFFFFF',
  },
  categorySection: {
    marginBottom: 12,
  },
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  categoryButtonSelected: {
    backgroundColor: '#16A34A',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  priceSection: {
    marginBottom: 8,
  },
  priceInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 8,
  },
  priceInputField: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 12,
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
  totalSection: {
    marginBottom: 20,
  },
  totalCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#16A34A',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#16A34A',
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
    backgroundColor: '#16A34A',
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