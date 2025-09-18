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
import { X, Monitor, Clock, User, MessageCircle, Paperclip, Camera, Send, CircleCheck as CheckCircle, Play, Smartphone, Wifi, Mail, Phone, Printer, TriangleAlert as AlertTriangle, Building, Users, Save } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useITSupportStore } from '../stores/itSupportStore';
import { useAuthStore } from '../stores/authStore';

interface ITTicketDetailModalProps {
  readonly ticket: any;
  readonly visible: boolean;
  readonly onClose: () => void;
}

export function ITTicketDetailModal({ ticket, visible, onClose }: ITTicketDetailModalProps) {
  const { updateTicketStatus, addComment, addAttachment, assignTicket } = useITSupportStore();
  const { user } = useAuthStore();
  
  const [newComment, setNewComment] = useState('');
  const [resolution, setResolution] = useState('');
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!ticket) return null;

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
      case 'resolved': return '#16A34A';
      case 'closed': return '#6B7280';
      case 'in_progress': return '#8B5CF6';
      case 'waiting_user': return '#F59E0B';
      default: return '#DC2626';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hardware': return Monitor;
      case 'software': return Smartphone;
      case 'network': return Wifi;
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'printer': return Printer;
      default: return AlertTriangle;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      hardware: 'Hardware',
      software: 'Software',
      network: 'Red/Internet',
      email: 'Email',
      phone: 'Teléfono',
      printer: 'Impresora',
      other: 'Otro',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      open: 'Abierto',
      in_progress: 'En Progreso',
      waiting_user: 'Esperando Usuario',
      resolved: 'Resuelto',
      closed: 'Cerrado',
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else {
      return date.toLocaleDateString('es-ES');
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
        addAttachment(ticket.id, result.assets[0].uri);
        Alert.alert('Éxito', 'Foto agregada al ticket');
      }
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      Alert.alert('Error', 'No se pudo acceder a la cámara');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Escribe un comentario');
      return;
    }

    try {
      await addComment(ticket.id, newComment.trim());
      setNewComment('');
      Alert.alert('Éxito', 'Comentario agregado');
    } catch (error) {
      console.error('Error al agregar comentario:', error);
      Alert.alert('Error', 'No se pudo agregar el comentario');
    }
  };

  const handleAssignToMe = async () => {
    if (!user) return;
    
    Alert.alert(
      'Asignar Ticket',
      '¿Deseas asignarte este ticket?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Asignar', 
          onPress: () => {
            void (async () => {
              try {
                await assignTicket(ticket.id, user.name);
                Alert.alert('Éxito', 'Ticket asignado correctamente');
              } catch (error) {
                console.error('Error al asignar ticket:', error);
                Alert.alert('Error', 'No se pudo asignar el ticket');
              }
            })();
          }
        },
      ]
    );
  };

  const handleStartWork = async () => {
    try {
      await updateTicketStatus(ticket.id, 'in_progress');
      Alert.alert('Éxito', 'Trabajo iniciado en el ticket');
    } catch (error) {
      console.error('Error al iniciar trabajo:', error);
      Alert.alert('Error', 'No se pudo iniciar el trabajo');
    }
  };

  const handleResolveTicket = async () => {
    if (!resolution.trim()) {
      Alert.alert('Error', 'Describe la solución aplicada');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTicketStatus(ticket.id, 'resolved', resolution.trim());
      setShowResolutionForm(false);
      setResolution('');
      Alert.alert('Éxito', 'Ticket resuelto correctamente');
    } catch (error) {
      console.error('Error al resolver ticket:', error);
      Alert.alert('Error', 'No se pudo resolver el ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColor = getPriorityColor(ticket.priority);
  const statusColor = getStatusColor(ticket.status);
  const CategoryIcon = getCategoryIcon(ticket.category);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#64748B" />
          </TouchableOpacity>
          <Text style={styles.title}>Ticket TIC</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ticket Info */}
          <View style={styles.ticketInfo}>
            <View style={styles.ticketHeader}>
              <View style={styles.categorySection}>
                <CategoryIcon size={24} color="#8B5CF6" />
                <View style={styles.ticketMainInfo}>
                  <Text style={styles.ticketNumber}>{ticket.ticketNumber}</Text>
                  <Text style={styles.categoryText}>{getCategoryLabel(ticket.category)}</Text>
                </View>
              </View>
              
              <View style={styles.badges}>
                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
                  <Text style={[styles.priorityText, { color: priorityColor }]}>
                    {getPriorityLabel(ticket.priority)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>
                    {getStatusLabel(ticket.status)}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketDescription}>{ticket.description}</Text>
          </View>

          {/* Location and Users */}
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Detalles del Ticket</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailItem}>
                <Building size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Ubicación</Text>
                  <Text style={styles.detailValue}>
                    {ticket.location.building} - Piso {ticket.location.floor}
                    {ticket.location.office && ` - ${ticket.location.office}`}
                  </Text>
                  {ticket.location.description && (
                    <Text style={styles.detailDescription}>
                      {ticket.location.description}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.detailItem}>
                <User size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Reportado por</Text>
                  <Text style={styles.detailValue}>{ticket.reportedBy}</Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Users size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Usuarios afectados</Text>
                  <Text style={styles.detailValue}>
                    {ticket.affectedUsers.join(', ')}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Clock size={20} color="#64748B" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Creado</Text>
                  <Text style={styles.detailValue}>
                    {formatTime(ticket.createdAt)}
                  </Text>
                </View>
              </View>

              {ticket.assignedTo && (
                <View style={styles.detailItem}>
                  <User size={20} color="#8B5CF6" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Asignado a</Text>
                    <Text style={styles.detailValue}>{ticket.assignedTo}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Attachments */}
          {ticket.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <Text style={styles.sectionTitle}>
                <Paperclip size={20} color="#374151" /> Archivos Adjuntos
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.attachmentsRow}>
                  {ticket.attachments.map((attachment: string, index: number) => (
                    <View key={attachment} style={styles.attachmentContainer}>
                      <Image source={{ uri: attachment }} style={styles.attachment} />
                      <Text style={styles.attachmentIndex}>{index + 1}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Comments */}
          <View style={styles.commentsSection}>
            <Text style={styles.sectionTitle}>
              <MessageCircle size={20} color="#374151" /> Comentarios
            </Text>
            
            {ticket.comments.map((comment: any) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthor}>
                    <View style={styles.authorAvatar}>
                      <Text style={styles.authorInitial}>
                        {comment.authorName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.authorInfo}>
                      <Text style={styles.authorName}>{comment.authorName}</Text>
                      <Text style={styles.commentTime}>
                        {formatTime(comment.createdAt)}
                      </Text>
                    </View>
                  </View>
                  
                  {comment.isInternal && (
                    <View style={styles.internalBadge}>
                      <Text style={styles.internalText}>Interno</Text>
                    </View>
                  )}
                </View>
                
                <Text style={styles.commentContent}>{comment.content}</Text>
                
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
            <View style={styles.addCommentSection}>
              <TextInput
                style={styles.commentInput}
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Agregar comentario o actualización..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />
              
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.attachButton} onPress={() => { void handleTakePhoto(); }}>
                  <Camera size={20} color="#64748B" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                  onPress={() => { void handleAddComment(); }}
                  disabled={!newComment.trim()}
                >
                  <Send size={20} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Resolution */}
          {ticket.resolution && (
            <View style={styles.resolutionSection}>
              <Text style={styles.sectionTitle}>
                <CheckCircle size={20} color="#16A34A" /> Solución Aplicada
              </Text>
              <View style={styles.resolutionCard}>
                <Text style={styles.resolutionText}>{ticket.resolution}</Text>
                {ticket.resolvedAt && (
                  <Text style={styles.resolvedAt}>
                    Resuelto: {new Date(ticket.resolvedAt).toLocaleString('es-ES')}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Resolution Form */}
          {showResolutionForm && (
            <View style={styles.resolutionForm}>
              <Text style={styles.sectionTitle}>Resolver Ticket</Text>
              <TextInput
                style={styles.resolutionInput}
                value={resolution}
                onChangeText={setResolution}
                placeholder="Describe la solución aplicada, pasos realizados, configuraciones cambiadas..."
                multiline
                numberOfLines={4}
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          {ticket.status === 'open' && !ticket.assignedTo && (
            <TouchableOpacity 
              style={styles.assignButton} 
              onPress={() => { void handleAssignToMe(); }}
            >
              <User size={20} color="#FFFFFF" />
              <Text style={styles.assignButtonText}>Asignarme</Text>
            </TouchableOpacity>
          )}

          {ticket.status === 'open' && ticket.assignedTo && (
            <TouchableOpacity 
              style={styles.startButton} 
              onPress={() => { void handleStartWork(); }}
            >
              <Play size={20} color="#FFFFFF" />
              <Text style={styles.startButtonText}>Iniciar Trabajo</Text>
            </TouchableOpacity>
          )}

          {ticket.status === 'in_progress' && !showResolutionForm && (
            <TouchableOpacity 
              style={styles.resolveButton} 
              onPress={() => setShowResolutionForm(true)}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.resolveButtonText}>Resolver Ticket</Text>
            </TouchableOpacity>
          )}

          {showResolutionForm && (
            <>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowResolutionForm(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, isSubmitting && styles.buttonDisabled]} 
                onPress={() => { void handleResolveTicket(); }}
                disabled={isSubmitting}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  {isSubmitting ? 'Resolviendo...' : 'Resolver'}
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
  },
  categorySection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ticketMainInfo: {
    flex: 1,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
  },
  categoryText: {
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
  ticketTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 26,
  },
  ticketDescription: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  detailsSection: {
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
  detailsCard: {
    backgroundColor: '#FFFFFF',
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
    color: '#64748B',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  detailDescription: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  authorAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#8B5CF6',
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
    color: '#1E293B',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#64748B',
  },
  internalBadge: {
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  internalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#DC2626',
  },
  commentContent: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 8,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  commentInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1E293B',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
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
  resolutionSection: {
    marginBottom: 20,
  },
  resolutionCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#16A34A',
  },
  resolutionText: {
    fontSize: 16,
    color: '#166534',
    lineHeight: 24,
    marginBottom: 8,
  },
  resolvedAt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  resolutionForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  resolutionInput: {
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
  assignButton: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 56,
  },
  assignButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  resolveButton: {
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
  resolveButtonText: {
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