import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { X, Calendar, Clock, User, Tag, FileText, Camera, Send, CircleCheck as CheckCircle, Play, Pause, TrendingUp, MessageCircle, Paperclip, Route, Sparkles as Cleaning, HardHat, Monitor } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useThemeStore } from '@/stores/themeStore';

interface TaskDetailModalProps {
  readonly task: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function TaskDetailModal({ task, visible, onClose }: TaskDetailModalProps) {
  const { 
    updateTaskStatus, 
    updateTaskProgress, 
    addTaskComment, 
    addTaskAttachment,
    requestApproval 
  } = useKanbanStore();
  
  const [newComment, setNewComment] = useState('');
  const [progressValue, setProgressValue] = useState(task?.progress?.toString() || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getColors } = useThemeStore();
  const colors = getColors();

  if (!task) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'route': return Route;
      case 'cleaning': return Cleaning;
      case 'civil_work': return HardHat;
      case 'it_ticket': return Monitor;
      case 'approval': return CheckCircle;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'route': return '#2563EB';
      case 'cleaning': return '#06B6D4';
      case 'civil_work': return '#F59E0B';
      case 'it_ticket': return '#8B5CF6';
      case 'approval': return '#7C3AED';
      default: return '#6B7280';
    }
  };

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
      case 'cancelled': return '#DC2626';
      default: return '#F59E0B';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      route: 'Ruta',
      cleaning: 'Limpieza',
      civil_work: 'Obra Civil',
      it_ticket: 'Ticket TIC',
      approval: 'Aprobación',
      maintenance: 'Mantenimiento',
      inspection: 'Inspección',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendiente',
      in_progress: 'En Progreso',
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

  const handleStatusChange = async (newStatus: 'in_progress' | 'completed' | 'cancelled' | 'pending') => {
    try {
      await updateTaskStatus(task.id, newStatus);
      Alert.alert('Éxito', `Tarea marcada como ${getStatusLabel(newStatus).toLowerCase()}`);
    } catch (error) {
      console.error('Error al actualizar estado de tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado');
    }
  };

  const handleProgressUpdate = async () => {
    const parsedProgress = Number.parseInt(progressValue, 10);
    const progress = Number.isNaN(parsedProgress) ? 0 : parsedProgress;
    if (progress < 0 || progress > 100) {
      Alert.alert('Error', 'El progreso debe estar entre 0 y 100');
      return;
    }

    try {
      await updateTaskProgress(task.id, progress);
      Alert.alert('Éxito', 'Progreso actualizado correctamente');
    } catch (error) {
      console.error('Error al actualizar progreso de tarea:', error);
      Alert.alert('Error', 'No se pudo actualizar el progreso');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Escribe un comentario');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTaskComment(task.id, newComment.trim());
      setNewComment('');
      Alert.alert('Éxito', 'Comentario agregado');
    } catch (error) {
      console.error('Error al agregar comentario a tarea:', error);
      Alert.alert('Error', 'No se pudo agregar el comentario');
    } finally {
      setIsSubmitting(false);
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
        addTaskAttachment(task.id, result.assets[0].uri);
        Alert.alert('Éxito', 'Foto agregada a la tarea');
      }
    } catch (error) {
      console.error('Error cámara en tarea:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleRequestApproval = async () => {
    Alert.alert(
      'Solicitar Aprobación',
      '¿Deseas solicitar aprobación para esta tarea?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Solicitar', 
          onPress: () => {
            void (async () => {
              try {
                // En una app real, seleccionarías los aprobadores
                await requestApproval(task.id, ['supervisor-1', 'manager-1']);
                Alert.alert('Éxito', 'Solicitud de aprobación enviada');
              } catch (error) {
                console.error('Error al solicitar aprobación de tarea:', error);
                Alert.alert('Error', 'No se pudo enviar la solicitud');
              }
            })();
          }
        },
      ]
    );
  };

  const getApprovalStyle = (status: string) => {
    if (status === 'approved') return { bg: '#F0FDF4', color: '#16A34A', label: 'Aprobado' } as const;
    if (status === 'rejected') return { bg: '#FEF2F2', color: '#DC2626', label: 'Rechazado' } as const;
    return { bg: '#FEF3F2', color: '#F59E0B', label: 'Pendiente' } as const;
  };

  const TypeIcon = getTypeIcon(task.type);
  const typeColor = getTypeColor(task.type);
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    return date.toLocaleDateString('es-ES');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Detalle de Tarea</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Task Info */}
          <View style={[styles.taskInfo, { backgroundColor: colors.surface }]}>
            <View style={styles.taskHeader}>
              <View style={styles.typeSection}>
                <View style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}>
                  <TypeIcon size={24} color={typeColor} />
                </View>
                <View style={styles.taskMainInfo}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                  <Text style={[styles.taskType, { color: colors.textSecondary }]}>{getTypeLabel(task.type)}</Text>
                </View>
              </View>
              
              <View style={styles.badges}>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {getPriorityLabel(task.priority)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getStatusLabel(task.status)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.taskDescription, { color: colors.textSecondary }]}>{task.description}</Text>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>Progreso: {task.progress}%</Text>
                <View style={styles.progressInput}>
                  <TextInput
                    style={[styles.progressInputField, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    value={progressValue}
                    onChangeText={setProgressValue}
                    keyboardType="numeric"
                    placeholder="0-100"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={3}
                  />
                  <TouchableOpacity 
                    style={[styles.updateProgressButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                    onPress={handleProgressUpdate}
                  >
                    <TrendingUp size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${task.progress}%`,
                      backgroundColor: typeColor 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Task Details */}
          <View style={styles.detailsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Información de la Tarea</Text>
            <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
              <View style={styles.detailItem}>
                <User size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Asignado por</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{task.assignedBy}</Text>
                </View>
              </View>

              {task.dueDate && (
                <View style={styles.detailItem}>
                  <Calendar size={20} color="#64748B" />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Fecha límite</Text>
                    <Text style={[
                      styles.detailValue, 
                      { color: colors.text },
                      new Date(task.dueDate) < new Date() && styles.overdue
                    ]}>
                      {formatDateTime(task.dueDate)}
                    </Text>
                  </View>
                </View>
              )}

              {task.estimatedHours && (
                <View style={styles.detailItem}>
                  <Clock size={20} color="#64748B" />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Tiempo estimado</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {formatDuration(task.estimatedHours)}
                      {task.actualHours && ` • Real: ${formatDuration(task.actualHours)}`}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Calendar size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Creada</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDateTime(task.createdAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Clock size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Última actualización</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatDateTime(task.updatedAt)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Tags */}
          {task.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Tag size={20} color="#374151" /> Etiquetas
              </Text>
              <View style={styles.tagsContainer}>
                {task.tags.map((tag: string) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: `${typeColor}15` }]}>
                    <Text style={[styles.tagText, { color: typeColor }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Approvals */}
          {task.approvals && task.approvals.length > 0 && (
            <View style={styles.approvalsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <CheckCircle size={20} color="#374151" /> Aprobaciones
              </Text>
              {task.approvals.map((approval: any) => (
                <View key={approval.id} style={[styles.approvalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.approvalHeader}>
                    <View style={styles.approverInfo}>
                      <View style={styles.approverAvatar}>
                        <Text style={styles.approverInitial}>
                          {approval.approverName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.approverDetails}>
                        <Text style={[styles.approverName, { color: colors.text }]}>{approval.approverName}</Text>
                        <Text style={[styles.approvalLevel, { color: colors.textSecondary }]}>Nivel {approval.level}</Text>
                      </View>
                    </View>
                    
                    {(() => { const st = getApprovalStyle(approval.status); return (
                      <View style={[styles.approvalStatus, { backgroundColor: st.bg }]}>
                        <Text style={[styles.approvalStatusText, { color: st.color }]}>
                          {st.label}
                        </Text>
                      </View>
                    ); })()}
                  </View>
                  
                  {approval.notes && (
                    <Text style={[styles.approvalNotes, { color: colors.textSecondary }]}>{approval.notes}</Text>
                  )}
                  
                  {approval.approvedAt && (
                    <Text style={[styles.approvalDate, { color: colors.textSecondary }]}>
                      {formatDateTime(approval.approvedAt)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Attachments */}
          {task.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.sectionTitle}>
                <Paperclip size={20} color="#374151" /> Archivos Adjuntos
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.attachmentsRow}>
                  {task.attachments.map((attachment: string) => (
                    <View key={attachment} style={styles.attachmentContainer}>
                      <Image source={{ uri: attachment }} style={styles.attachment} />
                      <Text style={styles.attachmentIndex}>Adjunto</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              <MessageCircle size={20} color="#374151" /> Comentarios ({task.comments.length})
            </Text>
            
            {task.comments.map((comment: any) => (
              <View key={comment.id} style={[styles.commentCard, { backgroundColor: colors.surface }]}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthor}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitial}>
                        {comment.authorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.authorInfo}>
                      <Text style={[styles.authorName, { color: colors.text }]}>{comment.authorName}</Text>
                      <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                        {formatTime(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <Text style={[styles.commentContent, { color: colors.textSecondary }]}>{comment.content}</Text>
                
                {comment.attachments && comment.attachments.length > 0 && (
                  <View style={styles.commentAttachments}>
                    {comment.attachments.map((attachment: string) => (
                      <Image key={attachment} source={{ uri: attachment }} style={styles.commentAttachment} />
                    ))}
                  </View>
                )}
              </View>
            ))}

            {/* Add Comment */}
            <View style={[styles.addCommentSection, { backgroundColor: colors.surface }]}>
              <TextInput
                style={[styles.commentInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Agregar comentario o actualización..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
              
              <View style={styles.commentActions}>
                <TouchableOpacity style={[styles.attachButton, { backgroundColor: colors.background }]} onPress={handleTakePhoto}>
                  <Camera size={20} color="#64748B" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.sendButton, { backgroundColor: colors.primary }, (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>
                    {isSubmitting ? 'Enviando...' : 'Enviar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          {task.status === 'pending' && (
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: colors.primary }]} 
              onPress={() => handleStatusChange('in_progress')}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Iniciar Tarea</Text>
            </TouchableOpacity>
          )}

          {task.status === 'in_progress' && (
            <>
              <TouchableOpacity 
                style={[styles.pauseButton, { backgroundColor: colors.warning }]} 
                onPress={() => handleStatusChange('pending')}
              >
                <Pause size={20} color="#FFFFFF" />
                <Text style={styles.pauseButtonText}>Pausar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.completeButton, { backgroundColor: colors.success }]} 
                onPress={() => handleStatusChange('completed')}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.completeButtonText}>Completar</Text>
              </TouchableOpacity>
            </>
          )}

          {task.status === 'completed' && task.type !== 'approval' && (
            <TouchableOpacity 
              style={[styles.approvalButton, { backgroundColor: colors.secondary }]} 
              onPress={handleRequestApproval}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.approvalButtonText}>Solicitar Aprobación</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
  taskInfo: {
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  taskHeader: {
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
  typeIcon: {
    padding: 12,
    borderRadius: 12,
  },
  taskMainInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 26,
  },
  taskType: {
    fontSize: 14,
    fontWeight: '600',
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
  taskDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressInputField: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 60,
    textAlign: 'center',
  },
  updateProgressButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
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
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 20,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  overdue: {
    color: '#DC2626',
  },
  tagsSection: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approvalsSection: {
    marginBottom: 20,
  },
  approvalCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  approverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  approverAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approverInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  approverDetails: {
    flex: 1,
  },
  approverName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  approvalLevel: {
    fontSize: 12,
  },
  approvalStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  approvalNotes: {
    fontSize: 14,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  approvalDate: {
    fontSize: 12,
  },
  attachmentsSection: {
    marginBottom: 20,
  },
  attachmentsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  attachmentContainer: {
    position: 'relative',
    width: 120,
    height: 90,
  },
  attachment: {
    width: 120,
    height: 90,
    borderRadius: 8,
  },
  attachmentIndex: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  commentsSection: {
    marginBottom: 20,
  },
  commentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    marginBottom: 12,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#2563EB',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
  },
  commentContent: {
    fontSize: 16,
    lineHeight: 22,
  },
  commentAttachments: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  commentAttachment: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  addCommentSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  attachButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  startButton: {
    flex: 1,
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
  pauseButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completeButton: {
    flex: 1,
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
  approvalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  approvalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});