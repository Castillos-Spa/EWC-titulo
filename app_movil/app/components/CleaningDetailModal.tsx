import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { X, Sparkles as Cleaning, Clock, Users, MapPin, Camera, CircleCheck as CheckCircle, Circle, Package, FileText, Play, SquareCheck as CheckSquare } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useCleaningStore } from '../stores/cleaningStore';

interface CleaningDetailModalProps {
  readonly report: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function CleaningDetailModal({ report, visible, onClose }: CleaningDetailModalProps) {
  const { updateReportStatus, completeTask, addReportPhoto } = useCleaningStore();
  const [taskNotes, setTaskNotes] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  if (!report) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#16A34A';
      case 'in_progress': return '#06B6D4';
      default: return '#F59E0B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'in_progress': return 'En Progreso';
      default: return 'Pendiente';
    }
  };

  const getShiftLabel = (shift: string) => {
    const shifts = {
      morning: 'Mañana (06:00 - 14:00)',
      afternoon: 'Tarde (14:00 - 22:00)',
      night: 'Noche (22:00 - 06:00)',
    };
    return shifts[shift as keyof typeof shifts] || shift;
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

  const getTaskProgress = () => {
    if (!report.tasks || report.tasks.length === 0) return { completed: 0, total: 0 };
    const completed = report.tasks.filter((task: any) => task.completed).length;
    return { completed, total: report.tasks.length };
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    setIsUpdating(true);
    try {
      const notes = taskNotes[taskId] || undefined;
      await completeTask(report.id, taskId, notes);
      Alert.alert('Éxito', completed ? 'Tarea completada' : 'Tarea marcada como pendiente');
    } catch (error) {
      console.error('No se pudo actualizar la tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar la tarea');
    } finally {
      setIsUpdating(false);
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

      if (!result.canceled && result.assets[0]) {
        addReportPhoto(report.id, result.assets[0].uri);
        Alert.alert('Éxito', 'Foto agregada al reporte');
      }
    } catch (error) {
      console.error('No se pudo acceder a la cámara:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleStartReport = async () => {
    try {
      await updateReportStatus(report.id, 'in_progress');
      Alert.alert('Éxito', 'Reporte iniciado');
    } catch (error) {
      console.error('No se pudo iniciar el reporte:', error);
      Alert.alert('Error', 'No se pudo iniciar el reporte');
    }
  };

  const handleCompleteReport = async () => {
    const { completed, total } = getTaskProgress();
    
    if (completed < total) {
      Alert.alert(
        'Tareas Pendientes',
        `Aún tienes ${total - completed} tareas pendientes. ¿Deseas completar el reporte de todas formas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Completar', 
            onPress: () => {
              void updateReportStatus(report.id, 'completed')
                .then(() => {
                  Alert.alert('Éxito', 'Reporte completado');
                })
                .catch((error) => {
                  console.error('No se pudo completar el reporte:', error);
                  Alert.alert('Error', 'No se pudo completar el reporte');
                });
            }
          },
        ]
      );
    } else {
      try {
        await updateReportStatus(report.id, 'completed');
        Alert.alert('Éxito', 'Reporte completado');
      } catch (error) {
        console.error('No se pudo completar el reporte:', error);
        Alert.alert('Error', 'No se pudo completar el reporte');
      }
    }
  };

  const statusColor = getStatusColor(report.status);
  const { completed, total } = getTaskProgress();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Detalle del Reporte</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Report Info */}
          <View style={styles.reportInfo}>
            <View style={styles.reportHeader}>
              <View style={styles.shiftSection}>
                <Cleaning size={24} color="#06B6D4" />
                <View style={styles.shiftDetails}>
                  <Text style={styles.shiftText}>{getShiftLabel(report.shift)}</Text>
                  <Text style={styles.dateText}>
                    {new Date(report.date).toLocaleDateString('es-ES', {
                      weekday: 'long',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusLabel(report.status)}
                </Text>
              </View>
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>
                Progreso: {completed}/{total} tareas completadas
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: total > 0 ? `${(completed / total) * 100}%` : '0%',
                      backgroundColor: statusColor 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Crew Information */}
          <View style={styles.crewSection}>
            <Text style={styles.sectionTitle}>
              <Users size={20} color="#374151" /> Equipo de Trabajo
            </Text>
            <View style={styles.crewCard}>
              {report.crewMembers.map((member: string) => (
                <View key={member} style={styles.crewMember}>
                  <View style={styles.crewAvatar}>
                    <Text style={styles.crewInitial}>
                      {member.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.crewName}>{member}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Areas */}
          <View style={styles.areasSection}>
            <Text style={styles.sectionTitle}>
              <MapPin size={20} color="#374151" /> Áreas Asignadas
            </Text>
            <View style={styles.areasGrid}>
              {report.areas.map((area: any) => (
                <View key={area.id} style={styles.areaCard}>
                  <Text style={styles.areaName}>{area.name}</Text>
                  <Text style={styles.areaDetails}>
                    {area.building} - Piso {area.floor}
                  </Text>
                  <Text style={styles.areaTime}>
                    ~{area.estimatedTime} min
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tasks Checklist */}
          <View style={styles.tasksSection}>
            <Text style={styles.sectionTitle}>
              <CheckSquare size={20} color="#374151" /> Lista de Tareas
            </Text>
            {report.tasks.map((task: any) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <TouchableOpacity
                    style={[
                      styles.taskCheckbox,
                      task.completed && styles.taskCheckboxCompleted,
                    ]}
                    onPress={() => handleTaskToggle(task.id, !task.completed)}
                    disabled={isUpdating || report.status === 'completed'}
                  >
                    {task.completed ? (
                      <CheckCircle size={20} color="#16A34A" />
                    ) : (
                      <Circle size={20} color="#94A3B8" />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.taskContent}>
                    <Text style={[
                      styles.taskDescription,
                      task.completed && styles.taskDescriptionCompleted,
                    ]}>
                      {task.description}
                    </Text>
                    
                    {task.photoRequired && (
                      <View style={styles.photoRequirement}>
                        <Camera size={14} color="#EA580C" />
                        <Text style={styles.photoRequirementText}>Foto requerida</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Task Notes */}
                {report.status === 'in_progress' && !task.completed && (
                  <TextInput
                    style={styles.taskNotesInput}
                    value={taskNotes[task.id] || ''}
                    onChangeText={(value) => setTaskNotes(prev => ({ ...prev, [task.id]: value }))}
                    placeholder="Notas de la tarea (opcional)..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={2}
                  />
                )}

                {/* Completion Info */}
                {task.completed && task.completedAt && (
                  <View style={styles.completionInfo}>
                    <CheckCircle size={16} color="#16A34A" />
                    <Text style={styles.completionText}>
                      Completada: {formatDateTime(task.completedAt)}
                    </Text>
                  </View>
                )}

                {task.notes && (
                  <View style={styles.taskNotesDisplay}>
                    <FileText size={16} color="#64748B" />
                    <Text style={styles.taskNotesText}>{task.notes}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Supplies Used */}
          {report.supplies && report.supplies.length > 0 && (
            <View style={styles.suppliesSection}>
              <Text style={styles.sectionTitle}>
                <Package size={20} color="#374151" /> Insumos Utilizados
              </Text>
              <View style={styles.suppliesCard}>
                {report.supplies.map((supply: any) => (
                  <View key={supply.id} style={styles.supplyItem}>
                    <View style={styles.supplyInfo}>
                      <Text style={styles.supplyName}>{supply.name}</Text>
                      <Text style={styles.supplyQuantity}>
                        {supply.quantity} {supply.unit}
                      </Text>
                    </View>
                    <View style={styles.supplyCategoryBadge}>
                      <Text style={styles.supplyCategoryText}>
                        {supply.category}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Photos */}
          <View style={styles.photosSection}>
            <Text style={styles.sectionTitle}>
              <Camera size={20} color="#374151" /> Evidencia Fotográfica
            </Text>
            
            {report.status === 'in_progress' && (
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Camera size={24} color="#06B6D4" />
                <Text style={styles.photoButtonText}>Agregar Foto</Text>
              </TouchableOpacity>
            )}

            {report.photos && report.photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.photosRow}>
                  {report.photos.map((photo: string) => (
                    <View key={photo} style={styles.photoContainer}>
                      <Image source={{ uri: photo }} style={styles.photo} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <Text style={styles.noPhotosText}>No hay fotos disponibles</Text>
            )}
          </View>

          {/* Time Information */}
          <View style={styles.timeSection}>
            <Text style={styles.sectionTitle}>
              <Clock size={20} color="#374151" /> Horarios
            </Text>
            <View style={styles.timeCard}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Inicio:</Text>
                <Text style={styles.timeValue}>
                  {formatDateTime(report.startTime)}
                </Text>
              </View>
              {report.endTime && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Fin:</Text>
                  <Text style={styles.timeValue}>
                    {formatDateTime(report.endTime)}
                  </Text>
                </View>
              )}
              {report.endTime && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Duración:</Text>
                  <Text style={styles.timeValue}>
                    {Math.round((new Date(report.endTime).getTime() - new Date(report.startTime).getTime()) / (1000 * 60))} min
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Notes */}
          {report.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>
                <FileText size={20} color="#374151" /> Notas del Reporte
              </Text>
              <View style={styles.notesCard}>
                <Text style={styles.notesText}>{report.notes}</Text>
              </View>
            </View>
          )}

          {/* Supervisor Approval */}
          {report.supervisorApproval && (
            <View style={styles.approvalSection}>
              <Text style={styles.sectionTitle}>Aprobación Supervisora</Text>
              <View style={[
                styles.approvalCard,
                { backgroundColor: report.supervisorApproval.approved ? '#F0FDF4' : '#FEF2F2' }
              ]}>
                <View style={styles.approvalHeader}>
                  <CheckCircle 
                    size={20} 
                    color={report.supervisorApproval.approved ? '#16A34A' : '#EF4444'} 
                  />
                  <Text style={[
                    styles.approvalStatus,
                    { color: report.supervisorApproval.approved ? '#16A34A' : '#EF4444' }
                  ]}>
                    {report.supervisorApproval.approved ? 'Aprobado' : 'Rechazado'}
                  </Text>
                </View>
                <Text style={styles.approvalBy}>
                  Por: {report.supervisorApproval.approvedBy}
                </Text>
                <Text style={styles.approvalDate}>
                  {formatDateTime(report.supervisorApproval.approvedAt)}
                </Text>
                {report.supervisorApproval.notes && (
                  <Text style={styles.approvalNotes}>
                    {report.supervisorApproval.notes}
                  </Text>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {report.status === 'pending' && (
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={handleStartReport}
              disabled={isUpdating}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Iniciar Reporte</Text>
            </TouchableOpacity>
          )}

          {report.status === 'in_progress' && (
            <TouchableOpacity 
              style={styles.completeButton} 
              onPress={handleCompleteReport}
              disabled={isUpdating}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Completar Reporte</Text>
            </TouchableOpacity>
          )}

          {report.status === 'completed' && (
            <View style={styles.completedIndicator}>
              <CheckCircle size={24} color="#16A34A" />
              <Text style={styles.completedText}>Reporte Completado</Text>
            </View>
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
  reportInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  shiftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shiftDetails: {
    flex: 1,
  },
  shiftText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressSection: {
    marginTop: 16,
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
  crewSection: {
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
  crewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  crewMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  crewAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#06B6D4',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  crewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  areasSection: {
    marginBottom: 20,
  },
  areasGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  areaCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#06B6D4',
  },
  areaName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  areaDetails: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  areaTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
  },
  tasksSection: {
    marginBottom: 20,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  taskCheckbox: {
    padding: 4,
    marginTop: 2,
  },
  taskCheckboxCompleted: {
    // No additional styles needed
  },
  taskContent: {
    flex: 1,
  },
  taskDescription: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
    marginBottom: 8,
  },
  taskDescriptionCompleted: {
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
  taskNotesInput: {
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
    marginTop: 8,
  },
  completionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  completionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  taskNotesDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  taskNotesText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    fontStyle: 'italic',
  },
  suppliesSection: {
    marginBottom: 20,
  },
  suppliesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  supplyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  supplyInfo: {
    flex: 1,
  },
  supplyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  supplyQuantity: {
    fontSize: 14,
    color: '#64748B',
  },
  supplyCategoryBadge: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  supplyCategoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06B6D4',
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
    borderColor: '#06B6D4',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 16,
    minHeight: 64,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#06B6D4',
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
  timeSection: {
    marginBottom: 20,
  },
  timeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  notesSection: {
    marginBottom: 20,
  },
  notesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  notesText: {
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
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  startButton: {
    backgroundColor: '#06B6D4',
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
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  completedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16A34A',
  },
});