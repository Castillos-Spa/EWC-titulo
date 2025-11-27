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
  Linking,
} from 'react-native';
import { X, MapPin, Clock, User, Play, CircleCheck as CheckCircle, Camera, Navigation, Package, FileText, Save, Wrench, Eye, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTicketStore } from '@/stores/ticketStore';
import { useThemeStore } from '@/stores/themeStore';

interface TicketDetailModalProps {
  readonly ticket: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function TicketDetailModal({ ticket, visible, onClose }: TicketDetailModalProps) {
  const { 
    startTicket, 
    completeTicket, 
    addTicketPhoto, 
    updateChecklist, 
    updateMaterialUsage,
    isSubmitting 
  } = useTicketStore();
  const { getColors } = useThemeStore();
  const colors = getColors();
  
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);

  // Validación de props para evitar crashes
  if (!ticket) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      default: return '#16A34A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'in_progress': return '#2563EB';
      case 'on_hold': return '#D97706';
      case 'cancelled': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return Wrench;
      case 'delivery': return Package;
      case 'pickup': return Package;
      case 'inspection': return Eye;
      case 'repair': return AlertTriangle;
      default: return FileText;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      maintenance: 'Mantenimiento',
      delivery: 'Entrega',
      pickup: 'Recogida',
      inspection: 'Inspección',
      repair: 'Reparación',
      other: 'Otro',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPriorityLabel = (priority: string) => {
    const labels = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    };
    return labels[priority as keyof typeof labels] || priority;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: 'Pendiente',
      in_progress: 'En Progreso',
      on_hold: 'Pendiente',
      completed: 'Resuelto',
      cancelled: 'Cerrado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha no válida';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const openInMaps = () => {
    try {
      if (!ticket.location || typeof ticket.location.latitude !== 'number' || typeof ticket.location.longitude !== 'number') {
        Alert.alert('Error', 'Ubicación no disponible');
        return;
      }
      
      const { latitude, longitude } = ticket.location;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert('Error', 'No se pudo abrir el mapa');
    }
  };

  const handleTakePhoto = async () => {
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

      if (!result.canceled && result.assets?.[0]?.uri) {
        addTicketPhoto(ticket.id, result.assets[0].uri);
        Alert.alert('Éxito', 'Foto agregada correctamente');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleStartTicket = async () => {
    try {
      Alert.alert(
        'Iniciar Ticket',
        '¿Deseas iniciar este ticket?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Iniciar', 
            onPress: () => { void (async () => {
              try {
                await startTicket(ticket.id);
                Alert.alert('Éxito', 'Ticket iniciado correctamente');
              } catch (error) {
                console.error('Error starting ticket:', error);
                Alert.alert('Error', 'No se pudo iniciar el ticket');
              }
            })(); }
          },
        ]
      );
    } catch (error) {
      console.error('Error handling start ticket alert:', error);
      Alert.alert('Error', 'Error al procesar la solicitud');
    }
  };

  const handleCompleteTicket = async () => {
    try {
      if (ticket.checklist?.some((item: any) => !item.completed)) {
        Alert.alert('Error', 'Debes completar todos los elementos del checklist antes de finalizar');
        return;
      }

      await completeTicket(ticket.id, {
        completionNotes: completionNotes.trim() || undefined,
        materials: ticket.materials,
        checklist: ticket.checklist,
      });
      
      setShowCompletionForm(false);
      setCompletionNotes('');
      onClose();
      Alert.alert('Éxito', 'Ticket completado correctamente');
    } catch (error) {
      console.error('Error completing ticket:', error);
      Alert.alert('Error', 'No se pudo completar el ticket');
    }
  };

  const handleChecklistToggle = (itemId: string, completed: boolean) => {
    try {
      updateChecklist(ticket.id, itemId, completed);
    } catch (error) {
      console.error('Error updating checklist:', error);
      Alert.alert('Error', 'No se pudo actualizar el checklist');
    }
  };

  const handleMaterialUpdate = (materialId: string, used: string) => {
    try {
      const usedAmount = Number.parseFloat(used) || 0;
      updateMaterialUsage(ticket.id, materialId, usedAmount);
    } catch (error) {
      console.error('Error updating material usage:', error);
      Alert.alert('Error', 'No se pudo actualizar el material');
    }
  };

  const priorityColor = getPriorityColor(ticket.priority || 'low');
  const statusColor = getStatusColor(ticket.status || 'assigned');
  const TypeIcon = getTypeIcon(ticket.type || 'other');

  const getChecklistProgress = () => {
    if (!ticket.checklist || ticket.checklist.length === 0) return 0;
    const completed = ticket.checklist.filter((item: any) => item.completed).length;
    return (completed / ticket.checklist.length) * 100;
  };

  // Validar que photos sea un array
  const photos = Array.isArray(ticket.photos) ? ticket.photos : [];
  const materials = Array.isArray(ticket.materials) ? ticket.materials : [];
  const checklist = Array.isArray(ticket.checklist) ? ticket.checklist : [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detalle del Ticket</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ticket Info */}
          <View style={[styles.ticketInfo, { backgroundColor: colors.surface }]}> 
            <View style={styles.ticketHeader}>
              <View style={styles.ticketTypeSection}>
                <TypeIcon size={24} color="#2563EB" />
                <View style={styles.ticketMainInfo}>
                  <Text style={styles.ticketNumber}>{ticket.ticketNumber || 'N/A'}</Text>
                  <Text style={styles.ticketType}>{getTypeLabel(ticket.type || 'other')}</Text>
                </View>
              </View>
              
              <View style={styles.ticketBadges}>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15`, borderColor: `${priorityColor}33` }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {getPriorityLabel(ticket.priority || 'low')}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}33` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getStatusLabel(ticket.status || 'assigned')}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.ticketTitle, { color: colors.text }]}>{ticket.title || 'Sin título'}</Text>
            <Text style={[styles.ticketDescription, { color: colors.textSecondary }]}>{ticket.description || 'Sin descripción'}</Text>

            {ticket.clientName && (
              <View style={styles.clientSection}>
                <User size={16} color="#2563EB" />
                <Text style={styles.clientText}>Cliente: {ticket.clientName}</Text>
              </View>
            )}
          </View>

          {/* Schedule and Duration */}
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Programación</Text>
            <View style={[styles.scheduleCard, { backgroundColor: colors.surface }]}>
              <View style={styles.scheduleItem}>
                <Clock size={20} color="#64748B" />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleLabel}>Fecha programada</Text>
                  <Text style={styles.scheduleValue}>
                    {ticket.scheduledDate ? new Date(ticket.scheduledDate).toLocaleDateString('es-ES') : 'No programada'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.scheduleItem}>
                <Clock size={20} color="#64748B" />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleLabel}>Duración estimada</Text>
                  <Text style={styles.scheduleValue}>
                    {ticket.estimatedDuration ? formatDuration(ticket.estimatedDuration) : 'No especificada'}
                  </Text>
                </View>
              </View>

              {ticket.actualDuration && (
                <View style={styles.scheduleItem}>
                  <CheckCircle size={20} color="#16A34A" />
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleLabel}>Duración real</Text>
                    <Text style={styles.scheduleValue}>
                      {formatDuration(ticket.actualDuration)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          {ticket.location && (
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>Ubicación</Text>
              <View style={[styles.locationCard, { backgroundColor: colors.surface }]}>
                <View style={styles.locationInfo}>
                  <MapPin size={20} color="#2563EB" />
                  <View style={styles.locationDetails}>
                    <Text style={styles.locationAddress}>
                      {ticket.location.address || 'Ubicación GPS'}
                    </Text>
                    <Text style={styles.locationCoords}>
                      {typeof ticket.location.latitude === 'number' && typeof ticket.location.longitude === 'number'
                        ? `${ticket.location.latitude.toFixed(6)}, ${ticket.location.longitude.toFixed(6)}`
                        : 'Coordenadas no disponibles'
                      }
                    </Text>
                  </View>
                </View>
                {typeof ticket.location.latitude === 'number' && typeof ticket.location.longitude === 'number' && (
                  <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
                    <Navigation size={20} color="#2563EB" />
                    <Text style={styles.mapsButtonText}>Ver en Mapas</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Materials */}
          {materials.length > 0 && (
            <View style={styles.materialsSection}>
              <Text style={styles.sectionTitle}>
                <Package size={20} color="#374151" /> Materiales
              </Text>
              {materials.map((material: any) => (
                <View key={material.id} style={styles.materialCard}>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialName}>{material.name || 'Material'}</Text>
                    <Text style={styles.materialQuantity}>
                      Requerido: {material.quantity || 0} {material.unit || 'unidades'}
                    </Text>
                    {material.used !== undefined && (
                      <Text style={styles.materialUsed}>
                        Usado: {material.used} {material.unit || 'unidades'}
                      </Text>
                    )}
                  </View>
                  
                  {ticket.status === 'in_progress' && (
                    <View style={styles.materialInput}>
                      <TextInput
                        style={styles.usageInput}
                        value={material.used?.toString() || ''}
                        onChangeText={(value) => handleMaterialUpdate(material.id, value)}
                        placeholder="Usado"
                        keyboardType="numeric"
                        placeholderTextColor="#94A3B8"
                      />
                      <Text style={styles.inputUnit}>{material.unit || 'unidades'}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <View style={styles.checklistSection}>
              <Text style={styles.sectionTitle}>
                <CheckCircle size={20} color="#374151" /> Lista de Verificación
              </Text>
              
              <View style={styles.checklistProgress}>
                <Text style={styles.progressLabel}>
                  Progreso: {checklist.filter((item: any) => item.completed).length}/{checklist.length}
                </Text>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${getChecklistProgress()}%`,
                        backgroundColor: statusColor 
                      }
                    ]} 
                  />
                </View>
              </View>

              {checklist.map((item: any) => (
                <View key={item.id} style={styles.checklistItem}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      item.completed && styles.checkboxCompleted,
                    ]}
                    onPress={() => handleChecklistToggle(item.id, !item.completed)}
                    disabled={ticket.status === 'completed'}
                  >
                    {item.completed && <CheckCircle size={16} color="#16A34A" />}
                  </TouchableOpacity>
                  
                  <View style={styles.checklistContent}>
                    <Text style={[
                      styles.checklistDescription,
                      item.completed && styles.checklistDescriptionCompleted,
                    ]}>
                      {item.description || 'Sin descripción'}
                    </Text>
                    
                    {item.photoRequired && (
                      <View style={styles.photoRequirement}>
                        <Camera size={14} color="#EA580C" />
                        <Text style={styles.photoRequirementText}>Foto requerida</Text>
                      </View>
                    )}
                    
                    {item.notes && (
                      <Text style={styles.checklistNotes}>{item.notes}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Photos */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>
              <Camera size={20} color="#374151" /> Evidencia Fotográfica
            </Text>
            
            {ticket.status === 'in_progress' && (
              <TouchableOpacity style={styles.photoButton} onPress={() => { void handleTakePhoto(); }}>
                <Camera size={24} color="#2563EB" />
                <Text style={styles.photoButtonText}>Tomar Foto</Text>
              </TouchableOpacity>
            )}

            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {photos.map((photo: string, index: number) => (
                    <View key={photo} style={styles.photoContainer}>
                      <Image 
                        source={{ uri: photo }} 
                        style={styles.photo}
                        onError={() => console.warn(`Error loading image: ${photo}`)}
                      />
                      <View style={styles.photoIndex}>
                        <Text style={styles.photoIndexText}>{index + 1}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.noPhotosText}>No hay fotos disponibles</Text>
            )}
          </View>

          {/* Completion Notes */}
          {ticket.completionNotes && (
            <View style={styles.completionSection}>
              <Text style={styles.sectionTitle}>
                <FileText size={20} color="#374151" /> Notas de Finalización
              </Text>
              <View style={[styles.completionCard, { backgroundColor: colors.surface }]}>
                <Text style={styles.completionText}>{ticket.completionNotes}</Text>
              </View>
            </View>
          )}

          {/* Assignment Info */}
          <View style={styles.assignmentSection}>
            <Text style={styles.sectionTitle}>Información de Asignación</Text>
            <View style={styles.assignmentCard}>
              <View style={styles.assignmentItem}>
                <User size={16} color="#64748B" />
                <Text style={styles.assignmentText}>
                  Asignado a: {ticket.assignedTo || 'No asignado'}
                </Text>
              </View>
              <View style={styles.assignmentItem}>
                <User size={16} color="#64748B" />
                <Text style={styles.assignmentText}>
                  Asignado por: {ticket.assignedBy || 'No especificado'}
                </Text>
              </View>
              <View style={styles.assignmentItem}>
                <Clock size={16} color="#64748B" />
                <Text style={styles.assignmentText}>
                  Creado: {ticket.createdAt ? formatDateTime(ticket.createdAt) : 'Fecha no disponible'}
                </Text>
              </View>
            </View>
          </View>

          {/* Completion Form */}
          {showCompletionForm && (
            <View style={styles.completionForm}>
              <Text style={styles.sectionTitle}>Finalizar Ticket</Text>
              <TextInput
                style={styles.completionInput}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                placeholder="Notas de finalización (opcional)..."
                multiline
                numberOfLines={4}
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
  <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {ticket.status === 'assigned' && (
            <TouchableOpacity 
              style={[styles.startButton, isSubmitting && styles.buttonDisabled]} 
              onPress={() => { void handleStartTicket(); }}
              disabled={isSubmitting}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>
                {isSubmitting ? 'Iniciando...' : 'Iniciar Ticket'}
              </Text>
            </TouchableOpacity>
          )}

          {ticket.status === 'in_progress' && !showCompletionForm && (
            <TouchableOpacity 
              style={styles.completeButton} 
              onPress={() => setShowCompletionForm(true)}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Completar Ticket</Text>
            </TouchableOpacity>
          )}

          {showCompletionForm && (
            <>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowCompletionForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
                onPress={() => { void handleCompleteTicket(); }}
                disabled={isSubmitting}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Finalizando...' : 'Finalizar'}
                </Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingHorizontal: 20,
  },
  ticketInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  ticketTypeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  ticketMainInfo: {
    flex: 1,
    minWidth: 0,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
    flexShrink: 1,
  },
  ticketType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    flexShrink: 1,
  },
  ticketBadges: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  ticketTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 26,
    flexWrap: 'wrap',
  },
  ticketDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  clientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
    flexShrink: 1,
  },
  scheduleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleDetails: {
    flex: 1,
    minWidth: 0,
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  scheduleValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flexWrap: 'wrap',
  },
  locationSection: {
    marginBottom: 20,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  locationDetails: {
    flex: 1,
    minWidth: 0,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  locationCoords: {
    fontSize: 14,
    color: '#64748B',
    flexWrap: 'wrap',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563EB',
    minHeight: 48,
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    flexShrink: 1,
  },
  materialsSection: {
    marginBottom: 20,
  },
  materialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  materialInfo: {
    flex: 1,
    minWidth: 0,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    flexShrink: 1,
  },
  materialQuantity: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
    flexShrink: 1,
  },
  materialUsed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    flexShrink: 1,
  },
  materialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  usageInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1E293B',
    width: 80,
    textAlign: 'center',
    minHeight: 40,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  checklistSection: {
    marginBottom: 20,
  },
  checklistProgress: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
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
  checklistItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkboxCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#16A34A',
  },
  checklistContent: {
    flex: 1,
    minWidth: 0,
  },
  checklistDescription: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 22,
    flexWrap: 'wrap',
  },
  checklistDescriptionCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  photoRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  photoRequirementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  checklistNotes: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
    flexWrap: 'wrap',
  },
  photosSection: {
    marginBottom: 20,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2563EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 16,
    minHeight: 64,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  photoIndex: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  photoIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  noPhotosText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  completionSection: {
    marginBottom: 20,
  },
  completionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  completionText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    flexWrap: 'wrap',
  },
  assignmentSection: {
    marginBottom: 20,
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  assignmentText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    flexShrink: 1,
  },
  completionForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  completionInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
    minHeight: 96,
    textAlignVertical: 'top',
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
  startButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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