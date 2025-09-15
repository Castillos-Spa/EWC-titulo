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
import { 
  X, 
  HardHat, 
  MapPin, 
  Clock, 
  Users, 
  Play, 
  CircleCheck as CheckCircle, 
  Camera, 
  Navigation, 
  Package, 
  FileText, 
  Save, 
  Shield,
  Wrench,
  Building,
  Eye,
  Settings,
  TriangleAlert as AlertTriangle,
  User,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCivilWorksStore } from '../stores/civilWorksStore';

interface WorkOrderDetailModalProps {
  workOrder: any;
  visible: boolean;
  onClose: () => void;
}

export function WorkOrderDetailModal({ workOrder, visible, onClose }: WorkOrderDetailModalProps) {
  const { 
    updateWorkOrderStatus, 
    startWorkOrder, 
    completeWorkOrder, 
    addProgressPhoto, 
    updateMaterialUsage, 
    updateSafetyChecklist 
  } = useCivilWorksStore();
  
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [materialUsage, setMaterialUsage] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!workOrder) return null;

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
      case 'in_progress': return '#F59E0B';
      case 'on_hold': return '#D97706';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return Wrench;
      case 'construction': return Building;
      case 'repair': return AlertTriangle;
      case 'inspection': return Eye;
      case 'installation': return Settings;
      default: return HardHat;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      maintenance: 'Mantenimiento',
      construction: 'Construcción',
      repair: 'Reparación',
      inspection: 'Inspección',
      installation: 'Instalación',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      assigned: 'Asignada',
      in_progress: 'En Progreso',
      on_hold: 'En Espera',
      completed: 'Completada',
      cancelled: 'Cancelada',
    };
    return labels[status as keyof typeof labels] || status;
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  const openInMaps = () => {
    try {
      const { latitude, longitude } = workOrder.location;
      const url = `https://maps.google.com/?q=${latitude},${longitude}`;
      Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el mapa');
    }
  };

  const handleTakeProgressPhoto = async (stage: 'before' | 'during' | 'after' | 'issue') => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de cámara para tomar fotos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const photo = {
          uri: result.assets[0].uri,
          description: `Foto de ${stage}`,
          takenAt: new Date().toISOString(),
          takenBy: 'Usuario Actual',
          stage,
        };
        
        addProgressPhoto(workOrder.id, photo);
        Alert.alert('Éxito', 'Foto agregada al progreso');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleStartWork = async () => {
    Alert.alert(
      'Iniciar Orden de Trabajo',
      '¿Deseas iniciar esta orden de trabajo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Iniciar', 
          onPress: async () => {
            try {
              await startWorkOrder(workOrder.id);
              Alert.alert('Éxito', 'Orden de trabajo iniciada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo iniciar la orden');
            }
          }
        },
      ]
    );
  };

  const handleCompleteWork = async () => {
    const incompleteSafety = workOrder.safetyChecklist.filter((item: any) => !item.completed);
    
    if (incompleteSafety.length > 0) {
      Alert.alert(
        'Checklist de Seguridad Incompleto',
        `Faltan ${incompleteSafety.length} elementos del checklist de seguridad. ¿Deseas continuar?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Continuar', onPress: () => setShowCompletionForm(true) },
        ]
      );
    } else {
      setShowCompletionForm(true);
    }
  };

  const handleSubmitCompletion = async () => {
    setIsSubmitting(true);
    try {
      await completeWorkOrder(workOrder.id, {
        completionNotes: completionNotes.trim() || undefined,
        materials: workOrder.materials,
        safetyChecklist: workOrder.safetyChecklist,
      });
      
      setShowCompletionForm(false);
      setCompletionNotes('');
      onClose();
      Alert.alert('Éxito', 'Orden de trabajo completada');
    } catch (error) {
      Alert.alert('Error', 'No se pudo completar la orden');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSafetyToggle = (itemId: string, completed: boolean) => {
    updateSafetyChecklist(workOrder.id, itemId, completed);
  };

  const handleMaterialUpdate = (materialId: string, used: string) => {
    const usedAmount = parseFloat(used) || 0;
    updateMaterialUsage(workOrder.id, materialId, usedAmount);
    setMaterialUsage(prev => ({ ...prev, [materialId]: used }));
  };

  const getSafetyProgress = () => {
    if (!workOrder.safetyChecklist || workOrder.safetyChecklist.length === 0) return 0;
    const completed = workOrder.safetyChecklist.filter((item: any) => item.completed).length;
    return (completed / workOrder.safetyChecklist.length) * 100;
  };

  const priorityColor = getPriorityColor(workOrder.priority);
  const statusColor = getStatusColor(workOrder.status);
  const TypeIcon = getTypeIcon(workOrder.type);
  const safetyProgress = getSafetyProgress();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle de Orden</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Work Order Info */}
          <View style={styles.workOrderInfo}>
            <View style={styles.workOrderHeader}>
              <View style={styles.typeSection}>
                <TypeIcon size={24} color="#F59E0B" />
                <View style={styles.orderDetails}>
                  <Text style={styles.orderNumber}>{workOrder.orderNumber}</Text>
                  <Text style={styles.orderType}>{getTypeLabel(workOrder.type)}</Text>
                </View>
              </View>
              
              <View style={styles.badges}>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {getPriorityLabel(workOrder.priority)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getStatusLabel(workOrder.status)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
            <Text style={styles.workOrderDescription}>{workOrder.description}</Text>

            {workOrder.clientName && (
              <View style={styles.clientSection}>
                <User size={16} color="#2563EB" />
                <Text style={styles.clientText}>Cliente: {workOrder.clientName}</Text>
              </View>
            )}
          </View>

          {/* Schedule and Team */}
          <View style={styles.scheduleSection}>
            <Text style={styles.sectionTitle}>Programación y Equipo</Text>
            <View style={styles.scheduleCard}>
              <View style={styles.scheduleItem}>
                <Clock size={20} color="#64748B" />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleLabel}>Fecha programada</Text>
                  <Text style={styles.scheduleValue}>
                    {new Date(workOrder.scheduledDate).toLocaleDateString('es-ES')}
                  </Text>
                </View>
              </View>
              
              <View style={styles.scheduleItem}>
                <Clock size={20} color="#64748B" />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleLabel}>Duración estimada</Text>
                  <Text style={styles.scheduleValue}>
                    {formatDuration(workOrder.estimatedDuration)}
                  </Text>
                </View>
              </View>

              <View style={styles.scheduleItem}>
                <Users size={20} color="#64748B" />
                <View style={styles.scheduleDetails}>
                  <Text style={styles.scheduleLabel}>Equipo asignado</Text>
                  <Text style={styles.scheduleValue}>
                    {workOrder.assignedTo.join(', ')}
                  </Text>
                </View>
              </View>

              {workOrder.actualDuration && (
                <View style={styles.scheduleItem}>
                  <CheckCircle size={20} color="#16A34A" />
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleLabel}>Duración real</Text>
                    <Text style={styles.scheduleValue}>
                      {formatDuration(workOrder.actualDuration)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationSection}>
            <Text style={styles.sectionTitle}>Ubicación</Text>
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <MapPin size={20} color="#2563EB" />
                <View style={styles.locationDetails}>
                  <Text style={styles.locationSite}>
                    {workOrder.location.site}
                  </Text>
                  <Text style={styles.locationAddress}>
                    {workOrder.location.address}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
                <Navigation size={20} color="#2563EB" />
                <Text style={styles.mapsButtonText}>Ver en Mapas</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Safety Checklist */}
          <View style={styles.safetySection}>
            <View style={styles.safetyHeader}>
              <Text style={styles.sectionTitle}>
                <Shield size={20} color="#374151" /> Checklist de Seguridad
              </Text>
              <Text style={styles.safetyProgress}>
                {safetyProgress.toFixed(0)}% completado
              </Text>
            </View>
            
            <View style={styles.safetyProgressBar}>
              <View 
                style={[
                  styles.safetyProgressFill, 
                  { 
                    width: `${safetyProgress}%`,
                    backgroundColor: safetyProgress >= 80 ? '#16A34A' : safetyProgress >= 50 ? '#F59E0B' : '#DC2626'
                  }
                ]} 
              />
            </View>

            {workOrder.safetyChecklist.map((item: any) => (
              <View key={item.id} style={styles.safetyItem}>
                <TouchableOpacity
                  style={[
                    styles.safetyCheckbox,
                    item.completed && styles.safetyCheckboxCompleted,
                  ]}
                  onPress={() => handleSafetyToggle(item.id, !item.completed)}
                  disabled={workOrder.status === 'completed'}
                >
                  {item.completed ? (
                    <CheckCircle size={20} color="#16A34A" />
                  ) : (
                    <Shield size={20} color="#94A3B8" />
                  )}
                </TouchableOpacity>
                
                <View style={styles.safetyContent}>
                  <Text style={[
                    styles.safetyDescription,
                    item.completed && styles.safetyDescriptionCompleted,
                  ]}>
                    {item.description}
                  </Text>
                  
                  {item.photoRequired && (
                    <View style={styles.photoRequirement}>
                      <Camera size={14} color="#EA580C" />
                      <Text style={styles.photoRequirementText}>Foto requerida</Text>
                    </View>
                  )}

                  {item.completedAt && (
                    <Text style={styles.completedAt}>
                      Completado: {formatDateTime(item.completedAt)}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Materials */}
          <View style={styles.materialsSection}>
            <Text style={styles.sectionTitle}>
              <Package size={20} color="#374151" /> Materiales
            </Text>
            {workOrder.materials.map((material: any) => (
              <View key={material.id} style={styles.materialCard}>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialName}>{material.name}</Text>
                  <Text style={styles.materialQuantity}>
                    Requerido: {material.quantity} {material.unit}
                  </Text>
                  {material.cost && (
                    <Text style={styles.materialCost}>
                      Costo: ${material.cost * material.quantity}
                    </Text>
                  )}
                  {material.used !== undefined && (
                    <Text style={styles.materialUsed}>
                      Usado: {material.used} {material.unit}
                    </Text>
                  )}
                </View>
                
                {workOrder.status === 'in_progress' && (
                  <View style={styles.materialInput}>
                    <TextInput
                      style={styles.usageInput}
                      value={materialUsage[material.id] || material.used?.toString() || ''}
                      onChangeText={(value) => {
                        setMaterialUsage(prev => ({ ...prev, [material.id]: value }));
                        handleMaterialUpdate(material.id, value);
                      }}
                      placeholder="Usado"
                      keyboardType="numeric"
                      placeholderTextColor="#94A3B8"
                    />
                    <Text style={styles.inputUnit}>{material.unit}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Progress Photos */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>
              <Camera size={20} color="#374151" /> Fotos de Progreso
            </Text>
            
            {workOrder.status === 'in_progress' && (
              <View style={styles.photoActions}>
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={() => handleTakeProgressPhoto('before')}
                >
                  <Camera size={20} color="#2563EB" />
                  <Text style={styles.photoActionText}>Antes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={() => handleTakeProgressPhoto('during')}
                >
                  <Camera size={20} color="#F59E0B" />
                  <Text style={styles.photoActionText}>Durante</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={() => handleTakeProgressPhoto('after')}
                >
                  <Camera size={20} color="#16A34A" />
                  <Text style={styles.photoActionText}>Después</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoActionButton}
                  onPress={() => handleTakeProgressPhoto('issue')}
                >
                  <Camera size={20} color="#DC2626" />
                  <Text style={styles.photoActionText}>Problema</Text>
                </TouchableOpacity>
              </View>
            )}

            {workOrder.progressPhotos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {workOrder.progressPhotos.map((photo: any, index: number) => (
                    <View key={photo.id} style={styles.photoContainer}>
                      <Image source={{ uri: photo.uri }} style={styles.photo} />
                      <View style={styles.photoInfo}>
                        <Text style={styles.photoStage}>{photo.stage}</Text>
                        <Text style={styles.photoTime}>
                          {new Date(photo.takenAt).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.noPhotosText}>No hay fotos de progreso</Text>
            )}
          </View>

          {/* Completion Notes */}
          {workOrder.completionNotes && (
            <View style={styles.completionSection}>
              <Text style={styles.sectionTitle}>
                <FileText size={20} color="#374151" /> Notas de Finalización
              </Text>
              <View style={styles.completionCard}>
                <Text style={styles.completionText}>{workOrder.completionNotes}</Text>
              </View>
            </View>
          )}

          {/* Supervisor Approval */}
          {workOrder.supervisorApproval && (
            <View style={styles.approvalSection}>
              <Text style={styles.sectionTitle}>Aprobación Supervisora</Text>
              <View style={[
                styles.approvalCard,
                { backgroundColor: workOrder.supervisorApproval.approved ? '#F0FDF4' : '#FEF2F2' }
              ]}>
                <View style={styles.approvalHeader}>
                  <CheckCircle 
                    size={20} 
                    color={workOrder.supervisorApproval.approved ? '#16A34A' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.approvalStatus,
                    { color: workOrder.supervisorApproval.approved ? '#16A34A' : '#EF4444' }
                  ]}>
                    {workOrder.supervisorApproval.approved ? 'Aprobado' : 'Rechazado'}
                  </Text>
                </View>
                <Text style={styles.approvalBy}>
                  Por: {workOrder.supervisorApproval.approvedBy}
                </Text>
                <Text style={styles.approvalDate}>
                  {formatDateTime(workOrder.supervisorApproval.approvedAt)}
                </Text>
                {workOrder.supervisorApproval.notes && (
                  <Text style={styles.approvalNotes}>
                    {workOrder.supervisorApproval.notes}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Completion Form */}
          {showCompletionForm && (
            <View style={styles.completionForm}>
              <Text style={styles.sectionTitle}>Finalizar Orden de Trabajo</Text>
              <TextInput
                style={styles.completionInput}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                placeholder="Notas de finalización, observaciones, recomendaciones..."
                multiline
                numberOfLines={4}
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {workOrder.status === 'assigned' && (
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={handleStartWork}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Iniciar Trabajo</Text>
            </TouchableOpacity>
          )}

          {workOrder.status === 'in_progress' && !showCompletionForm && (
            <TouchableOpacity 
              style={styles.completeButton} 
              onPress={handleCompleteWork}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Completar Orden</Text>
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
                onPress={handleSubmitCompletion}
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
  workOrderInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderDetails: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
  },
  orderType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  badges: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
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
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  workOrderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 26,
  },
  workOrderDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 16,
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  clientText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
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
  },
  locationSite: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
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
  },
  mapsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  safetySection: {
    marginBottom: 20,
  },
  safetyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  safetyProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  safetyProgressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 16,
  },
  safetyProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  safetyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  safetyCheckbox: {
    padding: 4,
    marginTop: 2,
  },
  safetyCheckboxCompleted: {
    // No additional styles needed
  },
  safetyContent: {
    flex: 1,
  },
  safetyDescription: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 22,
  },
  safetyDescriptionCompleted: {
    color: '#64748B',
    textDecorationLine: 'line-through',
  },
  photoRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  photoRequirementText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EA580C',
  },
  completedAt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
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
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  materialQuantity: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  materialCost: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginBottom: 2,
  },
  materialUsed: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  materialInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  photosSection: {
    marginBottom: 20,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  photoActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 12,
    minHeight: 48,
  },
  photoActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  photosRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  photoContainer: {
    width: 120,
  },
  photo: {
    width: 120,
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  photoInfo: {
    alignItems: 'center',
  },
  photoStage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  photoTime: {
    fontSize: 11,
    color: '#64748B',
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
  },
  approvalSection: {
    marginBottom: 20,
  },
  approvalCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  approvalStatus: {
    fontSize: 16,
    fontWeight: '700',
  },
  approvalBy: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  approvalDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  approvalNotes: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
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
    backgroundColor: '#F59E0B',
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